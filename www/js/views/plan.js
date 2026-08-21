(function () {
  'use strict';
  window.Views = window.Views || {};

  let viewDate = null;
  let viewFilter = 'all';
  let planMode = 'day';
  let weekStart = null;

  function priorityBadge(p) {
    const map = { '高': 'high', '中': 'medium', '低': 'low' };
    return UI.el('span', { class: 'badge ' + (map[p] || 'gray'), text: p || '中' });
  }

  function moduleBadge(m) {
    return m ? UI.el('span', { class: 'badge blue', text: m }) : null;
  }

  function recurrenceBadge(r) {
    const map = { daily: '每天', weekly: '每周', monthly: '每月' };
    return r ? UI.el('span', { class: 'badge green', text: map[r] || r }) : null;
  }

  function taskItem(state, plan) {
    const cb = UI.el('input', { type: 'checkbox', checked: plan.done ? 'checked' : null });
    cb.addEventListener('change', function () {
      AppStore.mutate(function (st) { AppPlan.togglePlan(st, plan.id); });
      window.App.render();
    });
    const title = UI.el('span', { class: plan.done ? 'done' : '', text: plan.title });
    const time = plan.time ? UI.el('span', { class: 'muted', text: plan.time }) : null;
    const del = UI.el('button', { class: 'btn', text: '删除' });
    del.addEventListener('click', function () {
      UI.confirm('删除任务「' + plan.title + '」？', { danger: true }).then(function (ok) {
        if (!ok) return;
        AppStore.mutate(function (st) { AppPlan.deletePlan(st, plan.id); });
        window.App.render();
      });
    });
    const item = UI.el('div', { class: 'list-item', draggable: 'true', 'data-id': plan.id },
      cb, title, UI.el('span', { class: 'spacer' }), time, recurrenceBadge(plan.recurrence), priorityBadge(plan.priority), moduleBadge(plan.module), del
    );
    item.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', plan.id); item.classList.add('dragging'); });
    item.addEventListener('dragend', function () { item.classList.remove('dragging'); });
    item.addEventListener('dragover', function (e) { e.preventDefault(); });
    item.addEventListener('drop', function (e) {
      e.preventDefault();
      const listEl = item.parentNode;
      const ids = Array.prototype.slice.call(listEl.querySelectorAll('[data-id]')).map((n) => n.getAttribute('data-id'));
      AppStore.mutate(function (st) { AppPlan.reorderPlans(st, viewDate, ids); });
      window.App.render();
    });
    return item;
  }

  function moduleOptions() {
    return ['', '自媒体', '开发工作', '咨询工作', '健身计划', '饮食计划', '小说阅读', '数据与设备'].map(function (m) {
      return UI.el('option', { value: m, text: m || '（无）' });
    });
  }

  function weekView(state) {
    if (!weekStart) weekStart = AppPlan.addDays(AppPlan.todayStr(), -(new Date(AppPlan.todayStr() + 'T00:00:00').getDay() || 7) + 1);
    const days = [];
    for (let i = 0; i < 7; i += 1) days.push(AppPlan.addDays(weekStart, i));
    const expanded = AppPlan.expandPlans(state, weekStart, 7);
    const prev = UI.el('button', { class: 'btn', text: '◀', onclick: function () { weekStart = AppPlan.addDays(weekStart, -7); window.App.render(); } });
    const next = UI.el('button', { class: 'btn', text: '▶', onclick: function () { weekStart = AppPlan.addDays(weekStart, 7); window.App.render(); } });
    const cols = UI.el('div', { class: 'grid cols-7', style: 'grid-template-columns: repeat(7, 1fr)' });
    days.forEach(function (date) {
      const list = AppPlan.sortPlans(expanded.filter((e) => e.date === date).map((e) => e.plan));
      const cell = UI.el('div', { class: 'card', style: 'padding:10px' },
        UI.el('div', { class: 'muted', text: date.slice(5) }),
        list.length ? list.map((p) => UI.el('div', { class: 'list-item', style: 'padding:4px' }, UI.el('span', { class: p.done ? 'done' : '', text: p.title }))) : UI.el('div', { class: 'muted', text: '无任务' }),
        UI.el('button', { class: 'btn', text: '添加', onclick: function () { planMode = 'day'; viewDate = date; window.App.render(); } })
      );
      cols.appendChild(cell);
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, prev, next), cols);
  }

  window.Views.plan = function (container) {
    if (!viewDate) viewDate = AppPlan.todayStr();
    const state = AppStore.get();
    if (planMode === 'week') {
      const modeBtn = UI.el('button', { class: 'btn btn-secondary', text: '切换到日视图', onclick: function () { planMode = 'day'; window.App.render(); } });
      UI.renderInto(container, UI.el('section', { class: 'view' }, UI.el('div', { class: 'toolbar' }, modeBtn), weekView(state)));
      return;
    }

    const all = AppPlan.sortPlans(AppPlan.byDate(state, viewDate));
    const visible = AppPlan.filterPlans(all, viewFilter);

    const dateInput = UI.el('input', { type: 'date', value: viewDate });
    dateInput.addEventListener('change', function () { viewDate = dateInput.value; window.App.render(); });
    const filterInput = UI.el('select', { value: viewFilter }, UI.el('option', { value: 'all', text: '全部' }), UI.el('option', { value: 'open', text: '仅未完成' }));
    filterInput.addEventListener('change', function () { viewFilter = filterInput.value; window.App.render(); });
    const modeBtn = UI.el('button', { class: 'btn btn-secondary', text: '周视图', onclick: function () { planMode = 'week'; window.App.render(); } });

    const toolbar = UI.el('div', { class: 'toolbar' },
      UI.el('button', { class: 'btn', text: '◀', onclick: function () { viewDate = AppPlan.addDays(viewDate, -1); window.App.render(); } }),
      dateInput,
      UI.el('button', { class: 'btn', text: '▶', onclick: function () { viewDate = AppPlan.addDays(viewDate, 1); window.App.render(); } }),
      UI.el('button', { class: 'btn', text: '今天', onclick: function () { viewDate = AppPlan.todayStr(); window.App.render(); } }),
      filterInput,
      modeBtn,
      UI.el('span', { class: 'spacer' }),
      UI.el('button', { class: 'btn btn-secondary', text: '未完成顺延到明天', onclick: function () {
        const next = AppPlan.addDays(viewDate, 1);
        let n = 0;
        AppStore.mutate(function (st) { n = AppPlan.carryOver(st, viewDate, next); });
        UI.toast('已顺延 ' + n + ' 项到明天', 'success');
        viewDate = next;
        window.App.render();
      } })
    );

    const titleInput = UI.el('input', { id: 'plan-title', type: 'text', placeholder: '任务标题' });
    const timeInput = UI.el('input', { id: 'plan-time', type: 'time' });
    const priInput = UI.el('select', { id: 'plan-priority' }, UI.el('option', { value: '高', text: '高' }), UI.el('option', { value: '中', text: '中', selected: 'selected' }), UI.el('option', { value: '低', text: '低' }));
    const recInput = UI.el('select', { id: 'plan-recurrence' }, UI.el('option', { value: '', text: '不重复' }), UI.el('option', { value: 'daily', text: '每天' }), UI.el('option', { value: 'weekly', text: '每周' }), UI.el('option', { value: 'monthly', text: '每月' }));
    const modInput = UI.el('select', { id: 'plan-module' }, moduleOptions());
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加任务' });
    addBtn.addEventListener('click', function () {
      const title = titleInput.value;
      if (!title.trim()) { UI.toast('请输入任务标题'); return; }
      AppStore.mutate(function (st) {
        AppPlan.addPlan(st, { title: title, date: viewDate, time: timeInput.value, priority: priInput.value, recurrence: recInput.value, module: modInput.value });
      });
      window.App.render();
    });
    const addForm = UI.el('div', { class: 'toolbar' }, titleInput, timeInput, priInput, recInput, modInput, addBtn);

    const listEl = UI.el('div', { class: 'card' });
    if (!visible.length) listEl.appendChild(UI.emptyState('当天没有任务', '在上方添加任务'));
    else visible.forEach(function (p) { listEl.appendChild(taskItem(state, p)); });

    const doneCount = all.filter((p) => p.done).length;
    const view = UI.el('section', { class: 'view' }, toolbar, addForm, UI.el('div', { class: 'muted', style: 'margin:8px 0' }, '共 ' + all.length + ' 项 · 完成 ' + doneCount + ' 项'), listEl);
    UI.renderInto(container, view);
  };
})();
