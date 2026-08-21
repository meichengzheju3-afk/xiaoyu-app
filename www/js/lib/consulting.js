(function (global) {
  'use strict';

  function newId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }

  function ensureConsulting(state) {
    if (!state.consulting) state.consulting = {};
    if (!Array.isArray(state.consulting.clients)) state.consulting.clients = [];
    if (!Array.isArray(state.consulting.cases)) state.consulting.cases = [];
    if (!Array.isArray(state.consulting.followups)) state.consulting.followups = [];
    if (!Array.isArray(state.consulting.events)) state.consulting.events = [];
    if (!Array.isArray(state.consulting.notes)) state.consulting.notes = [];
    return state.consulting;
  }

  function addClient(state, fields) {
    const c = ensureConsulting(state);
    const name = String((fields && fields.name) || '').trim();
    if (!name) throw new Error('客户姓名不能为空');
    const client = {
      id: newId('client'),
      name: name,
      contact: (fields && fields.contact) || '',
      note: (fields && fields.note) || ''
    };
    c.clients.push(client);
    return client;
  }

  function updateClient(state, id, patch) {
    const client = ensureConsulting(state).clients.find((x) => x.id === id);
    if (!client) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') client[k] = patch[k]; });
    return client;
  }

  function deleteClient(state, id) {
    const c = ensureConsulting(state);
    const clientItem = c.clients.find((x) => x.id === id);
    if (clientItem && global.AppTrash) global.AppTrash.archive(state, 'consultingClients', clientItem);
    const caseIds = c.cases.filter((x) => x.clientId === id).map((x) => x.id);
    c.clients = c.clients.filter((x) => x.id !== id);
    c.cases = c.cases.filter((x) => x.clientId !== id);
    c.followups = c.followups.filter((x) => caseIds.indexOf(x.caseId) < 0);
    c.notes = c.notes.filter((x) => x.clientId !== id && caseIds.indexOf(x.caseId) < 0);
  }

  function addCase(state, fields) {
    const c = ensureConsulting(state);
    const name = String((fields && fields.name) || '').trim();
    if (!name) throw new Error('个案名称不能为空');
    const item = {
      id: newId('case'),
      clientId: (fields && fields.clientId) || '',
      name: name,
      status: (fields && fields.status) || '进行中',
      nextFollowUp: (fields && fields.nextFollowUp) || '',
      note: (fields && fields.note) || ''
    };
    c.cases.push(item);
    return item;
  }

  function updateCase(state, id, patch) {
    const item = ensureConsulting(state).cases.find((x) => x.id === id);
    if (!item) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') item[k] = patch[k]; });
    return item;
  }

  function deleteCase(state, id) {
    const c = ensureConsulting(state);
    const item = c.cases.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'consultingCases', item);
    c.cases = c.cases.filter((x) => x.id !== id);
    c.followups = c.followups.filter((x) => x.caseId !== id);
    c.notes = c.notes.filter((x) => x.caseId !== id);
  }

  function addFollowup(state, fields) {
    const c = ensureConsulting(state);
    const content = String((fields && fields.content) || '').trim();
    if (!content) throw new Error('跟进内容不能为空');
    const item = {
      id: newId('followup'),
      caseId: (fields && fields.caseId) || '',
      date: (fields && fields.date) || '',
      content: content
    };
    c.followups.push(item);
    return item;
  }

  function deleteFollowup(state, id) {
    const c = ensureConsulting(state);
    c.followups = c.followups.filter((x) => x.id !== id);
  }

  function addEvent(state, fields) {
    const c = ensureConsulting(state);
    const date = (fields && fields.date) || '';
    const title = String((fields && fields.title) || '').trim();
    if (!date || !title) throw new Error('日程日期和事项不能为空');
    const event = {
      id: newId('event'),
      date: date,
      time: (fields && fields.time) || '',
      title: title,
      type: (fields && fields.type) || '约见'
    };
    c.events.push(event);
    return event;
  }

  function updateEvent(state, id, patch) {
    const e = ensureConsulting(state).events.find((x) => x.id === id);
    if (!e) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') e[k] = patch[k]; });
    return e;
  }

  function deleteEvent(state, id) {
    const c = ensureConsulting(state);
    const item = c.events.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'consultingEvents', item);
    c.events = c.events.filter((x) => x.id !== id);
  }

  function eventsByDate(state, date) {
    return ensureConsulting(state).events.filter((x) => x.date === date);
  }

  function overdueFollowups(state, today) {
    return ensureConsulting(state).cases.filter((x) => x.status === '进行中' && x.nextFollowUp && x.nextFollowUp < today);
  }

  function dueTodayFollowups(state, today) {
    return ensureConsulting(state).cases.filter((x) => x.status === '进行中' && x.nextFollowUp === today);
  }

  function addConsultNote(state, fields) {
    const c = ensureConsulting(state);
    const content = String((fields && fields.content) || '').trim();
    if (!content) throw new Error('纪要内容不能为空');
    const note = {
      id: newId('cnote'),
      clientId: (fields && fields.clientId) || '',
      caseId: (fields && fields.caseId) || '',
      date: (fields && fields.date) || '',
      content: content
    };
    c.notes.push(note);
    return note;
  }

  function deleteConsultNote(state, id) {
    const c = ensureConsulting(state);
    const item = c.notes.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'consultingNotes', item);
    c.notes = c.notes.filter((x) => x.id !== id);
  }

  function clientName(state, clientId) {
    const client = ensureConsulting(state).clients.find((x) => x.id === clientId);
    return client ? client.name : '（未关联客户）';
  }

  function caseName(state, caseId) {
    const item = ensureConsulting(state).cases.find((x) => x.id === caseId);
    return item ? item.name : '（未关联个案）';
  }

  function caseFollowups(state, caseId) {
    return ensureConsulting(state).followups.filter((x) => x.caseId === caseId).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  const api = {
    newId: newId,
    addClient: addClient,
    updateClient: updateClient,
    deleteClient: deleteClient,
    addCase: addCase,
    updateCase: updateCase,
    deleteCase: deleteCase,
    addFollowup: addFollowup,
    deleteFollowup: deleteFollowup,
    addEvent: addEvent,
    updateEvent: updateEvent,
    deleteEvent: deleteEvent,
    eventsByDate: eventsByDate,
    overdueFollowups: overdueFollowups,
    dueTodayFollowups: dueTodayFollowups,
    addConsultNote: addConsultNote,
    deleteConsultNote: deleteConsultNote,
    clientName: clientName,
    caseName: caseName,
    caseFollowups: caseFollowups
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.AppConsulting = api;
})(typeof window !== 'undefined' ? window : globalThis);

