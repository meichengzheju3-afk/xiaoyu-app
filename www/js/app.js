(function () {
  'use strict';

  function applyTheme(theme) {
    const t = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    const btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
  }

  function render() {
    const route = AppRouter.resolveRoute(location.hash);
    document.querySelectorAll('.nav-item').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === route.hash);
    });
    document.getElementById('page-title').textContent = route.title;
    const container = document.getElementById('view');
    const fn = window.Views && window.Views[route.name];
    if (fn) {
      fn(container);
    } else {
      UI.renderInto(container, UI.el('section', { class: 'view' }, UI.emptyState(route.title, '功能开发中')));
    }
  }

  function hideSearchDropdown() {
    const old = document.querySelector('.search-dropdown');
    if (old) old.remove();
  }

  function showSearchDropdown(keyword, results) {
    hideSearchDropdown();
    const actions = document.querySelector('.top-actions');
    if (!actions) return;
    actions.style.position = 'relative';
    const box = UI.el('div', { class: 'search-dropdown' });
    box.style.cssText = 'position:absolute; top:100%; right:0; width:360px; max-height:420px; overflow:auto; background:var(--panel); border:1px solid var(--border); border-radius:16px; box-shadow:var(--shadow); z-index:60;';
    if (!results.length) box.appendChild(UI.el('div', { class: 'muted', style: 'padding:12px', text: '没有匹配「' + keyword + '」的结果' }));
    else results.forEach((r) => {
      box.appendChild(UI.el('div', { class: 'list-item', style: 'cursor:pointer', onclick: function () { hideSearchDropdown(); location.hash = r.route; } },
        UI.el('span', { class: 'badge gray', text: r.module }),
        UI.el('span', { html: AppSearch.highlight(r.title, keyword) })
      ));
    });
    actions.appendChild(box);
  }

  function openCommandPanel() {
    const old = document.querySelector('.command-panel');
    if (old) return;
    const root = UI.el('div', { class: 'command-panel' });
    const box = UI.el('div', { class: 'command-box' });
    const input = UI.el('input', { class: 'command-input', type: 'text', placeholder: '输入关键词搜索并跳转…' });
    const results = UI.el('div', { class: 'command-results' });
    function refresh() {
      results.replaceChildren();
      const items = AppSearch.searchAll(AppStore.get(), input.value);
      if (!items.length) results.appendChild(UI.el('div', { class: 'muted', style: 'padding:14px', text: '没有匹配结果' }));
      items.forEach((r) => {
        results.appendChild(UI.el('div', { class: 'list-item', style: 'cursor:pointer', onclick: function () { close(); location.hash = r.route; } },
          UI.el('span', { class: 'badge gray', text: r.module }),
          UI.el('span', { html: AppSearch.highlight(r.title, keyword) })
        ));
      });
    }
    function close() { root.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
    input.addEventListener('input', refresh);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const first = results.querySelector('.list-item'); if (first) first.click(); } });
    box.appendChild(input);
    box.appendChild(results);
    root.appendChild(box);
    root.addEventListener('click', (e) => { if (e.target === root) close(); });
    document.body.appendChild(root);
    document.addEventListener('keydown', onKey);
    setTimeout(() => input.focus(), 0);
    refresh();
  }

  function openQuickAdd() {
    const title = UI.el('input', { type: 'text', placeholder: '写点什么…' });
    const date = UI.el('input', { type: 'date', value: AppSummary.todayStr() });
    UI.modal({
      title: '快速新建',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, title, date),
      actions: [
        { text: '添加备忘', value: 'memo', class: 'btn-secondary' },
        { text: '添加今日任务', value: 'task', class: 'btn-primary' }
      ]
    }).then((kind) => {
      if (!kind) return;
      if (!title.value.trim()) { UI.toast('请输入内容'); return; }
      AppStore.mutate((st) => {
        if (kind === 'memo') AppSummary.addMemo(st, title.value);
        else AppPlan.addPlan(st, { title: title.value, date: date.value, priority: '中', module: '' });
      });
      UI.toast('已添加', 'success');
      if (kind === 'task') location.hash = '#/plan';
      else window.App.render();
    });
  }

  function showSaved() {
    const el = document.getElementById('save-status');
    if (!el) return;
    el.textContent = '✓ 已保存';
    el.style.color = 'var(--mint)';
    clearTimeout(showSaved.timer);
    showSaved.timer = setTimeout(() => { el.textContent = ''; }, 1400);
  }


  function initNightDeco() {
    const deco = document.getElementById('night-deco');
    if (!deco) return;
    for (let i = 0; i < 70; i += 1) {
      const star = UI.el('span', { class: 'star' });
      star.style.left = (Math.random() * 100) + '%';
      star.style.top = (Math.random() * 100) + '%';
      star.style.width = star.style.height = (1 + Math.random() * 2) + 'px';
      star.style.animationDelay = (Math.random() * 4) + 's';
      star.style.animationDuration = (2 + Math.random() * 3) + 's';
      deco.appendChild(star);
    }
    for (let i = 0; i < 14; i += 1) {
      const firefly = UI.el('span', { class: 'firefly' });
      firefly.style.left = (Math.random() * 100) + '%';
      firefly.style.top = (Math.random() * 100) + '%';
      firefly.style.animationDelay = (Math.random() * 6) + 's';
      deco.appendChild(firefly);
    }
  }

  const GREETINGS = [
    '今天也要元气满满呀 🌸',
    '欢迎回来，小余 ☁️',
    '慢慢来，一切都会变好 ✨',
    '记得喝水，也记得休息 🌙',
    '今天也要对自己温柔一点 🍑'
  ];

  let audioContext = null;
  let masterGain = null;
  let padGain = null;
  let natureGain = null;
  let padTimers = [];
  let natureTimers = [];
  let chordIndex = 0;
  let musicOn = false;

  function openSidebar() {
    document.querySelector('.sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('show');
  }

  function closeSidebar() {
    const sb = document.querySelector('.sidebar');
    if (sb) sb.classList.remove('open');
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  function initSidebar() {
    document.getElementById('menu-btn').addEventListener('click', openSidebar);
    document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
    document.getElementById('nav').addEventListener('click', (e) => {
      if (e.target.closest('.nav-item')) closeSidebar();
    });
  }

  const chords = [
    [174.61, 220.00, 261.63, 329.63],
    [130.81, 164.81, 196.00, 246.94],
    [220.00, 261.63, 329.63, 392.00],
    [146.83, 196.00, 246.94, 293.66]
  ];
  function createImpulseResponse(duration, decay) {
    const rate = audioContext.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = audioContext.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.02;
    compressor.release.value = 0.3;

    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.9;

    const convolver = audioContext.createConvolver();
    convolver.buffer = createImpulseResponse(3.5, 2.5);

    padGain = audioContext.createGain();
    padGain.gain.value = 1.0;

    natureGain = audioContext.createGain();
    natureGain.gain.value = 0.5;

    padGain.connect(convolver);
    convolver.connect(masterGain);
    natureGain.connect(masterGain);
    masterGain.connect(compressor);
    compressor.connect(audioContext.destination);
  }

  function playPadChord(freqs, duration) {
    const now = audioContext.currentTime;
    freqs.forEach((freq) => {
      [1, 1.004].forEach((detune) => {
        const osc = audioContext.createOscillator();
        const g = audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq * detune;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.045, now + 1.4);
        g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(g);
        g.connect(padGain);
        osc.start(now);
        osc.stop(now + duration);
      });
    });
  }

  function schedulePad() {
    if (!musicOn || !audioContext) return;
    const duration = 4.5 + Math.random() * 1.5;
    playPadChord(chords[chordIndex], duration);
    chordIndex = (chordIndex + 1) % chords.length;
    padTimers.push(setTimeout(schedulePad, (duration - 0.4) * 1000));
  }

  function birdChirp(time) {
    const blips = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < blips; i++) {
      const t = time + i * (0.12 + Math.random() * 0.08);
      const osc = audioContext.createOscillator();
      const g = audioContext.createGain();
      osc.type = 'sine';
      const base = 2400 + Math.random() * 1600;
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.45, t + 0.04);
      osc.frequency.exponentialRampToValueAtTime(base * 0.85, t + 0.11);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(g);
      g.connect(natureGain);
      osc.start(t);
      osc.stop(t + 0.14);
    }
  }

  function cricketChirp(time) {
    const pulses = 3 + Math.floor(Math.random() * 4);
    const osc = audioContext.createOscillator();
    const g = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = 4200 + Math.random() * 500;
    for (let i = 0; i < pulses; i++) {
      const t = time + i * 0.08;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.025, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
    }
    osc.connect(g);
    g.connect(natureGain);
    osc.start(time);
    osc.stop(time + pulses * 0.08 + 0.06);
  }

  function scheduleNature() {
    if (!musicOn || !audioContext) return;
    const delay = 700 + Math.random() * 2600;
    natureTimers.push(setTimeout(() => {
      if (!musicOn || !audioContext) return;
      const now = audioContext.currentTime + 0.05;
      if (Math.random() < 0.35) birdChirp(now);
      if (Math.random() < 0.75) cricketChirp(now);
      scheduleNature();
    }, delay));
  }

  function setMusicUI(on) {
    musicOn = on;
    const btn = document.getElementById('music-btn');
    if (btn) {
      btn.classList.toggle('playing', on);
      btn.textContent = on ? '🎶' : '🎵';
    }
  }

  function startMusic() {
    if (!audioContext) initAudio();
    audioContext.resume().catch(() => {});
    setMusicUI(true);
    chordIndex = 0;
    schedulePad();
    scheduleNature();
  }

  function stopMusic() {
    setMusicUI(false);
    padTimers.forEach(clearTimeout);
    natureTimers.forEach(clearTimeout);
    padTimers = [];
    natureTimers = [];
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
  }

  function toggleMusic() {
    if (musicOn) stopMusic(); else startMusic();
  }


  let deferredPrompt = null;

  function initInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const btn = document.getElementById('install-btn');
      if (btn) btn.style.display = 'inline-flex';
    });
    const btn = document.getElementById('install-btn');
    if (btn) btn.addEventListener('click', openInstall);
  }

  function openInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
      return;
    }
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const tip = isIOS
      ? 'iOS 安装方法：点击浏览器底部分享按钮，选择“添加到主屏幕”。'
      : '安装方法：点击浏览器菜单，选择“安装应用 / 添加到主屏幕”。';
    UI.modal({
      title: '安装 App',
      body: UI.el('p', { text: tip }),
      actions: [{ text: '知道了', value: true, class: 'btn-primary' }]
    });
  }
  function showGreeting() {
    const text = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    const wrap = UI.el('div', { class: 'greeting' }, UI.el('div', { class: 'greeting-text', text: text }));
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 2000);
  }
  async function init() {
    initNightDeco();
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch(() => {});
      });
    }
    document.getElementById('today').textContent = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
    document.getElementById('backup-btn').addEventListener('click', () => { location.hash = '#/data-device'; });
    document.getElementById('theme-btn').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      AppStore.mutate((st) => { st.meta = st.meta || {}; st.meta.theme = next; });
    });
    document.getElementById('fab').addEventListener('click', openQuickAdd);
    window.addEventListener('hashchange', render);
    document.addEventListener('app:saved', showSaved);

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCommandPanel(); }
      else if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) { e.preventDefault(); openQuickAdd(); }
      }
    });

    const searchInput = document.getElementById('global-search');
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const kw = searchInput.value.trim();
        if (!kw) { hideSearchDropdown(); return; }
        showSearchDropdown(kw, AppSearch.searchAll(AppStore.get(), kw));
      }
    });
    searchInput.addEventListener('input', () => { if (!searchInput.value.trim()) hideSearchDropdown(); });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-dropdown') && !e.target.closest('#global-search')) hideSearchDropdown();
    });

    try {
      const state = await AppApi.getState();
      AppStore.set(state);
      applyTheme((state.meta && state.meta.theme) || 'light');
    } catch (e) {
      console.error(e);
      UI.toast('数据加载失败', 'error');
    }
    render();
    showGreeting();
  }

  window.App = { init: init, render: render, applyTheme: applyTheme, openCommandPanel: openCommandPanel, openSidebar: openSidebar, closeSidebar: closeSidebar, toggleMusic: toggleMusic, openInstall: openInstall };
  document.addEventListener('DOMContentLoaded', init);
})();







