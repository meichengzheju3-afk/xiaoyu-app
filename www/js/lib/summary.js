(function (global) {
  'use strict';

  function pad(n) { return String(n).padStart(2, '0'); }

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function todayPlans(state, date) {
    const plans = (state && state.plans) || [];
    return plans.filter((p) => p.date === date);
  }

  function planSummary(plans) {
    const total = plans.length;
    const done = plans.filter((p) => p.done).length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    return { total: total, done: done, percent: percent };
  }

  function moduleSummaries(state) {
    const today = todayStr();
    state = state || {};

    const media = state.media || {};
    const contents = media.contents || [];
    const dev = state.dev || {};
    const projects = dev.projects || [];
    const cards = dev.cards || [];
    const consulting = state.consulting || {};
    const clients = consulting.clients || [];
    const cases = consulting.cases || [];
    const events = consulting.events || [];
    const fitness = state.fitness || {};
    const fplans = fitness.plans || [];
    const diet = state.diet || {};
    const records = diet.records || [];
    const goal = diet.goal || {};
    const novels = state.novels || {};
    const books = novels.books || [];
    const devices = state.devices || {};
    const items = devices.items || [];
    const meta = state.meta || {};
    const backups = state.backups || [];

    const todayRecords = records.filter((r) => r.date === today);
    const calories = todayRecords.reduce((s, r) => s + (Number(r.calories) || 0), 0);
    const protein = todayRecords.reduce((s, r) => s + (Number(r.protein) || 0), 0);
    const todayPlan = fplans.find((p) => p.date === today);
    const readingBook = books.find((b) => b.status === '在看');
    const wantCount = books.filter((b) => b.status === '想看').length;
    const todayEvents = events.filter((e) => e.date === today);
    const pendingFollowups = cases.filter((c) => c.status === '进行中' && c.nextFollowUp && c.nextFollowUp <= today);

    return {
      media: {
        drafts: contents.filter((c) => c.status === '草稿').length,
        pending: contents.filter((c) => c.status === '待发布').length
      },
      dev: {
        ongoing: projects.filter((p) => p.status === '进行中').length,
        todo: cards.filter((c) => c.status === '待办').length
      },
      consulting: {
        clients: clients.length,
        todayEvents: todayEvents.length,
        pendingFollowups: pendingFollowups.length
      },
      fitness: {
        today: todayPlan ? todayPlan.name : '未安排'
      },
      diet: {
        meals: todayRecords.length,
        calories: calories,
        protein: protein,
        caloriePercent: goal.calories ? Math.min(100, Math.round((calories / goal.calories) * 100)) : 0,
        proteinPercent: goal.protein ? Math.min(100, Math.round((protein / goal.protein) * 100)) : 0
      },
      novels: {
        reading: readingBook ? readingBook.title : '暂无',
        want: wantCount
      },
      dataDevice: {
        lastBackupAt: meta.lastBackupAt || null,
        backupCount: backups.length,
        deviceCount: items.length
      }
    };
  }

  function addMemo(state, text) {
    const clean = String(text || '').trim();
    if (!clean) return null;
    if (!Array.isArray(state.memos)) state.memos = [];
    const memo = {
      id: 'memo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      text: clean,
      done: false,
      createdAt: new Date().toISOString()
    };
    state.memos.unshift(memo);
    return memo;
  }

  function toggleMemo(state, id) {
    const memo = (state.memos || []).find((m) => m.id === id);
    if (memo) memo.done = !memo.done;
    return memo || null;
  }

  function deleteMemo(state, id) {
    const item = (state.memos || []).find((m) => m.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'memos', item);
    state.memos = (state.memos || []).filter((m) => m.id !== id);
  }

  const api = {
    todayStr: todayStr,
    todayPlans: todayPlans,
    planSummary: planSummary,
    moduleSummaries: moduleSummaries,
    addMemo: addMemo,
    toggleMemo: toggleMemo,
    deleteMemo: deleteMemo
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.AppSummary = api;
})(typeof window !== 'undefined' ? window : globalThis);


