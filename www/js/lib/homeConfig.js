(function (global) {
  'use strict';

  const CARD_IDS = ['media', 'dev', 'consulting', 'fitness', 'diet', 'novels', 'dataDevice'];

  function ensureHome(state) {
    if (!state.home) state.home = {};
    if (!Array.isArray(state.home.order)) state.home.order = CARD_IDS.slice();
    if (!Array.isArray(state.home.hidden)) state.home.hidden = [];
    return state.home;
  }

  function visibleCards(state) {
    const home = ensureHome(state);
    return home.order.filter((id) => home.hidden.indexOf(id) < 0);
  }

  function setVisible(state, id, visible) {
    const home = ensureHome(state);
    home.hidden = home.hidden.filter((x) => x !== id);
    if (!visible) home.hidden.push(id);
    return home;
  }

  function move(state, id, dir) {
    const home = ensureHome(state);
    const idx = home.order.indexOf(id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= home.order.length) return home;
    const tmp = home.order[idx];
    home.order[idx] = home.order[target];
    home.order[target] = tmp;
    return home;
  }

  const api = { CARD_IDS: CARD_IDS, ensureHome: ensureHome, visibleCards: visibleCards, setVisible: setVisible, move: move };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.AppHomeConfig = api;
})(typeof window !== 'undefined' ? window : globalThis);
