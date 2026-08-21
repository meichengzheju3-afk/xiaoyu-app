(function (global) {
  'use strict';
  let state = null;
  let timer = null;
  const listeners = new Set();

  function emit() {
    listeners.forEach((fn) => {
      try { fn(state); } catch (e) { console.error(e); }
    });
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 400);
  }

  function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!state) return Promise.resolve();
    return global.AppApi.putState(state).then((data) => {
      if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('app:saved'));
      return data;
    });
  }

  const store = {
    get: function () { return state; },
    set: function (s) { state = s; schedule(); emit(); },
    mutate: function (fn) { if (state) { fn(state); schedule(); emit(); } },
    on: function (fn) { listeners.add(fn); return () => listeners.delete(fn); },
    flush: flush,
    markSaved: function () { emit(); }
  };

  global.AppStore = store;
})(window);

