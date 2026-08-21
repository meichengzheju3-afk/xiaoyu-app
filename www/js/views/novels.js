(function () {
  'use strict';
  window.Views = window.Views || {};

  let novelsTab = 'books';
  let bookStatusFilter = '';
  let selectedBookId = null;
  let notesBook = '';

  function tabBar(current) {
    const defs = [['books', '书架'], ['progress', '进度'], ['notes', '笔记'], ['records', '阅读记录'], ['stats', '统计']];
    return UI.el('div', { class: 'tabs' }, defs.map((d) => UI.el('button', {
      class: 'tab' + (current === d[0] ? ' active' : ''),
      text: d[1],
      onclick: function () { novelsTab = d[0]; window.App.render(); }
    })));
  }

  function bookOptions(selected) {
    const state = AppStore.get();
    const books = (state.novels && state.novels.books) || [];
    return books.map((b) => UI.el('option', { value: b.id, text: b.title, selected: selected === b.id ? 'selected' : null }));
  }

  function booksTab(state) {
    const books = (state.novels && state.novels.books) || [];
    const counts = AppNovels.statusCounts(books);
    const filter = UI.el('select', { value: bookStatusFilter },
      UI.el('option', { value: '', text: '全部状态' }),
      AppNovels.STATUSES.map((s) => UI.el('option', { value: s, text: s + '（' + counts[s] + '）', selected: bookStatusFilter === s ? 'selected' : null }))
    );
    filter.addEventListener('change', function () { bookStatusFilter = filter.value; window.App.render(); });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加小说', onclick: function () { openBookModal(); } });
    const list = UI.el('div', { class: 'grid cols-3' });
    const filtered = bookStatusFilter ? books.filter((b) => b.status === bookStatusFilter) : books;
    if (!filtered.length) list.appendChild(UI.emptyState('书架是空的', '添加你喜欢的小说'));
    filtered.forEach(function (b) {
      list.appendChild(UI.el('div', { class: 'card' },
        UI.el('h4', { text: b.title }),
        b.author ? UI.el('div', { class: 'muted', text: b.author }) : null,
        b.category ? UI.el('span', { class: 'badge blue', text: b.category }) : null,
        UI.el('div', { style: 'margin-top:6px' }, UI.el('span', { class: 'badge gray', text: b.status })),
        UI.el('div', { class: 'toolbar', style: 'margin-top:10px' },
          UI.el('button', { class: 'btn', text: '开始读', onclick: function () { AppStore.mutate(function (st) { AppNovels.updateBook(st, b.id, { status: '在看' }); }); window.App.render(); } }),
          UI.el('button', { class: 'btn', text: '读完', onclick: function () { AppStore.mutate(function (st) { AppNovels.markFinished(st, b.id); }); window.App.render(); } }),
          UI.el('button', { class: 'btn', text: '编辑', onclick: function () { openBookModal(b); } }),
          UI.el('button', { class: 'btn', text: '删除', onclick: function () { UI.confirm('删除《' + b.title + '》及其进度、笔记？', { danger: true }).then(function (ok) { if (!ok) return; AppStore.mutate(function (st) { AppNovels.deleteBook(st, b.id); }); window.App.render(); }); } })
        )
      ));
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, filter, UI.el('span', { class: 'spacer' }), addBtn), list);
  }

  function openBookModal(book) {
    const title = UI.el('input', { type: 'text', placeholder: '书名', value: book ? book.title : '' });
    const author = UI.el('input', { type: 'text', placeholder: '作者', value: book ? book.author : '' });
    const category = UI.el('input', { type: 'text', placeholder: '分类 / 标签', value: book ? book.category : '' });
    const status = UI.el('select', {}, AppNovels.STATUSES.map((s) => UI.el('option', { value: s, text: s, selected: book && book.status === s ? 'selected' : null })));
    UI.modal({
      title: book ? '编辑小说' : '添加小说',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, title, author, category, status),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!title.value.trim()) { UI.toast('请输入书名'); return; }
      const fields = { title: title.value, author: author.value, category: category.value, status: status.value };
      AppStore.mutate(function (st) {
        if (book) AppNovels.updateBook(st, book.id, fields);
        else AppNovels.addBook(st, fields);
      });
      window.App.render();
    });
  }

  function progressTab(state) {
    const books = (state.novels && state.novels.books) || [];
    if (!books.length) return UI.el('div', { class: 'card' }, UI.emptyState('先添加小说', '在书架添加后再记录进度'));
    if (!selectedBookId || !books.find((b) => b.id === selectedBookId)) selectedBookId = books[0].id;
    const sel = UI.el('select', { id: 'novel-progress' }, bookOptions(selectedBookId));
    sel.addEventListener('change', function () { selectedBookId = sel.value; window.App.render(); });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '更新进度', onclick: function () { openProgressModal(); } });
    const list = UI.el('div', { class: 'card' });
    const progress = AppNovels.progressByBook(state, selectedBookId);
    if (!progress.length) list.appendChild(UI.emptyState('还没有进度'));
    progress.forEach(function (p) {
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { text: p.chapter }),
        p.percent ? UI.el('span', { class: 'badge blue', text: p.percent + '%' }) : null,
        p.page ? UI.el('span', { class: 'muted', text: p.page + ' 页' }) : null,
        UI.el('span', { class: 'spacer' }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () { AppStore.mutate(function (st) { AppNovels.deleteProgress(st, p.id); }); window.App.render(); } })
      ));
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, sel, UI.el('span', { class: 'spacer' }), addBtn), list);
  }

  function openProgressModal() {
    const chapter = UI.el('input', { type: 'text', placeholder: '当前章节 / 进度' });
    const percent = UI.el('input', { type: 'number', placeholder: '百分比 %' });
    const page = UI.el('input', { type: 'text', placeholder: '页码 / 位置' });
    UI.modal({ title: '更新进度', body: UI.el('div', { class: 'grid', style: 'gap:10px' }, chapter, percent, page), actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }] }).then(function (ok) {
      if (!ok) return;
      if (!chapter.value.trim()) { UI.toast('请输入进度内容'); return; }
      AppStore.mutate(function (st) { AppNovels.addProgress(st, { bookId: selectedBookId, chapter: chapter.value, percent: percent.value, page: page.value }); });
      window.App.render();
    });
  }

  function notesTab(state) {
    const books = (state.novels && state.novels.books) || [];
    const notes = (state.novels && state.novels.notes) || [];
    const sel = UI.el('select', { value: notesBook },
      UI.el('option', { value: '', text: '全部书籍' }),
      bookOptions(notesBook));
    sel.addEventListener('change', function () { notesBook = sel.value; window.App.render(); });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '写笔记', onclick: function () { openNoteModal(); } });
    const filtered = notesBook ? notes.filter((n) => n.bookId === notesBook) : notes;
    const list = UI.el('div', { class: 'card' });
    if (!filtered.length) list.appendChild(UI.emptyState('还没有读书笔记'));
    filtered.slice().reverse().forEach(function (n) {
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { class: 'badge blue', text: AppNovels.bookName(state, n.bookId) }),
        UI.el('span', { text: n.content }),
        UI.el('span', { class: 'spacer' }),
        UI.el('span', { class: 'muted', text: n.date }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () { AppStore.mutate(function (st) { AppNovels.deleteNote(st, n.id); }); window.App.render(); } })
      ));
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, sel, UI.el('span', { class: 'spacer' }), addBtn), list);
  }

  function openNoteModal() {
    const state = AppStore.get();
    const bookSel = UI.el('select', {}, UI.el('option', { value: '', text: '（未关联）' }), bookOptions(null));
    const date = UI.el('input', { type: 'date', value: AppNovels.todayStr() });
    const content = UI.el('textarea', { placeholder: '摘抄 / 感想', rows: '4' });
    UI.modal({ title: '写笔记', body: UI.el('div', { class: 'grid', style: 'gap:10px' }, bookSel, date, content), actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }] }).then(function (ok) {
      if (!ok) return;
      if (!content.value.trim()) { UI.toast('请输入笔记内容'); return; }
      AppStore.mutate(function (st) { AppNovels.addNote(st, { bookId: bookSel.value, date: date.value, content: content.value }); });
      window.App.render();
    });
  }

  function recordsTab(state) {
    const books = (state.novels && state.novels.books) || [];
    const records = (state.novels && state.novels.records) || [];
    const bookSel = UI.el('select', {}, UI.el('option', { value: '', text: '（未关联）' }), bookOptions(null));
    const date = UI.el('input', { type: 'date', value: AppNovels.todayStr() });
    const minutes = UI.el('input', { type: 'number', placeholder: '阅读分钟' });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '记录' });
    addBtn.addEventListener('click', function () {
      const m = Number(minutes.value);
      if (!m || m <= 0) { UI.toast('请输入有效阅读时长'); return; }
      AppStore.mutate(function (st) { AppNovels.addRecord(st, { bookId: bookSel.value, date: date.value, minutes: m }); });
      window.App.render();
    });
    const list = UI.el('div', { class: 'card' });
    if (!records.length) list.appendChild(UI.emptyState('还没有阅读记录'));
    records.slice().reverse().forEach(function (r) {
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { class: 'muted', text: r.date }),
        UI.el('span', { text: AppNovels.bookName(state, r.bookId) }),
        UI.el('span', { class: 'badge blue', text: r.minutes + ' 分钟' }),
        UI.el('span', { class: 'spacer' }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () { AppStore.mutate(function (st) { AppNovels.deleteRecord(st, r.id); }); window.App.render(); } })
      ));
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, bookSel, date, minutes, addBtn), list);
  }

  function statsTab(state) {
    const books = (state.novels && state.novels.books) || [];
    const counts = AppNovels.statusCounts(books);
    const total = AppNovels.totalMinutes(state);
    const streak = AppNovels.readingStreak(state, AppNovels.todayStr());
    const now = new Date();
    const finished = AppNovels.finishedThisMonth(state, now.getFullYear(), now.getMonth() + 1);
    const cards = UI.el('div', { class: 'grid cols-4' },
      UI.el('div', { class: 'card' }, UI.el('h4', { text: '藏书' }), UI.el('div', { class: 'muted', text: books.length + ' 本' })),
      UI.el('div', { class: 'card' }, UI.el('h4', { text: '本月读完' }), UI.el('div', { class: 'muted', text: finished + ' 本' })),
      UI.el('div', { class: 'card' }, UI.el('h4', { text: '累计阅读' }), UI.el('div', { class: 'muted', text: total + ' 分钟' })),
      UI.el('div', { class: 'card' }, UI.el('h4', { text: '连续阅读' }), UI.el('div', { class: 'muted', text: streak + ' 天' }))
    );
    const statusCard = UI.el('div', { class: 'card' },
      UI.el('h4', { text: '阅读状态' }),
      AppNovels.STATUSES.map((s) => UI.el('div', { class: 'list-item' }, UI.el('span', { text: s }), UI.el('span', { class: 'spacer' }), UI.el('span', { class: 'badge blue', text: String(counts[s]) })))
    );
    const goal = (state.novels && state.novels.goal) || { booksPerMonth: 0, minutesPerDay: 0 };
    const g = AppNovels.readingGoalProgress(state);
    const booksInput = UI.el('input', { type: 'number', placeholder: '每月读几本', value: goal.booksPerMonth ? String(goal.booksPerMonth) : '' });
    const minutesInput = UI.el('input', { type: 'number', placeholder: '每日读几分钟', value: goal.minutesPerDay ? String(goal.minutesPerDay) : '' });
    const saveGoal = UI.el('button', { class: 'btn btn-primary', text: '保存目标' });
    saveGoal.addEventListener('click', function () {
      AppStore.mutate(function (st) { AppNovels.setReadingGoal(st, { booksPerMonth: booksInput.value, minutesPerDay: minutesInput.value }); });
      UI.toast('目标已保存', 'success');
      window.App.render();
    });
    const goalCard = UI.el('div', { class: 'card' },
      UI.el('h4', { text: '阅读目标' }),
      UI.el('div', { class: 'toolbar' }, booksInput, minutesInput, saveGoal),
      UI.el('div', { class: 'muted', text: '本月读完 ' + g.finishedThisMonth + ' / ' + g.booksPerMonth + ' 本' }),
      UI.el('div', { class: 'progress' }, UI.el('span', { style: 'width:' + g.bookPercent + '%' })),
      UI.el('div', { class: 'muted', text: '今日阅读 ' + g.minutesToday + ' / ' + g.minutesPerDay + ' 分钟' }),
      UI.el('div', { class: 'progress' }, UI.el('span', { style: 'width:' + g.minutePercent + '%' }))
    );
    return UI.el('div', {}, cards, UI.el('div', { class: 'grid cols-2', style: 'margin-top:16px' }, goalCard, statusCard));
  }

  window.Views.novels = function (container) {
    const state = AppStore.get();
    let body;
    if (novelsTab === 'books') body = booksTab(state);
    else if (novelsTab === 'progress') body = progressTab(state);
    else if (novelsTab === 'notes') body = notesTab(state);
    else if (novelsTab === 'records') body = recordsTab(state);
    else body = statsTab(state);
    UI.renderInto(container, UI.el('section', { class: 'view' }, tabBar(novelsTab), body));
  };
})();

