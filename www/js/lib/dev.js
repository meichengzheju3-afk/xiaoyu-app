(function (global) {
  'use strict';

  const PROJECT_STATUSES = ['进行中', '已完成', '暂停'];
  const CARD_STATUSES = ['待办', '进行中', '完成'];
  const ISSUE_STATUSES = ['待处理', '处理中', '已解决'];

  function newId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }

  function ensureDev(state) {
    if (!state.dev) state.dev = {};
    if (!Array.isArray(state.dev.projects)) state.dev.projects = [];
    if (!Array.isArray(state.dev.cards)) state.dev.cards = [];
    if (!Array.isArray(state.dev.issues)) state.dev.issues = [];
    if (!Array.isArray(state.dev.notes)) state.dev.notes = [];
    if (!Array.isArray(state.dev.logs)) state.dev.logs = [];
    return state.dev;
  }

  function addProject(state, fields) {
    const dev = ensureDev(state);
    const name = String((fields && fields.name) || '').trim();
    if (!name) throw new Error('项目名称不能为空');
    const project = {
      id: newId('project'),
      name: name,
      desc: (fields && fields.desc) || '',
      status: (fields && fields.status) || '进行中'
    };
    dev.projects.push(project);
    return project;
  }

  function updateProject(state, id, patch) {
    const p = ensureDev(state).projects.find((x) => x.id === id);
    if (!p) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') p[k] = patch[k]; });
    return p;
  }

  function deleteProject(state, id) {
    const dev = ensureDev(state);
    const item = dev.projects.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'devProjects', item);
    dev.projects = dev.projects.filter((x) => x.id !== id);
    dev.cards = dev.cards.filter((x) => x.projectId !== id);
    dev.issues = dev.issues.filter((x) => x.projectId !== id);
  }

  function addCard(state, fields) {
    const dev = ensureDev(state);
    const title = String((fields && fields.title) || '').trim();
    if (!title) throw new Error('卡片标题不能为空');
    const card = {
      id: newId('card'),
      projectId: (fields && fields.projectId) || '',
      title: title,
      status: (fields && fields.status) || '待办'
    };
    dev.cards.push(card);
    return card;
  }

  function updateCard(state, id, patch) {
    const c = ensureDev(state).cards.find((x) => x.id === id);
    if (!c) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') c[k] = patch[k]; });
    return c;
  }

  function changeCardStatus(state, id, status) {
    if (CARD_STATUSES.indexOf(status) < 0) throw new Error('无效状态');
    return updateCard(state, id, { status: status });
  }

  function deleteCard(state, id) {
    const dev = ensureDev(state);
    const item = dev.cards.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'devCards', item);
    dev.cards = dev.cards.filter((x) => x.id !== id);
  }

  function cardsByProject(state, projectId) {
    return ensureDev(state).cards.filter((x) => x.projectId === projectId);
  }

  function addIssue(state, fields) {
    const dev = ensureDev(state);
    const title = String((fields && fields.title) || '').trim();
    if (!title) throw new Error('问题标题不能为空');
    const issue = {
      id: newId('issue'),
      projectId: (fields && fields.projectId) || '',
      title: title,
      priority: (fields && fields.priority) || '中',
      status: (fields && fields.status) || '待处理'
    };
    dev.issues.push(issue);
    return issue;
  }

  function updateIssue(state, id, patch) {
    const i = ensureDev(state).issues.find((x) => x.id === id);
    if (!i) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') i[k] = patch[k]; });
    return i;
  }

  function deleteIssue(state, id) {
    const dev = ensureDev(state);
    const item = dev.issues.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'devIssues', item);
    dev.issues = dev.issues.filter((x) => x.id !== id);
  }

  function filterIssues(issues, filters) {
    filters = filters || {};
    return (issues || []).filter((i) => {
      if (filters.projectId && i.projectId !== filters.projectId) return false;
      if (filters.priority && i.priority !== filters.priority) return false;
      if (filters.status && i.status !== filters.status) return false;
      return true;
    });
  }

  function addNote(state, fields) {
    const dev = ensureDev(state);
    const title = String((fields && fields.title) || '').trim();
    if (!title) throw new Error('笔记标题不能为空');
    const note = {
      id: newId('note'),
      title: title,
      category: (fields && fields.category) || '',
      content: (fields && fields.content) || ''
    };
    dev.notes.unshift(note);
    return note;
  }

  function updateNote(state, id, patch) {
    const n = ensureDev(state).notes.find((x) => x.id === id);
    if (!n) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') n[k] = patch[k]; });
    return n;
  }

  function deleteNote(state, id) {
    const dev = ensureDev(state);
    const item = dev.notes.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'devNotes', item);
    dev.notes = dev.notes.filter((x) => x.id !== id);
  }

  function searchNotes(notes, keyword) {
    const k = String(keyword || '').toLowerCase().trim();
    if (!k) return notes || [];
    return (notes || []).filter((n) => {
      return String(n.title || '').toLowerCase().indexOf(k) >= 0 ||
             String(n.content || '').toLowerCase().indexOf(k) >= 0 ||
             String(n.category || '').toLowerCase().indexOf(k) >= 0;
    });
  }

  function addLog(state, fields) {
    const dev = ensureDev(state);
    const date = (fields && fields.date) || '';
    const content = String((fields && fields.content) || '').trim();
    if (!date || !content) throw new Error('日志日期和内容不能为空');
    const log = { id: newId('log'), date: date, content: content };
    dev.logs.push(log);
    return log;
  }

  function updateLog(state, id, patch) {
    const l = ensureDev(state).logs.find((x) => x.id === id);
    if (!l) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') l[k] = patch[k]; });
    return l;
  }

  function deleteLog(state, id) {
    const dev = ensureDev(state);
    const item = dev.logs.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'devLogs', item);
    dev.logs = dev.logs.filter((x) => x.id !== id);
  }

  function logsByDate(state, date) {
    return ensureDev(state).logs.filter((x) => x.date === date);
  }

  const api = {
    PROJECT_STATUSES: PROJECT_STATUSES,
    CARD_STATUSES: CARD_STATUSES,
    ISSUE_STATUSES: ISSUE_STATUSES,
    newId: newId,
    addProject: addProject,
    updateProject: updateProject,
    deleteProject: deleteProject,
    addCard: addCard,
    updateCard: updateCard,
    changeCardStatus: changeCardStatus,
    deleteCard: deleteCard,
    cardsByProject: cardsByProject,
    addIssue: addIssue,
    updateIssue: updateIssue,
    deleteIssue: deleteIssue,
    filterIssues: filterIssues,
    addNote: addNote,
    updateNote: updateNote,
    deleteNote: deleteNote,
    searchNotes: searchNotes,
    addLog: addLog,
    updateLog: updateLog,
    deleteLog: deleteLog,
    logsByDate: logsByDate
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.AppDev = api;
})(typeof window !== 'undefined' ? window : globalThis);

