(function (global) {
  'use strict';

  function pad(n) { return String(n).padStart(2, '0'); }
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function newId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }

  function byDate(state, date) {
    return (state.plans || []).filter((p) => p.date === date);
  }

  function sortPlans(list) {
    return list.slice().sort((a, b) => {
      if ((a.done || false) !== (b.done || false)) return (a.done ? 1 : 0) - (b.done ? 1 : 0);
      if ((a.order || 0) !== (b.order || 0)) return (a.order || 0) - (b.order || 0);
      return String(a.time || '').localeCompare(String(b.time || ''));
    });
  }

  function addPlan(state, fields) {
    fields = fields || {};
    const date = fields.date || todayStr();
    const title = String(fields.title || '').trim();
    if (!title) throw new Error('任务标题不能为空');
    if (!Array.isArray(state.plans)) state.plans = [];
    const plan = {
      id: newId('plan'),
      title: title,
      date: date,
      time: fields.time || '',
      priority: fields.priority || '中',
      module: fields.module || '',
      recurrence: fields.recurrence || '',
      done: false,
      order: byDate(state, date).length
    };
    state.plans.push(plan);
    return plan;
  }

  function updatePlan(state, id, patch) {
    const plan = (state.plans || []).find((p) => p.id === id);
    if (!plan) return null;
    Object.keys(patch || {}).forEach((k) => {
      if (k !== 'id') plan[k] = patch[k];
    });
    return plan;
  }

  function togglePlan(state, id) {
    const plan = (state.plans || []).find((p) => p.id === id);
    if (plan) plan.done = !plan.done;
    return plan || null;
  }

  function deletePlan(state, id) {
    const item = (state.plans || []).find((p) => p.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'plans', item);
    state.plans = (state.plans || []).filter((p) => p.id !== id);
  }

  function reorderPlans(state, date, orderedIds) {
    const map = new Map(orderedIds.map((id, i) => [id, i]));
    (state.plans || []).forEach((p) => {
      if (p.date === date && map.has(p.id)) p.order = map.get(p.id);
    });
  }

  function carryOver(state, fromDate, toDate) {
    let n = 0;
    (state.plans || []).forEach((p) => {
      if (p.date === fromDate && !p.done) { p.date = toDate; n += 1; }
    });
    return n;
  }


  function isSameWeekday(a, b) {
    return new Date(a + 'T00:00:00').getDay() === new Date(b + 'T00:00:00').getDay();
  }

  function isSameMonthDay(a, b) {
    return a.slice(8, 10) === b.slice(8, 10);
  }

  function expandPlans(state, startDate, days) {
    const out = [];
    const plans = state.plans || [];
    for (let i = 0; i < days; i += 1) {
      const date = addDays(startDate, i);
      plans.forEach((p) => {
        let hit = false;
        if (p.recurrence === 'daily') hit = p.date <= date;
        else if (p.recurrence === 'weekly') hit = p.date <= date && isSameWeekday(p.date, date);
        else if (p.recurrence === 'monthly') hit = p.date <= date && isSameMonthDay(p.date, date);
        else hit = p.date === date;
        if (hit) out.push({ date: date, plan: p });
      });
    }
    return out;
  }
  function filterPlans(list, mode) {
    if (mode === 'open') return list.filter((p) => !p.done);
    return list;
  }

  function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  const api = {
    todayStr: todayStr,
    newId: newId,
    byDate: byDate,
    sortPlans: sortPlans,
    addPlan: addPlan,
    updatePlan: updatePlan,
    togglePlan: togglePlan,
    deletePlan: deletePlan,
    reorderPlans: reorderPlans,
    carryOver: carryOver,
    filterPlans: filterPlans,
    addDays: addDays,
    expandPlans: expandPlans
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.AppPlan = api;
})(typeof window !== 'undefined' ? window : globalThis);


