(function (global) {
  'use strict';

  const GAME_STATUSES = ['想玩', '在玩', '已通关', '弃坑'];

  function newId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }

  function ensureGames(state) {
    if (!state.games) state.games = {};
    if (!Array.isArray(state.games.games)) state.games.games = [];
    if (!Array.isArray(state.games.progress)) state.games.progress = [];
    if (!Array.isArray(state.games.wishlist)) state.games.wishlist = [];
    if (!Array.isArray(state.games.logs)) state.games.logs = [];
    return state.games;
  }

  function addGame(state, fields) {
    const g = ensureGames(state);
    const name = String((fields && fields.name) || '').trim();
    if (!name) throw new Error('游戏名称不能为空');
    const game = {
      id: newId('game'),
      name: name,
      platform: (fields && fields.platform) || '',
      status: (fields && fields.status) || '想玩'
    };
    g.games.push(game);
    return game;
  }

  function updateGame(state, id, patch) {
    const game = ensureGames(state).games.find((x) => x.id === id);
    if (!game) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') game[k] = patch[k]; });
    return game;
  }

  function deleteGame(state, id) {
    const g = ensureGames(state);
    g.games = g.games.filter((x) => x.id !== id);
    g.progress = g.progress.filter((x) => x.gameId !== id);
  }

  function statusCounts(games) {
    const counts = {};
    GAME_STATUSES.forEach((s) => { counts[s] = 0; });
    (games || []).forEach((g) => { if (counts[g.status] !== undefined) counts[g.status] += 1; });
    return counts;
  }

  function addProgress(state, fields) {
    const g = ensureGames(state);
    const current = String((fields && fields.current) || '').trim();
    if (!current) throw new Error('进度内容不能为空');
    const item = {
      id: newId('progress'),
      gameId: (fields && fields.gameId) || '',
      current: current,
      percent: (fields && fields.percent) || '',
      achievements: (fields && fields.achievements) || ''
    };
    g.progress.push(item);
    return item;
  }

  function deleteProgress(state, id) {
    const g = ensureGames(state);
    g.progress = g.progress.filter((x) => x.id !== id);
  }

  function progressByGame(state, gameId) {
    return ensureGames(state).progress.filter((x) => x.gameId === gameId);
  }

  function addWish(state, fields) {
    const g = ensureGames(state);
    const name = String((fields && fields.name) || '').trim();
    if (!name) throw new Error('愿望单名称不能为空');
    const item = {
      id: newId('wish'),
      name: name,
      type: (fields && fields.type) || '游戏',
      note: (fields && fields.note) || ''
    };
    g.wishlist.push(item);
    return item;
  }

  function deleteWish(state, id) {
    const g = ensureGames(state);
    g.wishlist = g.wishlist.filter((x) => x.id !== id);
  }

  function addLog(state, fields) {
    const g = ensureGames(state);
    const date = (fields && fields.date) || '';
    const content = String((fields && fields.content) || '').trim();
    if (!date || !content) throw new Error('日期和内容不能为空');
    const item = {
      id: newId('glog'),
      date: date,
      type: (fields && fields.type) || '游戏',
      content: content,
      hours: (fields && fields.hours) || '',
      feeling: (fields && fields.feeling) || ''
    };
    g.logs.push(item);
    return item;
  }

  function deleteLog(state, id) {
    const g = ensureGames(state);
    g.logs = g.logs.filter((x) => x.id !== id);
  }

  function gameName(state, gameId) {
    const game = ensureGames(state).games.find((x) => x.id === gameId);
    return game ? game.name : '（未关联游戏）';
  }

  const api = {
    GAME_STATUSES: GAME_STATUSES,
    newId: newId,
    addGame: addGame,
    updateGame: updateGame,
    deleteGame: deleteGame,
    statusCounts: statusCounts,
    addProgress: addProgress,
    deleteProgress: deleteProgress,
    progressByGame: progressByGame,
    addWish: addWish,
    deleteWish: deleteWish,
    addLog: addLog,
    deleteLog: deleteLog,
    gameName: gameName
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.AppGames = api;
})(typeof window !== 'undefined' ? window : globalThis);
