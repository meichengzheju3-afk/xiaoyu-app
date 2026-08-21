(function (global) {
  'use strict';

  const STATUSES = ['想看', '在看', '已看完', '弃书'];

  function newId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function ensureNovels(state) {
    if (!state.novels) state.novels = {};
    if (!Array.isArray(state.novels.books)) state.novels.books = [];
    if (!Array.isArray(state.novels.progress)) state.novels.progress = [];
    if (!Array.isArray(state.novels.notes)) state.novels.notes = [];
    if (!Array.isArray(state.novels.records)) state.novels.records = [];
    if (!state.novels.goal) state.novels.goal = { booksPerMonth: 0, minutesPerDay: 0 };
    return state.novels;
  }

  function addBook(state, fields) {
    const n = ensureNovels(state);
    const title = String((fields && fields.title) || '').trim();
    if (!title) throw new Error('书名不能为空');
    const book = {
      id: newId('book'),
      title: title,
      author: (fields && fields.author) || '',
      category: (fields && fields.category) || '',
      status: (fields && fields.status) || '想看',
      finishedAt: ''
    };
    n.books.push(book);
    return book;
  }

  function updateBook(state, id, patch) {
    const book = ensureNovels(state).books.find((x) => x.id === id);
    if (!book) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') book[k] = patch[k]; });
    return book;
  }

  function markFinished(state, id) {
    return updateBook(state, id, { status: '已看完', finishedAt: todayStr() });
  }

  function deleteBook(state, id) {
    const n = ensureNovels(state);
    const item = n.books.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'novelsBooks', item);
    n.books = n.books.filter((x) => x.id !== id);
    n.progress = n.progress.filter((x) => x.bookId !== id);
    n.notes = n.notes.filter((x) => x.bookId !== id);
    n.records = n.records.filter((x) => x.bookId !== id);
  }

  function statusCounts(books) {
    const counts = {};
    STATUSES.forEach((s) => { counts[s] = 0; });
    (books || []).forEach((b) => { if (counts[b.status] !== undefined) counts[b.status] += 1; });
    return counts;
  }

  function addProgress(state, fields) {
    const n = ensureNovels(state);
    const chapter = String((fields && fields.chapter) || '').trim();
    if (!chapter) throw new Error('进度内容不能为空');
    const item = {
      id: newId('nprogress'),
      bookId: (fields && fields.bookId) || '',
      chapter: chapter,
      percent: (fields && fields.percent) || '',
      page: (fields && fields.page) || '',
      finishedAt: (fields && fields.finishedAt) || ''
    };
    n.progress.push(item);
    return item;
  }

  function updateProgress(state, id, patch) {
    const p = ensureNovels(state).progress.find((x) => x.id === id);
    if (!p) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') p[k] = patch[k]; });
    return p;
  }

  function deleteProgress(state, id) {
    const n = ensureNovels(state);
    const item = n.progress.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'novelsProgress', item);
    n.progress = n.progress.filter((x) => x.id !== id);
  }

  function progressByBook(state, bookId) {
    return ensureNovels(state).progress.filter((x) => x.bookId === bookId);
  }

  function addNote(state, fields) {
    const n = ensureNovels(state);
    const content = String((fields && fields.content) || '').trim();
    if (!content) throw new Error('笔记内容不能为空');
    const note = {
      id: newId('nnote'),
      bookId: (fields && fields.bookId) || '',
      date: (fields && fields.date) || '',
      content: content
    };
    n.notes.push(note);
    return note;
  }

  function deleteNote(state, id) {
    const n = ensureNovels(state);
    const item = n.notes.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'novelsNotes', item);
    n.notes = n.notes.filter((x) => x.id !== id);
  }

  function notesByBook(state, bookId) {
    return ensureNovels(state).notes.filter((x) => x.bookId === bookId);
  }

  function addRecord(state, fields) {
    const n = ensureNovels(state);
    const date = (fields && fields.date) || '';
    const minutes = Number(fields && fields.minutes) || 0;
    if (!date || minutes <= 0) throw new Error('日期和阅读时长必须大于 0');
    const rec = {
      id: newId('nrecord'),
      bookId: (fields && fields.bookId) || '',
      date: date,
      minutes: minutes
    };
    n.records.push(rec);
    return rec;
  }

  function deleteRecord(state, id) {
    const n = ensureNovels(state);
    const item = n.records.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'novelsRecords', item);
    n.records = n.records.filter((x) => x.id !== id);
  }

  function bookName(state, bookId) {
    const book = ensureNovels(state).books.find((x) => x.id === bookId);
    return book ? book.title : '（未关联书籍）';
  }

  function totalMinutes(state) {
    return ensureNovels(state).records.reduce((s, r) => s + (Number(r.minutes) || 0), 0);
  }

  function readingStreak(state, today) {
    const recs = ensureNovels(state).records;
    const days = new Set(recs.filter((r) => Number(r.minutes) > 0).map((r) => r.date));
    let streak = 0;
    const d = new Date((today || todayStr()) + 'T00:00:00');
    if (!days.has(today || todayStr())) d.setDate(d.getDate() - 1);
    while (days.has(d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()))) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  function finishedThisMonth(state, year, month) {
    const prefix = year + '-' + pad(month);
    return ensureNovels(state).books.filter((b) => b.status === '已看完' && String(b.finishedAt || '').indexOf(prefix) === 0).length;
  }


  function setReadingGoal(state, goal) {
    const n = ensureNovels(state);
    n.goal.booksPerMonth = Number(goal && goal.booksPerMonth) || 0;
    n.goal.minutesPerDay = Number(goal && goal.minutesPerDay) || 0;
    return n.goal;
  }

  function minutesOnDate(state, date) {
    return ensureNovels(state).records.filter((r) => r.date === date).reduce((s, r) => s + (Number(r.minutes) || 0), 0);
  }

  function readingGoalProgress(state) {
    const n = ensureNovels(state);
    const now = new Date();
    const finished = finishedThisMonth(state, now.getFullYear(), now.getMonth() + 1);
    const minutesToday = minutesOnDate(state, todayStr());
    return {
      booksPerMonth: n.goal.booksPerMonth || 0,
      finishedThisMonth: finished,
      bookPercent: n.goal.booksPerMonth ? Math.min(100, Math.round((finished / n.goal.booksPerMonth) * 100)) : 0,
      minutesPerDay: n.goal.minutesPerDay || 0,
      minutesToday: minutesToday,
      minutePercent: n.goal.minutesPerDay ? Math.min(100, Math.round((minutesToday / n.goal.minutesPerDay) * 100)) : 0
    };
  }
  const api = {
    STATUSES: STATUSES,
    newId: newId,
    todayStr: todayStr,
    addBook: addBook,
    updateBook: updateBook,
    markFinished: markFinished,
    deleteBook: deleteBook,
    statusCounts: statusCounts,
    addProgress: addProgress,
    updateProgress: updateProgress,
    deleteProgress: deleteProgress,
    progressByBook: progressByBook,
    addNote: addNote,
    deleteNote: deleteNote,
    notesByBook: notesByBook,
    addRecord: addRecord,
    deleteRecord: deleteRecord,
    bookName: bookName,
    totalMinutes: totalMinutes,
    readingStreak: readingStreak,
    finishedThisMonth: finishedThisMonth,
    setReadingGoal: setReadingGoal,
    minutesOnDate: minutesOnDate,
    readingGoalProgress: readingGoalProgress
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.AppNovels = api;
})(typeof window !== 'undefined' ? window : globalThis);


