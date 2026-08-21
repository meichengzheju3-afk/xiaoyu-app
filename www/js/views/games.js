(function () {
  'use strict';
  window.Views = window.Views || {};

  let gamesTab = 'library';
  let gameStatusFilter = '';
  let selectedGameId = null;

  function tabBar(current) {
    const defs = [['library', '游戏库'], ['progress', '进度'], ['wishlist', '愿望单'], ['logs', '娱乐日志']];
    return UI.el('div', { class: 'tabs' }, defs.map((d) => UI.el('button', {
      class: 'tab' + (current === d[0] ? ' active' : ''),
      text: d[1],
      onclick: function () { gamesTab = d[0]; window.App.render(); }
    })));
  }

  function gameOptions(selected) {
    const state = AppStore.get();
    const games = (state.games && state.games.games) || [];
    return games.map((g) => UI.el('option', { value: g.id, text: g.name, selected: selected === g.id ? 'selected' : null }));
  }

  function libraryTab(state) {
    const games = (state.games && state.games.games) || [];
    const counts = AppGames.statusCounts(games);
    const filter = UI.el('select', { value: gameStatusFilter },
      UI.el('option', { value: '', text: '全部状态' }),
      AppGames.GAME_STATUSES.map((s) => UI.el('option', { value: s, text: s + '（' + counts[s] + '）', selected: gameStatusFilter === s ? 'selected' : null }))
    );
    filter.addEventListener('change', function () { gameStatusFilter = filter.value; window.App.render(); });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加游戏', onclick: function () { openGameModal(); } });

    const filtered = gameStatusFilter ? games.filter((g) => g.status === gameStatusFilter) : games;
    const list = UI.el('div', { class: 'grid cols-3' });
    if (!filtered.length) list.appendChild(UI.emptyState('没有游戏', '添加你拥有的游戏'));
    filtered.forEach(function (g) {
      list.appendChild(UI.el('div', { class: 'card' },
        UI.el('h4', { text: g.name }),
        UI.el('div', { class: 'muted', text: g.platform || '未填平台' }),
        UI.el('div', { style: 'margin-top:6px' }, UI.el('span', { class: 'badge blue', text: g.status })),
        UI.el('div', { class: 'toolbar', style: 'margin-top:8px' },
          UI.el('button', { class: 'btn', text: '编辑', onclick: function () { openGameModal(g); } }),
          UI.el('button', { class: 'btn', text: '删除', onclick: function () {
            UI.confirm('删除游戏「' + g.name + '」及其进度？', { danger: true }).then(function (ok) {
              if (!ok) return;
              AppStore.mutate(function (st) { AppGames.deleteGame(st, g.id); });
              window.App.render();
            });
          } })
        )
      ));
    });

    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, filter, UI.el('span', { class: 'spacer' }), addBtn), list);
  }

  function openGameModal(game) {
    const name = UI.el('input', { type: 'text', placeholder: '游戏名称', value: game ? game.name : '' });
    const platform = UI.el('input', { type: 'text', placeholder: '平台（如 Switch / PC）', value: game ? game.platform : '' });
    const status = UI.el('select', {}, AppGames.GAME_STATUSES.map((s) => UI.el('option', { value: s, text: s, selected: game && game.status === s ? 'selected' : null })));
    UI.modal({
      title: game ? '编辑游戏' : '添加游戏',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, name, platform, status),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!name.value.trim()) { UI.toast('请输入游戏名称'); return; }
      const fields = { name: name.value, platform: platform.value, status: status.value };
      AppStore.mutate(function (st) {
        if (game) AppGames.updateGame(st, game.id, fields);
        else AppGames.addGame(st, fields);
      });
      window.App.render();
    });
  }

  function progressTab(state) {
    const games = (state.games && state.games.games) || [];
    if (!games.length) return UI.el('div', { class: 'card' }, UI.emptyState('先添加游戏', '在游戏库中添加后再记录进度'));
    if (!selectedGameId || !games.find((g) => g.id === selectedGameId)) selectedGameId = games[0].id;
    const sel = UI.el('select', { id: 'progress-game' }, gameOptions(selectedGameId));
    sel.addEventListener('change', function () { selectedGameId = sel.value; window.App.render(); });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加进度', onclick: function () { openProgressModal(); } });

    const progress = AppGames.progressByGame(state, selectedGameId);
    const list = UI.el('div', { class: 'card' });
    if (!progress.length) list.appendChild(UI.emptyState('还没有进度记录'));
    progress.forEach(function (p) {
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { text: p.current || '进度' }),
        p.percent ? UI.el('span', { class: 'badge blue', text: p.percent + '%' }) : null,
        p.achievements ? UI.el('span', { class: 'muted', text: '成就：' + p.achievements }) : null,
        UI.el('span', { class: 'spacer' }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () {
          UI.confirm('删除这条进度？', { danger: true }).then(function (ok) {
            if (!ok) return;
            AppStore.mutate(function (st) { AppGames.deleteProgress(st, p.id); });
            window.App.render();
          });
        } })
      ));
    });

    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, sel, UI.el('span', { class: 'spacer' }), addBtn), list);
  }

  function openProgressModal() {
    const current = UI.el('input', { type: 'text', placeholder: '当前进度（如 第三章）' });
    const percent = UI.el('input', { type: 'number', placeholder: '通关进度 %' });
    const achievements = UI.el('input', { type: 'text', placeholder: '成就（可选）' });
    UI.modal({
      title: '添加进度',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, current, percent, achievements),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!current.value.trim()) { UI.toast('请输入进度内容'); return; }
      AppStore.mutate(function (st) { AppGames.addProgress(st, { gameId: selectedGameId, current: current.value, percent: percent.value, achievements: achievements.value }); });
      window.App.render();
    });
  }

  function wishlistTab(state) {
    const wish = (state.games && state.games.wishlist) || [];
    const name = UI.el('input', { type: 'text', placeholder: '名称' });
    const type = UI.el('select', {}, ['游戏', '影视', '其他'].map((t) => UI.el('option', { value: t, text: t })));
    const note = UI.el('input', { type: 'text', placeholder: '备注（可选）' });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加' });
    addBtn.addEventListener('click', function () {
      if (!name.value.trim()) { UI.toast('请输入名称'); return; }
      AppStore.mutate(function (st) { AppGames.addWish(st, { name: name.value, type: type.value, note: note.value }); });
      window.App.render();
    });
    const list = UI.el('div', { class: 'card' });
    if (!wish.length) list.appendChild(UI.emptyState('愿望单是空的'));
    wish.forEach(function (w) {
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { class: 'badge gray', text: w.type }),
        UI.el('span', { text: w.name }),
        w.note ? UI.el('span', { class: 'muted', text: w.note }) : null,
        UI.el('span', { class: 'spacer' }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () {
          UI.confirm('删除愿望单「' + w.name + '」？', { danger: true }).then(function (ok) {
            if (!ok) return;
            AppStore.mutate(function (st) { AppGames.deleteWish(st, w.id); });
            window.App.render();
          });
        } })
      ));
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, name, type, note, addBtn), list);
  }

  function logsTab(state) {
    const logs = (state.games && state.games.logs) || [];
    const date = UI.el('input', { type: 'date', value: AppSummary.todayStr() });
    const type = UI.el('select', {}, ['游戏', '影视', '其他'].map((t) => UI.el('option', { value: t, text: t })));
    const hours = UI.el('input', { type: 'text', placeholder: '时长（如 2h）' });
    const content = UI.el('input', { type: 'text', placeholder: '内容 / 感想' });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '记录' });
    addBtn.addEventListener('click', function () {
      if (!content.value.trim()) { UI.toast('请输入内容'); return; }
      AppStore.mutate(function (st) { AppGames.addLog(st, { date: date.value, type: type.value, hours: hours.value, content: content.value }); });
      window.App.render();
    });
    const list = UI.el('div', { class: 'card' });
    if (!logs.length) list.appendChild(UI.emptyState('还没有娱乐日志'));
    logs.slice().reverse().forEach(function (l) {
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { class: 'muted', text: l.date }),
        UI.el('span', { class: 'badge gray', text: l.type }),
        UI.el('span', { text: l.content }),
        l.hours ? UI.el('span', { class: 'muted', text: l.hours }) : null,
        UI.el('span', { class: 'spacer' }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () {
          UI.confirm('删除这条日志？', { danger: true }).then(function (ok) {
            if (!ok) return;
            AppStore.mutate(function (st) { AppGames.deleteLog(st, l.id); });
            window.App.render();
          });
        } })
      ));
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, date, type, hours, content, addBtn), list);
  }

  window.Views.games = function (container) {
    const state = AppStore.get();
    let body;
    if (gamesTab === 'library') body = libraryTab(state);
    else if (gamesTab === 'progress') body = progressTab(state);
    else if (gamesTab === 'wishlist') body = wishlistTab(state);
    else body = logsTab(state);
    UI.renderInto(container, UI.el('section', { class: 'view' }, tabBar(gamesTab), body));
  };
})();
