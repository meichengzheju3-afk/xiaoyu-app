(function () {
  'use strict';
  window.Views = window.Views || {};

  let devTab = 'board';
  let selectedProjectId = null;
  let issueProject = '';
  let issuePriority = '';
  let issueStatus = '';
  let noteKeyword = '';
  let logDate = null;

  function tabBar(current) {
    const defs = [['board', '项目看板'], ['issues', '问题清单'], ['notes', '技术笔记'], ['logs', '开发日志']];
    return UI.el('div', { class: 'tabs' }, defs.map((d) => UI.el('button', {
      class: 'tab' + (current === d[0] ? ' active' : ''),
      text: d[1],
      onclick: function () { devTab = d[0]; window.App.render(); }
    })));
  }

  function projectOptions(selected) {
    const state = AppStore.get();
    const projects = (state.dev && state.dev.projects) || [];
    return projects.map((p) => UI.el('option', { value: p.id, text: p.name, selected: selected === p.id ? 'selected' : null }));
  }

  function openProjectModal() {
    const name = UI.el('input', { type: 'text', placeholder: '项目名称' });
    const desc = UI.el('input', { type: 'text', placeholder: '描述（可选）' });
    const status = UI.el('select', {}, AppDev.PROJECT_STATUSES.map((s) => UI.el('option', { value: s, text: s })));
    UI.modal({
      title: '添加项目',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, name, desc, status),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!name.value.trim()) { UI.toast('请输入项目名称'); return; }
      AppStore.mutate(function (st) { AppDev.addProject(st, { name: name.value, desc: desc.value, status: status.value }); });
      window.App.render();
    });
  }

  function boardTab(state) {
    const projects = (state.dev && state.dev.projects) || [];
    if (!projects.length) {
      return UI.el('div', { class: 'card' }, UI.emptyState('还没有项目', '先创建一个项目开始跟踪'), UI.el('div', { class: 'toolbar' }, UI.el('button', { class: 'btn btn-primary', text: '添加项目', onclick: openProjectModal })));
    }
    if (!selectedProjectId || !projects.find((p) => p.id === selectedProjectId)) selectedProjectId = projects[0].id;
    const project = projects.find((p) => p.id === selectedProjectId);
    const cards = AppDev.cardsByProject(state, selectedProjectId);

    const sel = UI.el('select', { id: 'dev-project' }, projectOptions(selectedProjectId));
    sel.addEventListener('change', function () { selectedProjectId = sel.value; window.App.render(); });
    const addCardBtn = UI.el('button', { class: 'btn btn-primary', text: '添加卡片', onclick: function () { openCardModal(); } });
    const delProjectBtn = UI.el('button', { class: 'btn', text: '删除项目', onclick: function () {
      UI.confirm('删除项目「' + project.name + '」及其卡片、问题？', { danger: true }).then(function (ok) {
        if (!ok) return;
        AppStore.mutate(function (st) { AppDev.deleteProject(st, selectedProjectId); });
        selectedProjectId = null;
        window.App.render();
      });
    } });

    const kanban = UI.el('div', { class: 'kanban' });
    AppDev.CARD_STATUSES.forEach(function (status) {
      const col = UI.el('div', { class: 'kanban-col', 'data-status': status }, UI.el('div', { class: 'kanban-title', text: status }));
      cards.filter((c) => c.status === status).forEach(function (c) {
        const card = UI.el('div', { class: 'card', draggable: 'true', 'data-id': c.id, style: 'margin-bottom:10px; cursor:grab' },
          UI.el('div', { text: c.title }),
          UI.el('div', { class: 'toolbar', style: 'margin-top:8px' }, UI.el('button', { class: 'btn', text: '删除', onclick: function () {
            UI.confirm('删除卡片「' + c.title + '」？', { danger: true }).then(function (ok) {
              if (!ok) return;
              AppStore.mutate(function (st) { AppDev.deleteCard(st, c.id); });
              window.App.render();
            });
          } }))
        );
        card.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', c.id); });
        card.addEventListener('dragover', function (e) { e.preventDefault(); });
        card.addEventListener('drop', function (e) {
          e.preventDefault();
          const colEl = card.closest('.kanban-col');
          const s = colEl ? colEl.getAttribute('data-status') : null;
          if (s) { AppStore.mutate(function (st) { AppDev.changeCardStatus(st, c.id, s); }); window.App.render(); }
        });
        col.appendChild(card);
      });
      kanban.appendChild(col);
    });

    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, sel, addCardBtn, UI.el('span', { class: 'spacer' }), delProjectBtn), kanban);
  }

  function openCardModal() {
    const title = UI.el('input', { type: 'text', placeholder: '卡片标题' });
    const status = UI.el('select', {}, AppDev.CARD_STATUSES.map((s) => UI.el('option', { value: s, text: s })));
    UI.modal({
      title: '添加卡片',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, title, status),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!title.value.trim()) { UI.toast('请输入卡片标题'); return; }
      AppStore.mutate(function (st) { AppDev.addCard(st, { projectId: selectedProjectId, title: title.value, status: status.value }); });
      window.App.render();
    });
  }

  function issuesTab(state) {
    const projects = (state.dev && state.dev.projects) || [];
    const issues = (state.dev && state.dev.issues) || [];
    const filtered = AppDev.filterIssues(issues, { projectId: issueProject || undefined, priority: issuePriority || undefined, status: issueStatus || undefined });

    const projSel = UI.el('select', { id: 'issue-project' }, UI.el('option', { value: '', text: '全部项目' }), projectOptions(issueProject));
    projSel.addEventListener('change', function () { issueProject = projSel.value; window.App.render(); });
    const priSel = UI.el('select', { id: 'issue-priority' }, UI.el('option', { value: '', text: '全部优先级' }), ['高', '中', '低'].map((p) => UI.el('option', { value: p, text: p, selected: issuePriority === p ? 'selected' : null })));
    priSel.addEventListener('change', function () { issuePriority = priSel.value; window.App.render(); });
    const stSel = UI.el('select', { id: 'issue-status' }, UI.el('option', { value: '', text: '全部状态' }), AppDev.ISSUE_STATUSES.map((s) => UI.el('option', { value: s, text: s, selected: issueStatus === s ? 'selected' : null })));
    stSel.addEventListener('change', function () { issueStatus = stSel.value; window.App.render(); });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加问题', onclick: openIssueModal });

    const list = UI.el('div', { class: 'card' });
    if (!filtered.length) list.appendChild(UI.emptyState('没有问题', '点击上方添加'));
    filtered.forEach(function (i) {
      const badge = UI.el('span', { class: 'badge ' + (i.priority === '高' ? 'high' : i.priority === '中' ? 'medium' : 'low'), text: i.priority });
      const status = UI.el('span', { class: 'badge gray', text: i.status });
      const del = UI.el('button', { class: 'btn', text: '删除', onclick: function () {
        UI.confirm('删除问题「' + i.title + '」？', { danger: true }).then(function (ok) {
          if (!ok) return;
          AppStore.mutate(function (st) { AppDev.deleteIssue(st, i.id); });
          window.App.render();
        });
      } });
      list.appendChild(UI.el('div', { class: 'list-item' }, badge, UI.el('span', { text: i.title }), UI.el('span', { class: 'spacer' }), status, del));
    });

    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, projSel, priSel, stSel, UI.el('span', { class: 'spacer' }), addBtn), list);
  }

  function openIssueModal() {
    const title = UI.el('input', { type: 'text', placeholder: '问题标题' });
    const project = UI.el('select', {}, UI.el('option', { value: '', text: '（无项目）' }), projectOptions(null));
    const priority = UI.el('select', {}, ['高', '中', '低'].map((p) => UI.el('option', { value: p, text: p })));
    const status = UI.el('select', {}, AppDev.ISSUE_STATUSES.map((s) => UI.el('option', { value: s, text: s })));
    UI.modal({
      title: '添加问题',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, title, project, priority, status),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!title.value.trim()) { UI.toast('请输入问题标题'); return; }
      AppStore.mutate(function (st) { AppDev.addIssue(st, { title: title.value, projectId: project.value, priority: priority.value, status: status.value }); });
      window.App.render();
    });
  }

  function notesTab(state) {
    const notes = (state.dev && state.dev.notes) || [];
    const filtered = AppDev.searchNotes(notes, noteKeyword);
    const search = UI.el('input', { type: 'search', placeholder: '搜索笔记', value: noteKeyword });
    search.addEventListener('input', function () { noteKeyword = search.value; window.App.render(); });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加笔记', onclick: function () { openNoteModal(); } });

    const list = UI.el('div', { class: 'grid cols-2' });
    if (!filtered.length) list.appendChild(UI.emptyState('没有笔记', '记录代码片段、命令和踩坑'));
    filtered.forEach(function (n) {
      const card = UI.el('div', { class: 'card' },
        UI.el('h4', { text: n.title }),
        n.category ? UI.el('span', { class: 'badge blue', text: n.category }) : null,
        n.content ? UI.el('div', { class: 'muted', style: 'white-space:pre-wrap', text: n.content }) : null,
        UI.el('div', { class: 'toolbar', style: 'margin-top:8px' },
          UI.el('button', { class: 'btn', text: '编辑', onclick: function () { openNoteModal(n); } }),
          UI.el('button', { class: 'btn', text: '删除', onclick: function () {
            UI.confirm('删除笔记「' + n.title + '」？', { danger: true }).then(function (ok) {
              if (!ok) return;
              AppStore.mutate(function (st) { AppDev.deleteNote(st, n.id); });
              window.App.render();
            });
          } })
        )
      );
      list.appendChild(card);
    });

    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, search, UI.el('span', { class: 'spacer' }), addBtn), list);
  }

  function openNoteModal(note) {
    const title = UI.el('input', { type: 'text', placeholder: '标题', value: note ? note.title : '' });
    const category = UI.el('input', { type: 'text', placeholder: '分类（可选）', value: note ? note.category : '' });
    const content = UI.el('textarea', { placeholder: '内容', rows: '6' }, note ? note.content : '');
    UI.modal({
      title: note ? '编辑笔记' : '添加笔记',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, title, category, content),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!title.value.trim()) { UI.toast('请输入笔记标题'); return; }
      const fields = { title: title.value, category: category.value, content: content.value };
      AppStore.mutate(function (st) {
        if (note) AppDev.updateNote(st, note.id, fields);
        else AppDev.addNote(st, fields);
      });
      window.App.render();
    });
  }

  function logsTab(state) {
    if (!logDate) logDate = AppSummary.todayStr();
    const logs = AppDev.logsByDate(state, logDate).slice().reverse();
    const dateInput = UI.el('input', { type: 'date', value: logDate });
    dateInput.addEventListener('change', function () { logDate = dateInput.value; window.App.render(); });
    const content = UI.el('textarea', { id: 'log-content', placeholder: '今天做了什么…', rows: '3' });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加日志' });
    addBtn.addEventListener('click', function () {
      const text = content.value;
      if (!text.trim()) { UI.toast('请输入日志内容'); return; }
      AppStore.mutate(function (st) { AppDev.addLog(st, { date: logDate, content: text }); });
      window.App.render();
    });

    const list = UI.el('div', { class: 'card' });
    if (!logs.length) list.appendChild(UI.emptyState('这一天没有日志'));
    logs.forEach(function (l) {
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { class: 'muted', text: l.date }),
        UI.el('span', { text: l.content }),
        UI.el('span', { class: 'spacer' }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () {
          UI.confirm('删除这条日志？', { danger: true }).then(function (ok) {
            if (!ok) return;
            AppStore.mutate(function (st) { AppDev.deleteLog(st, l.id); });
            window.App.render();
          });
        } })
      ));
    });

    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, dateInput), UI.el('div', { class: 'card', style: 'margin-bottom:12px' }, content, UI.el('div', { class: 'toolbar', style: 'margin-top:10px' }, addBtn)), list);
  }

  window.Views.dev = function (container) {
    const state = AppStore.get();
    let body;
    if (devTab === 'board') body = boardTab(state);
    else if (devTab === 'issues') body = issuesTab(state);
    else if (devTab === 'notes') body = notesTab(state);
    else body = logsTab(state);
    UI.renderInto(container, UI.el('section', { class: 'view' }, tabBar(devTab), body));
  };
})();
