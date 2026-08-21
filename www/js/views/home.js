(function () {
  'use strict';
  window.Views = window.Views || {};

  function progressBar(percent) {
    return UI.el('div', { class: 'progress' }, UI.el('span', { style: 'width:' + percent + '%' }));
  }

  function fmtBackup(time) {
    if (!time) return '尚未备份';
    return '上次备份 ' + new Date(time).toLocaleDateString('zh-CN');
  }

  function moduleCard(route, title, lines) {
    return UI.el('div', { class: 'card module-card', onclick: function () { location.hash = route; } },
      UI.el('h4', { text: title }),
      (lines || []).map(function (l) { return UI.el('div', { class: 'muted', text: l }); })
    );
  }

  function cardDefs(s) {
    return {
      media: { route: '#/media', title: '自媒体', lines: ['草稿 ' + s.media.drafts, '待发布 ' + s.media.pending] },
      dev: { route: '#/dev', title: '开发工作', lines: ['进行中 ' + s.dev.ongoing, '待办 ' + s.dev.todo] },
      consulting: { route: '#/consulting', title: '咨询工作', lines: ['客户 ' + s.consulting.clients, '今日约见 ' + s.consulting.todayEvents, '待跟进 ' + s.consulting.pendingFollowups] },
      fitness: { route: '#/fitness', title: '健身计划', lines: [s.fitness.today] },
      diet: { route: '#/diet', title: '饮食计划', lines: ['已记 ' + s.diet.meals + ' 餐', '热量 ' + s.diet.caloriePercent + '%'] },
      novels: { route: '#/novels', title: '小说阅读', lines: ['在读：' + s.novels.reading, '想看 ' + s.novels.want + ' 本'] },
      dataDevice: { route: '#/data-device', title: '数据与设备', lines: [fmtBackup(s.dataDevice.lastBackupAt), '设备 ' + s.dataDevice.deviceCount + ' 条'] }
    };
  }

  function openCustomizeModal(state) {
    const defs = cardDefs(AppSummary.moduleSummaries(state));
    const list = UI.el('div');
    AppHomeConfig.CARD_IDS.forEach((id) => {
      const visible = AppHomeConfig.visibleCards(state).indexOf(id) >= 0;
      const cb = UI.el('input', { type: 'checkbox', checked: visible ? 'checked' : null });
      cb.addEventListener('change', function () {
        AppStore.mutate(function (st) { AppHomeConfig.setVisible(st, id, cb.checked); });
      });
      list.appendChild(UI.el('div', { class: 'list-item' },
        cb,
        UI.el('span', { text: defs[id].title }),
        UI.el('span', { class: 'spacer' }),
        UI.el('button', { class: 'btn', text: '上移', onclick: function () { AppStore.mutate(function (st) { AppHomeConfig.move(st, id, -1); }); window.App.render(); } }),
        UI.el('button', { class: 'btn', text: '下移', onclick: function () { AppStore.mutate(function (st) { AppHomeConfig.move(st, id, 1); }); window.App.render(); } })
      ));
    });
    UI.modal({ title: '定制首页卡片', body: list, actions: [{ text: '完成', value: true, class: 'btn-primary' }] }).then(function () { window.App.render(); });
  }

  function memoList(state) {
    const memos = (state.memos || []).slice(0, 10);
    if (!memos.length) return UI.emptyState('还没有备忘', '在上面输入，回车即可添加');
    const list = UI.el('div');
    memos.forEach(function (m) {
      const cb = UI.el('input', { type: 'checkbox', checked: m.done ? 'checked' : null });
      cb.addEventListener('change', function () {
        AppStore.mutate(function (st) { AppSummary.toggleMemo(st, m.id); });
        window.App.render();
      });
      const label = UI.el('span', { class: m.done ? 'done' : '', text: m.text });
      const del = UI.el('button', { class: 'btn', text: '删除' });
      del.addEventListener('click', function () {
        UI.confirm('删除这条备忘？', { danger: true }).then(function (ok) {
          if (!ok) return;
          AppStore.mutate(function (st) { AppSummary.deleteMemo(st, m.id); });
          window.App.render();
        });
      });
      list.appendChild(UI.el('div', { class: 'list-item' }, cb, label, UI.el('span', { class: 'spacer' }), del));
    });
    return list;
  }

  window.Views.home = function (container) {
    const state = AppStore.get();
    const today = AppSummary.todayStr();
    const plans = AppSummary.todayPlans(state, today);
    const ps = AppSummary.planSummary(plans);
    const s = AppSummary.moduleSummaries(state);
    const defs = cardDefs(s);

    const planCard = UI.el('div', { class: 'card' },
      UI.el('h3', { text: '今日计划' }),
      UI.el('div', { class: 'muted' }, '今日 ' + ps.total + ' 项 · 完成 ' + ps.done + ' 项'),
      progressBar(ps.percent),
      UI.el('button', { class: 'btn', style: 'margin-top:12px', onclick: function () { location.hash = '#/plan'; } }, '查看全部 →')
    );

    const memoCard = UI.el('div', { class: 'card' },
      UI.el('h3', { text: '快速备忘' }),
      UI.el('div', { class: 'toolbar' },
        UI.el('input', { id: 'memo-input', type: 'text', placeholder: '写点什么…' }),
        UI.el('button', { id: 'memo-add', class: 'btn btn-primary' }, '添加')
      ),
      memoList(state)
    );

    const top = UI.el('div', { class: 'grid cols-2' }, planCard, memoCard);

    const customizeBtn = UI.el('button', { class: 'btn btn-secondary', text: '定制首页', onclick: function () { openCustomizeModal(state); } });
    const header = UI.el('div', { class: 'toolbar', style: 'margin-top:20px' }, UI.el('h3', { text: '各模块摘要', style: 'margin:0' }), UI.el('span', { class: 'spacer' }), customizeBtn);

    const cards = UI.el('div', { class: 'grid cols-4' }, AppHomeConfig.visibleCards(state).map(function (id) {
      const d = defs[id];
      return moduleCard(d.route, d.title, d.lines);
    }));

    const view = UI.el('section', { class: 'view' }, top, header, cards);
    UI.renderInto(container, view);

    view.querySelector('#memo-add').addEventListener('click', function () {
      const input = view.querySelector('#memo-input');
      const text = input.value;
      if (!text.trim()) return;
      AppStore.mutate(function (st) { AppSummary.addMemo(st, text); });
      input.value = '';
      window.App.render();
    });
    view.querySelector('#memo-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); view.querySelector('#memo-add').click(); }
    });
  };
})();
