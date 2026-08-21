(function (global) {
  'use strict';

  function exportJson(state) {
    return JSON.stringify(state, null, 2);
  }

  function csvCell(v) {
    const s = String(v === null || v === undefined ? '' : v);
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function exportCsv(state) {
    state = state || {};
    const rows = [['模块', '标题/内容', '日期', '备注']];
    const push = (mod, title, date, note) => rows.push([mod, title, date, note]);
    (state.plans || []).forEach((x) => push('今日计划', x.title, x.date, x.module || ''));
    (state.memos || []).forEach((x) => push('快速备忘', x.text, '', x.done ? '已完成' : ''));
    (state.media && state.media.contents || []).forEach((x) => push('自媒体', x.title, '', x.status + ' ' + (x.platform || '')));
    (state.dev && state.dev.notes || []).forEach((x) => push('技术笔记', x.title, '', x.content || ''));
    (state.consulting && state.consulting.clients || []).forEach((x) => push('咨询客户', x.name, '', x.contact || ''));
    (state.diet && state.diet.records || []).forEach((x) => push('饮食记录', x.food, x.date, x.meal + ' ' + x.calories + 'kcal'));
    (state.novels && state.novels.books || []).forEach((x) => push('小说', x.title, '', x.status + ' ' + (x.author || '')));
    return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  }

  const api = { exportJson: exportJson, exportCsv: exportCsv };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.AppExport = api;
})(typeof window !== 'undefined' ? window : globalThis);
