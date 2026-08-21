(function (global) {
  'use strict';

  function searchAll(state, keyword) {
    const k = String(keyword || '').toLowerCase().trim();
    if (!k || !state) return [];
    const results = [];
    function add(route, module, title, snippet) {
      const t = String(title || '').toLowerCase();
      const s = String(snippet || '').toLowerCase();
      if (t.indexOf(k) >= 0 || s.indexOf(k) >= 0) {
        results.push({ route: route, module: module, title: title, snippet: snippet });
      }
    }

    (state.memos || []).forEach((x) => add('#/home', '快速备忘', x.text, ''));
    (state.plans || []).forEach((x) => add('#/plan', '今日计划', x.title, x.module || ''));
    const media = state.media || {};
    (media.ideas || []).forEach((x) => add('#/media', '自媒体-灵感', x.title, x.note || ''));
    (media.contents || []).forEach((x) => add('#/media', '自媒体-内容', x.title, x.platform || ''));
    const dev = state.dev || {};
    (dev.projects || []).forEach((x) => add('#/dev', '开发-项目', x.name, x.desc || ''));
    (dev.cards || []).forEach((x) => add('#/dev', '开发-卡片', x.title, ''));
    (dev.issues || []).forEach((x) => add('#/dev', '开发-问题', x.title, ''));
    (dev.notes || []).forEach((x) => add('#/dev', '开发-笔记', x.title, x.content || ''));
    (dev.logs || []).forEach((x) => add('#/dev', '开发-日志', x.content, x.date));
    const consulting = state.consulting || {};
    (consulting.clients || []).forEach((x) => add('#/consulting', '咨询-客户', x.name, x.contact || ''));
    (consulting.cases || []).forEach((x) => add('#/consulting', '咨询-个案', x.name, x.note || ''));
    (consulting.events || []).forEach((x) => add('#/consulting', '咨询-日程', x.title, x.date));
    (consulting.notes || []).forEach((x) => add('#/consulting', '咨询-纪要', x.content, x.date));
    const fitness = state.fitness || {};
    (fitness.plans || []).forEach((x) => add('#/fitness', '健身-计划', x.name, ''));
    (fitness.logs || []).forEach((x) => add('#/fitness', '健身-日志', x.part || '', x.date));
    const diet = state.diet || {};
    (diet.records || []).forEach((x) => add('#/diet', '饮食-记录', x.food, x.date));
    (diet.recipes || []).forEach((x) => add('#/diet', '饮食-食谱', x.name, ''));
    const novels = state.novels || {};
    (novels.books || []).forEach((x) => add('#/novels', '小说', x.title, x.author || ''));
    (novels.notes || []).forEach((x) => add('#/novels', '读书笔记', x.content, x.date));
    const devices = state.devices || {};
    (devices.items || []).forEach((x) => add('#/data-device', '设备账号', x.name, x.type || ''));

    return results.slice(0, 50);
  }


  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function highlight(text, keyword) {
    const k = String(keyword || '').trim();
    const safe = escapeHtml(text);
    if (!k) return safe;
    const re = new RegExp('(' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return safe.replace(re, '<mark>$1</mark>');
  }
  const api = { searchAll: searchAll, highlight: highlight };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.AppSearch = api;
})(typeof window !== 'undefined' ? window : globalThis);


