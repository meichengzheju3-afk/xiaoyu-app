(function (global) {
  'use strict';

  function newId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }

  function ensureDevices(state) {
    if (!state.devices) state.devices = {};
    if (!Array.isArray(state.devices.items)) state.devices.items = [];
    return state.devices;
  }

  function addDevice(state, fields) {
    const d = ensureDevices(state);
    const name = String((fields && fields.name) || '').trim();
    if (!name) throw new Error('设备名称不能为空');
    const item = {
      id: newId('device'),
      name: name,
      type: (fields && fields.type) || '',
      purpose: (fields && fields.purpose) || '',
      info: (fields && fields.info) || ''
    };
    d.items.push(item);
    return item;
  }

  function updateDevice(state, id, patch) {
    const item = ensureDevices(state).items.find((x) => x.id === id);
    if (!item) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') item[k] = patch[k]; });
    return item;
  }

  function deleteDevice(state, id) {
    const d = ensureDevices(state);
    const item = d.items.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'devices', item);
    d.items = d.items.filter((x) => x.id !== id);
  }

  function moduleRecordCounts(state) {
    state = state || {};
    const count = (arr) => (Array.isArray(arr) ? arr.length : 0);
    return {
      memos: count(state.memos),
      plans: count(state.plans),
      mediaIdeas: count(state.media && state.media.ideas),
      mediaContents: count(state.media && state.media.contents),
      mediaSchedule: count(state.media && state.media.schedule),
      devProjects: count(state.dev && state.dev.projects),
      devCards: count(state.dev && state.dev.cards),
      devIssues: count(state.dev && state.dev.issues),
      devNotes: count(state.dev && state.dev.notes),
      devLogs: count(state.dev && state.dev.logs),
      consultingClients: count(state.consulting && state.consulting.clients),
      consultingCases: count(state.consulting && state.consulting.cases),
      consultingEvents: count(state.consulting && state.consulting.events),
      consultingNotes: count(state.consulting && state.consulting.notes),
      fitnessPlans: count(state.fitness && state.fitness.plans),
      fitnessLogs: count(state.fitness && state.fitness.logs),
      fitnessBody: count(state.fitness && state.fitness.body),
      dietRecords: count(state.diet && state.diet.records),
      dietRecipes: count(state.diet && state.diet.recipes),
      novelsBooks: count(state.novels && state.novels.books),
      novelsProgress: count(state.novels && state.novels.progress),
      novelsNotes: count(state.novels && state.novels.notes),
      novelsRecords: count(state.novels && state.novels.records),
      devices: count(state.devices && state.devices.items),
      backups: count(state.backups)
    };
  }

  function overview(state) {
    const counts = moduleRecordCounts(state);
    const meta = (state && state.meta) || {};
    return {
      counts: counts,
      lastBackupAt: meta.lastBackupAt || null,
      backupCount: counts.backups
    };
  }

  const api = {
    newId: newId,
    addDevice: addDevice,
    updateDevice: updateDevice,
    deleteDevice: deleteDevice,
    moduleRecordCounts: moduleRecordCounts,
    overview: overview
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.AppDataDevice = api;
})(typeof window !== 'undefined' ? window : globalThis);


