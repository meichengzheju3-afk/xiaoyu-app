(function (global) {
  'use strict';

  const DB_NAME = 'xiaoyu-app-db';
  const DB_VERSION = 1;

  function defaultState() {
    const now = new Date().toISOString();
    return {
      meta: { version: 2, lastSavedAt: now, lastBackupAt: null },
      memos: [],
      plans: [],
      media: { ideas: [], contents: [], schedule: [] },
      dev: { projects: [], cards: [], issues: [], notes: [], logs: [] },
      consulting: { clients: [], cases: [], followups: [], events: [], notes: [] },
      fitness: { plans: [], logs: [], body: [] },
      diet: { records: [], recipes: [], goal: { calories: null, protein: null, water: null }, water: [], customFoods: [], mealPlans: [] },
      novels: { books: [], progress: [], notes: [], records: [], goal: { booksPerMonth: 0, minutesPerDay: 0 } },
      devices: { items: [] },
      home: { order: ['media', 'dev', 'consulting', 'fitness', 'diet', 'novels', 'dataDevice'], hidden: [] },
      trash: [],
      backups: []
    };
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
        if (!db.objectStoreNames.contains('backups')) db.createObjectStore('backups');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function idbGet(storeName, key) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }

  function idbPut(storeName, key, value) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }));
  }

  function timestamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function getState() {
    const saved = await idbGet('state', 'state');
    if (saved) return saved;
    const def = defaultState();
    await idbPut('state', 'state', def);
    return def;
  }

  async function putState(data) {
    data.meta = data.meta || {};
    data.meta.lastSavedAt = new Date().toISOString();
    await idbPut('state', 'state', data);
    return data;
  }

  async function backup() {
    const state = await getState();
    const file = 'app-data-' + timestamp() + '.json';
    await idbPut('backups', file, JSON.parse(JSON.stringify(state)));
    state.meta.lastBackupAt = new Date().toISOString();
    state.backups = Array.isArray(state.backups) ? state.backups : [];
    state.backups.push({ file: file, time: state.meta.lastBackupAt });
    await putState(state);
    download(file, JSON.stringify(state, null, 2), 'application/json;charset=utf-8');
    return { file: file, time: state.meta.lastBackupAt };
  }

  async function listBackups() {
    const state = await getState();
    return Array.isArray(state.backups) ? state.backups.slice().reverse() : [];
  }

  async function restoreByData(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('无效的数据');
    const merged = Object.assign(defaultState(), data);
    merged.meta = merged.meta || {};
    merged.meta.version = 2;
    merged.meta.restoredAt = new Date().toISOString();
    await putState(merged);
    return merged;
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  async function restoreByFile(file) {
    const text = await readFile(file);
    return restoreByData(JSON.parse(text));
  }

  async function downloadBackup(file) {
    const content = await idbGet('backups', file);
    if (!content) throw new Error('备份不存在');
    download(file, JSON.stringify(content, null, 2), 'application/json;charset=utf-8');
  }

  async function restoreByStored(file) {
    const content = await idbGet('backups', file);
    if (!content) throw new Error('备份不存在');
    return restoreByData(content);
  }

  const api = {
    getState: getState,
    putState: putState,
    backup: backup,
    listBackups: listBackups,
    restoreByData: restoreByData,
    restoreByFile: restoreByFile,
    downloadBackup: downloadBackup,
    restoreByStored: restoreByStored
  };

  global.AppApi = api;
})(window);
