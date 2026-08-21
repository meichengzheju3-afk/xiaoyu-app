(function () {
  'use strict';
  window.Views = window.Views || {};

  let consultingTab = 'clients';
  let eventDate = null;

  function tabBar(current) {
    const defs = [['clients', '客户'], ['cases', '个案'], ['events', '日程'], ['notes', '纪要']];
    return UI.el('div', { class: 'tabs' }, defs.map((d) => UI.el('button', {
      class: 'tab' + (current === d[0] ? ' active' : ''),
      text: d[1],
      onclick: function () { consultingTab = d[0]; window.App.render(); }
    })));
  }

  function clientOptions(selected) {
    const state = AppStore.get();
    const clients = (state.consulting && state.consulting.clients) || [];
    return clients.map((c) => UI.el('option', { value: c.id, text: c.name, selected: selected === c.id ? 'selected' : null }));
  }

  function caseOptions(selected) {
    const state = AppStore.get();
    const cases = (state.consulting && state.consulting.cases) || [];
    return cases.map((c) => UI.el('option', { value: c.id, text: AppConsulting.clientName(state, c.clientId) + ' - ' + c.name, selected: selected === c.id ? 'selected' : null }));
  }

  function clientsTab(state) {
    const clients = (state.consulting && state.consulting.clients) || [];
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加客户', onclick: function () { openClientModal(); } });
    const list = UI.el('div', { class: 'grid cols-2' });
    if (!clients.length) list.appendChild(UI.emptyState('还没有客户', '添加你的客户资料'));
    clients.forEach(function (c) {
      list.appendChild(UI.el('div', { class: 'card' },
        UI.el('h4', { text: c.name }),
        c.contact ? UI.el('div', { class: 'muted', text: c.contact }) : null,
        c.note ? UI.el('div', { class: 'muted', text: c.note }) : null,
        UI.el('div', { class: 'toolbar', style: 'margin-top:8px' },
          UI.el('button', { class: 'btn', text: '详情', onclick: function () { openClientDetail(c); } }),
          UI.el('button', { class: 'btn', text: '编辑', onclick: function () { openClientModal(c); } }),
          UI.el('button', { class: 'btn', text: '删除', onclick: function () {
            UI.confirm('删除客户「' + c.name + '」及其关联数据？', { danger: true }).then(function (ok) {
              if (!ok) return;
              AppStore.mutate(function (st) { AppConsulting.deleteClient(st, c.id); });
              window.App.render();
            });
          } })
        )
      ));
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, UI.el('span', { class: 'spacer' }), addBtn), list);
  }

  function openClientModal(client) {
    const name = UI.el('input', { type: 'text', placeholder: '姓名', value: client ? client.name : '' });
    const contact = UI.el('input', { type: 'text', placeholder: '联系方式', value: client ? client.contact : '' });
    const note = UI.el('textarea', { placeholder: '背景备注', rows: '3' }, client ? client.note : '');
    UI.modal({
      title: client ? '编辑客户' : '添加客户',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, name, contact, note),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!name.value.trim()) { UI.toast('请输入姓名'); return; }
      const fields = { name: name.value, contact: contact.value, note: note.value };
      AppStore.mutate(function (st) {
        if (client) AppConsulting.updateClient(st, client.id, fields);
        else AppConsulting.addClient(st, fields);
      });
      window.App.render();
    });
  }

  function openClientDetail(client) {
    const state = AppStore.get();
    const cases = (state.consulting.cases || []).filter((c) => c.clientId === client.id);
    const notes = (state.consulting.notes || []).filter((n) => n.clientId === client.id);
    const body = UI.el('div', {},
      UI.el('div', { class: 'muted', text: client.contact || '无联系方式' }),
      client.note ? UI.el('div', { class: 'muted', text: client.note }) : null,
      UI.el('h4', { text: '关联个案' }),
      cases.length ? cases.map((c) => UI.el('div', { text: c.name + '（' + c.status + '）' })) : UI.el('div', { class: 'muted', text: '无' }),
      UI.el('h4', { text: '相关纪要' }),
      notes.length ? notes.map((n) => UI.el('div', { class: 'muted', text: n.date + ' ' + n.content })) : UI.el('div', { class: 'muted', text: '无' })
    );
    UI.modal({ title: '客户详情：' + client.name, body: body, actions: [{ text: '关闭', value: true }] });
  }

  function casesTab(state) {
    const cases = (state.consulting && state.consulting.cases) || [];
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加个案', onclick: function () { openCaseModal(); } });
    const list = UI.el('div', { class: 'card' });
    if (!cases.length) list.appendChild(UI.emptyState('还没有个案'));
    cases.forEach(function (c) {
      const overdue = c.status === '进行中' && c.nextFollowUp && c.nextFollowUp < AppSummary.todayStr();
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { class: 'badge ' + (c.status === '进行中' ? 'green' : 'gray'), text: c.status }),
        UI.el('span', { text: AppConsulting.clientName(state, c.clientId) + ' - ' + c.name }),
        c.nextFollowUp ? UI.el('span', { class: 'badge ' + (overdue ? 'high' : 'blue'), text: '下次跟进 ' + c.nextFollowUp }) : null,
        UI.el('span', { class: 'spacer' }),
        UI.el('button', { class: 'btn', text: '跟进', onclick: function () { openFollowupModal(c); } }),
        UI.el('button', { class: 'btn', text: '编辑', onclick: function () { openCaseModal(c); } }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () {
          UI.confirm('删除个案「' + c.name + '」？', { danger: true }).then(function (ok) {
            if (!ok) return;
            AppStore.mutate(function (st) { AppConsulting.deleteCase(st, c.id); });
            window.App.render();
          });
        } })
      ));
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, UI.el('span', { class: 'spacer' }), addBtn), list);
  }

  function openCaseModal(c) {
    const state = AppStore.get();
    const name = UI.el('input', { type: 'text', placeholder: '个案名称', value: c ? c.name : '' });
    const client = UI.el('select', {}, UI.el('option', { value: '', text: '（未关联客户）' }), clientOptions(c ? c.clientId : null));
    const status = UI.el('select', {}, ['进行中', '已完成'].map((s) => UI.el('option', { value: s, text: s, selected: c && c.status === s ? 'selected' : null })));
    const nextFollowUp = UI.el('input', { type: 'date', value: c ? c.nextFollowUp : '' });
    const note = UI.el('input', { type: 'text', placeholder: '备注', value: c ? c.note : '' });
    UI.modal({
      title: c ? '编辑个案' : '添加个案',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, name, client, status, UI.el('label', { text: '下次跟进日期' }), nextFollowUp, note),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!name.value.trim()) { UI.toast('请输入个案名称'); return; }
      const fields = { name: name.value, clientId: client.value, status: status.value, nextFollowUp: nextFollowUp.value, note: note.value };
      AppStore.mutate(function (st) {
        if (c) AppConsulting.updateCase(st, c.id, fields);
        else AppConsulting.addCase(st, fields);
      });
      window.App.render();
    });
  }

  function openFollowupModal(c) {
    const state = AppStore.get();
    const date = UI.el('input', { type: 'date', value: AppSummary.todayStr() });
    const content = UI.el('textarea', { placeholder: '跟进内容', rows: '3' });
    const history = UI.el('div', {},
      UI.el('h4', { text: '跟进记录' }),
      AppConsulting.caseFollowups(state, c.id).length
        ? AppConsulting.caseFollowups(state, c.id).map((f) => UI.el('div', { class: 'muted', text: f.date + ' ' + f.content }))
        : UI.el('div', { class: 'muted', text: '暂无记录' })
    );
    UI.modal({
      title: '个案跟进：' + c.name,
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, date, content, history),
      actions: [{ text: '取消', value: false }, { text: '保存跟进', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!content.value.trim()) { UI.toast('请输入跟进内容'); return; }
      AppStore.mutate(function (st) { AppConsulting.addFollowup(st, { caseId: c.id, date: date.value, content: content.value }); });
      window.App.render();
    });
  }

  function eventsTab(state) {
    if (!eventDate) eventDate = AppSummary.todayStr();
    const today = AppSummary.todayStr();
    const events = AppConsulting.eventsByDate(state, eventDate);
    const overdue = AppConsulting.overdueFollowups(state, today);
    const dueToday = AppConsulting.dueTodayFollowups(state, today);

    const dateInput = UI.el('input', { type: 'date', value: eventDate });
    dateInput.addEventListener('change', function () { eventDate = dateInput.value; window.App.render(); });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加日程', onclick: function () { openEventModal(); } });

    const alerts = UI.el('div', { class: 'card', style: 'margin-bottom:12px' },
      UI.el('h4', { text: '跟进提醒' }),
      overdue.length ? UI.el('div', { class: 'badge high', text: '已过期 ' + overdue.length + ' 项' }) : null,
      overdue.map((c) => UI.el('div', { class: 'muted', text: '过期：' + c.name + '（下次跟进 ' + c.nextFollowUp + '）' })),
      dueToday.map((c) => UI.el('div', { class: 'muted', text: '今天跟进：' + c.name }))
    );

    const list = UI.el('div', { class: 'card' });
    if (!events.length) list.appendChild(UI.emptyState('这一天没有日程'));
    events.forEach(function (e) {
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { class: 'badge gray', text: e.type }),
        UI.el('span', { class: 'muted', text: e.time || '' }),
        UI.el('span', { text: e.title }),
        UI.el('span', { class: 'spacer' }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () {
          UI.confirm('删除日程「' + e.title + '」？', { danger: true }).then(function (ok) {
            if (!ok) return;
            AppStore.mutate(function (st) { AppConsulting.deleteEvent(st, e.id); });
            window.App.render();
          });
        } })
      ));
    });

    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, dateInput, UI.el('span', { class: 'spacer' }), addBtn), alerts, list);
  }

  function openEventModal() {
    const date = UI.el('input', { type: 'date', value: eventDate });
    const time = UI.el('input', { type: 'time' });
    const title = UI.el('input', { type: 'text', placeholder: '事项' });
    const type = UI.el('select', {}, ['约见', '跟进'].map((t) => UI.el('option', { value: t, text: t })));
    UI.modal({
      title: '添加日程',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, title, date, time, type),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!title.value.trim()) { UI.toast('请输入事项'); return; }
      AppStore.mutate(function (st) { AppConsulting.addEvent(st, { date: date.value, time: time.value, title: title.value, type: type.value }); });
      window.App.render();
    });
  }

  function notesTab(state) {
    const notes = (state.consulting && state.consulting.notes) || [];
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加纪要', onclick: function () { openNoteModal(); } });
    const list = UI.el('div', { class: 'card' });
    if (!notes.length) list.appendChild(UI.emptyState('还没有纪要'));
    notes.slice().reverse().forEach(function (n) {
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { class: 'muted', text: n.date }),
        UI.el('span', { text: n.content }),
        UI.el('span', { class: 'spacer' }),
        UI.el('span', { class: 'badge blue', text: AppConsulting.clientName(state, n.clientId) }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () {
          UI.confirm('删除这条纪要？', { danger: true }).then(function (ok) {
            if (!ok) return;
            AppStore.mutate(function (st) { AppConsulting.deleteConsultNote(st, n.id); });
            window.App.render();
          });
        } })
      ));
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, UI.el('span', { class: 'spacer' }), addBtn), list);
  }

  function openNoteModal() {
    const state = AppStore.get();
    const date = UI.el('input', { type: 'date', value: AppSummary.todayStr() });
    const client = UI.el('select', {}, UI.el('option', { value: '', text: '（未关联客户）' }), clientOptions(null));
    const caseSel = UI.el('select', {}, UI.el('option', { value: '', text: '（未关联个案）' }), caseOptions(null));
    const content = UI.el('textarea', { placeholder: '纪要内容', rows: '4' });
    UI.modal({
      title: '添加纪要',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, date, client, caseSel, content),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!content.value.trim()) { UI.toast('请输入纪要内容'); return; }
      AppStore.mutate(function (st) { AppConsulting.addConsultNote(st, { date: date.value, clientId: client.value, caseId: caseSel.value, content: content.value }); });
      window.App.render();
    });
  }

  window.Views.consulting = function (container) {
    const state = AppStore.get();
    let body;
    if (consultingTab === 'clients') body = clientsTab(state);
    else if (consultingTab === 'cases') body = casesTab(state);
    else if (consultingTab === 'events') body = eventsTab(state);
    else body = notesTab(state);
    UI.renderInto(container, UI.el('section', { class: 'view' }, tabBar(consultingTab), body));
  };
})();
