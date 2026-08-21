(function (global) {
  'use strict';

  const STATUSES = ['灵感', '草稿', '待发布', '已发布'];

  function newId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }

  function ensureMedia(state) {
    if (!state.media) state.media = {};
    if (!Array.isArray(state.media.ideas)) state.media.ideas = [];
    if (!Array.isArray(state.media.contents)) state.media.contents = [];
    if (!Array.isArray(state.media.schedule)) state.media.schedule = [];
    return state.media;
  }

  function addIdea(state, fields) {
    const media = ensureMedia(state);
    const title = String((fields && fields.title) || '').trim();
    if (!title) throw new Error('灵感标题不能为空');
    const idea = {
      id: newId('idea'),
      title: title,
      source: (fields && fields.source) || '',
      note: (fields && fields.note) || '',
      createdAt: new Date().toISOString()
    };
    media.ideas.unshift(idea);
    return idea;
  }

  function updateIdea(state, id, patch) {
    const idea = ensureMedia(state).ideas.find((x) => x.id === id);
    if (!idea) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') idea[k] = patch[k]; });
    return idea;
  }

  function deleteIdea(state, id) {
    const media = ensureMedia(state);
    const item = media.ideas.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'mediaIdeas', item);
    media.ideas = media.ideas.filter((x) => x.id !== id);
  }

  function convertIdeaToContent(state, ideaId) {
    const media = ensureMedia(state);
    const idea = media.ideas.find((x) => x.id === ideaId);
    if (!idea) throw new Error('灵感不存在');
    const content = {
      id: newId('content'),
      title: idea.title,
      platform: '',
      status: '草稿',
      link: '',
      note: idea.note || ''
    };
    media.contents.push(content);
    media.ideas = media.ideas.filter((x) => x.id !== ideaId);
    return content;
  }

  function addContent(state, fields) {
    const media = ensureMedia(state);
    const title = String((fields && fields.title) || '').trim();
    if (!title) throw new Error('内容标题不能为空');
    const content = {
      id: newId('content'),
      title: title,
      platform: (fields && fields.platform) || '',
      status: (fields && fields.status) || '草稿',
      link: (fields && fields.link) || '',
      note: (fields && fields.note) || ''
    };
    media.contents.push(content);
    return content;
  }

  function updateContent(state, id, patch) {
    const content = ensureMedia(state).contents.find((x) => x.id === id);
    if (!content) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') content[k] = patch[k]; });
    return content;
  }

  function deleteContent(state, id) {
    const media = ensureMedia(state);
    const item = media.contents.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'mediaContents', item);
    media.contents = media.contents.filter((x) => x.id !== id);
    media.schedule = media.schedule.filter((x) => x.contentId !== id);
  }

  function changeStatus(state, id, status) {
    if (STATUSES.indexOf(status) < 0) throw new Error('无效状态');
    return updateContent(state, id, { status: status });
  }

  function statusCounts(contents) {
    const counts = { '灵感': 0, '草稿': 0, '待发布': 0, '已发布': 0 };
    (contents || []).forEach((c) => {
      if (counts[c.status] !== undefined) counts[c.status] += 1;
    });
    return counts;
  }

  function listByStatus(contents, status) {
    return (contents || []).filter((c) => c.status === status);
  }

  function addSchedule(state, fields) {
    const media = ensureMedia(state);
    const date = (fields && fields.date) || '';
    if (!date) throw new Error('排期日期不能为空');
    const item = {
      id: newId('sched'),
      date: date,
      contentId: (fields && fields.contentId) || '',
      platform: (fields && fields.platform) || ''
    };
    media.schedule.push(item);
    return item;
  }

  function deleteSchedule(state, id) {
    const media = ensureMedia(state);
    media.schedule = media.schedule.filter((x) => x.id !== id);
  }

  function schedulesByDate(state, date) {
    return ensureMedia(state).schedule.filter((x) => x.date === date);
  }

  function contentTitle(state, contentId) {
    const c = ensureMedia(state).contents.find((x) => x.id === contentId);
    return c ? c.title : '（已删除内容）';
  }

  function monthDays(year, month) {
    const first = new Date(year, month - 1, 1);
    const days = new Date(year, month, 0).getDate();
    const list = [];
    for (let i = 1; i <= days; i += 1) {
      const d = new Date(year, month - 1, i);
      const pad = (n) => String(n).padStart(2, '0');
      list.push({ date: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()), day: i, weekday: d.getDay() });
    }
    return list;
  }

  const api = {
    STATUSES: STATUSES,
    newId: newId,
    addIdea: addIdea,
    updateIdea: updateIdea,
    deleteIdea: deleteIdea,
    convertIdeaToContent: convertIdeaToContent,
    addContent: addContent,
    updateContent: updateContent,
    deleteContent: deleteContent,
    changeStatus: changeStatus,
    statusCounts: statusCounts,
    listByStatus: listByStatus,
    addSchedule: addSchedule,
    deleteSchedule: deleteSchedule,
    schedulesByDate: schedulesByDate,
    contentTitle: contentTitle,
    monthDays: monthDays
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.AppMedia = api;
})(typeof window !== 'undefined' ? window : globalThis);

