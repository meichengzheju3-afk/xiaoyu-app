(function (global) {
  'use strict';

  function ensureTrash(state) {
    if (!Array.isArray(state.trash)) state.trash = [];
    return state.trash;
  }

  function archive(state, key, item) {
    if (!state || !item) return null;
    const entry = {
      id: 'trash-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      key: key,
      item: item,
      deletedAt: new Date().toISOString()
    };
    ensureTrash(state).unshift(entry);
    return entry;
  }

  function list(state) {
    return ensureTrash(state);
  }

  function restore(state, id) {
    const trash = ensureTrash(state);
    const idx = trash.findIndex((t) => t.id === id);
    if (idx < 0) return null;
    const entry = trash[idx];
    if (Array.isArray(state[entry.key])) state[entry.key].push(entry.item);
    else if (state[entry.key] && typeof state[entry.key] === 'object') state[entry.key].push(entry.item);
    trash.splice(idx, 1);
    return entry.item;
  }

  function purge(state, id) {
    state.trash = ensureTrash(state).filter((t) => t.id !== id);
  }

  function purgeExpired(state, days) {
    const limit = Date.now() - (days || 30) * 24 * 60 * 60 * 1000;
    state.trash = ensureTrash(state).filter((t) => new Date(t.deletedAt).getTime() > limit);
    return state.trash;
  }

  function backupReminder(state, days) {
    const last = (state && state.meta && state.meta.lastBackupAt) || null;
    if (!last) return true;
    const limit = (days || 7) * 24 * 60 * 60 * 1000;
    return Date.now() - new Date(last).getTime() > limit;
  }

  const api = { ensureTrash: ensureTrash, archive: archive, list: list, restore: restore, purge: purge, purgeExpired: purgeExpired, backupReminder: backupReminder };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.AppTrash = api;
})(typeof window !== 'undefined' ? window : globalThis);
