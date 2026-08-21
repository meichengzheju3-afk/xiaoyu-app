(function () {
  'use strict';
  window.Views = window.Views || {};

  let mediaTab = 'ideas';
  let calYear = null;
  let calMonth = null;
  let selectedDate = null;

  function tabs(current) {
    const defs = [
      ['ideas', '灵感池'],
      ['contents', '内容库'],
      ['schedule', '发布日历']
    ];
    return UI.el('div', { class: 'tabs' }, defs.map(function (d) {
      return UI.el('button', { class: 'tab' + (current === d[0] ? ' active' : ''), text: d[1], onclick: function () { mediaTab = d[0]; window.App.render(); } });
    }));
  }

  function ideasTab(state) {
    const ideas = (state.media && state.media.ideas) || [];
    const title = UI.el('input', { id: 'idea-title', type: 'text', placeholder: '灵感标题 / 一句话想法' });
    const source = UI.el('input', { id: 'idea-source', type: 'text', placeholder: '来源链接（可选）' });
    const note = UI.el('input', { id: 'idea-note', type: 'text', placeholder: '备注（可选）' });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '记一个灵感' });
    addBtn.addEventListener('click', function () {
      const t = title.value;
      if (!t.trim()) { UI.toast('请输入灵感标题'); return; }
      AppStore.mutate(function (st) { AppMedia.addIdea(st, { title: t, source: source.value, note: note.value }); });
      window.App.render();
    });
    const form = UI.el('div', { class: 'toolbar' }, title, source, note, addBtn);

    const list = UI.el('div', { class: 'grid cols-2' });
    if (!ideas.length) list.appendChild(UI.emptyState('还没有灵感', '记下你的选题和点子'));
    ideas.forEach(function (idea) {
      const card = UI.el('div', { class: 'card' },
        UI.el('h4', { text: idea.title }),
        idea.source ? UI.el('div', { class: 'muted' }, '来源：' + idea.source) : null,
        idea.note ? UI.el('div', { class: 'muted' }, '备注：' + idea.note) : null,
        UI.el('div', { class: 'toolbar', style: 'margin-top:10px' },
          UI.el('button', { class: 'btn btn-secondary', text: '转为草稿', onclick: function () {
            AppStore.mutate(function (st) { AppMedia.convertIdeaToContent(st, idea.id); });
            UI.toast('已转为草稿');
            mediaTab = 'contents';
            window.App.render();
          } }),
          UI.el('button', { class: 'btn', text: '删除', onclick: function () {
            UI.confirm('删除这条灵感？', { danger: true }).then(function (ok) {
              if (!ok) return;
              AppStore.mutate(function (st) { AppMedia.deleteIdea(st, idea.id); });
              window.App.render();
            });
          } })
        )
      );
      list.appendChild(card);
    });

    return UI.el('div', {}, form, list);
  }

  function contentCard(state, c) {
    return UI.el('div', { class: 'card', draggable: 'true', 'data-id': c.id, style: 'margin-bottom:10px; cursor:grab' },
      UI.el('div', { text: c.title }),
      c.platform ? UI.el('div', { class: 'muted', text: c.platform }) : null,
      c.link ? UI.el('div', { class: 'muted', text: c.link }) : null,
      UI.el('div', { class: 'toolbar', style: 'margin-top:8px' },
        UI.el('button', { class: 'btn', text: '删除', onclick: function () {
          UI.confirm('删除内容「' + c.title + '」？', { danger: true }).then(function (ok) {
            if (!ok) return;
            AppStore.mutate(function (st) { AppMedia.deleteContent(st, c.id); });
            window.App.render();
          });
        } })
      )
    );
  }

  function bindCardDrag(el, state, c) {
    el.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('text/plain', c.id);
    });
    el.addEventListener('dragover', function (e) { e.preventDefault(); });
    el.addEventListener('drop', function (e) {
      e.preventDefault();
      const col = el.closest('.kanban-col');
      const status = col ? col.getAttribute('data-status') : null;
      if (status) {
        AppStore.mutate(function (st) { AppMedia.changeStatus(st, c.id, status); });
        window.App.render();
      }
    });
  }

  function contentsTab(state) {
    const contents = (state.media && state.media.contents) || [];
    const counts = AppMedia.statusCounts(contents);
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加内容' });
    addBtn.addEventListener('click', function () { openContentModal(); });

    const kanban = UI.el('div', { class: 'kanban' });
    AppMedia.STATUSES.forEach(function (status) {
      const col = UI.el('div', { class: 'kanban-col', 'data-status': status },
        UI.el('div', { class: 'kanban-title' }, status + ' · ' + counts[status])
      );
      AppMedia.listByStatus(contents, status).forEach(function (c) {
        const card = contentCard(state, c);
        bindCardDrag(card, state, c);
        col.appendChild(card);
      });
      kanban.appendChild(col);
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, addBtn), kanban);
  }

  function openContentModal() {
    const title = UI.el('input', { type: 'text', placeholder: '内容标题' });
    const platform = UI.el('input', { type: 'text', placeholder: '平台（如 公众号 / 抖音）' });
    const link = UI.el('input', { type: 'text', placeholder: '发布链接（可选）' });
    const status = UI.el('select', {}, AppMedia.STATUSES.map((s) => UI.el('option', { value: s, text: s })));
    const body = UI.el('div', { class: 'grid', style: 'gap:10px' }, title, platform, link, status);
    UI.modal({
      title: '添加内容',
      body: body,
      actions: [
        { text: '取消', value: false },
        { text: '保存', value: true, class: 'btn-primary' }
      ]
    }).then(function (ok) {
      if (!ok) return;
      const t = title.value;
      if (!t.trim()) { UI.toast('请输入内容标题'); return; }
      AppStore.mutate(function (st) { AppMedia.addContent(st, { title: t, platform: platform.value, link: link.value, status: status.value }); });
      window.App.render();
    });
  }

  function scheduleTab(state) {
    if (!calYear) {
      const now = new Date();
      calYear = now.getFullYear();
      calMonth = now.getMonth() + 1;
      selectedDate = AppSummary.todayStr();
    }
    const days = AppMedia.monthDays(calYear, calMonth);
    const sched = (state.media && state.media.schedule) || [];
    const countMap = {};
    sched.forEach((s) => { countMap[s.date] = (countMap[s.date] || 0) + 1; });

    const prevBtn = UI.el('button', { class: 'btn', text: '◀', onclick: function () { calMonth -= 1; if (calMonth < 1) { calMonth = 12; calYear -= 1; } window.App.render(); } });
    const nextBtn = UI.el('button', { class: 'btn', text: '▶', onclick: function () { calMonth += 1; if (calMonth > 12) { calMonth = 1; calYear += 1; } window.App.render(); } });
    const label = UI.el('span', { class: 'muted', text: calYear + ' 年 ' + calMonth + ' 月' });

    const grid = UI.el('div', { class: 'grid cols-7', style: 'grid-template-columns: repeat(7, 1fr)' });
    ['日', '一', '二', '三', '四', '五', '六'].forEach((w) => grid.appendChild(UI.el('div', { class: 'muted', text: w })));
    days.forEach(function (d) {
      const count = countMap[d.date] || 0;
      const cell = UI.el('div', { class: 'card', style: 'min-height:56px; cursor:pointer', onclick: function () { selectedDate = d.date; window.App.render(); } },
        UI.el('div', { text: String(d.day) }),
        count ? UI.el('span', { class: 'badge blue', text: String(count) }) : null
      );
      grid.appendChild(cell);
    });

    const selected = selectedDate || AppSummary.todayStr();
    const items = AppMedia.schedulesByDate(state, selected);
    const detail = UI.el('div', { class: 'card', style: 'margin-top:16px' },
      UI.el('h3', { text: selected + ' 的发布安排' }),
      items.length ? items.map(function (s) {
        return UI.el('div', { class: 'list-item' },
          UI.el('span', { text: AppMedia.contentTitle(state, s.contentId) }),
          s.platform ? UI.el('span', { class: 'badge gray', text: s.platform }) : null,
          UI.el('span', { class: 'spacer' }),
          UI.el('button', { class: 'btn', text: '删除', onclick: function () {
            AppStore.mutate(function (st) { AppMedia.deleteSchedule(st, s.id); });
            window.App.render();
          } })
        );
      }) : UI.el('div', { class: 'muted', text: '这一天还没有排期' }),
      scheduleForm(state, selected)
    );

    return UI.el('div', {},
      UI.el('div', { class: 'toolbar' }, prevBtn, label, nextBtn),
      grid,
      detail
    );
  }

  function scheduleForm(state, date) {
    const contents = (state.media && state.media.contents) || [];
    const sel = UI.el('select', { id: 'sched-content' }, contents.map((c) => UI.el('option', { value: c.id, text: c.title })));
    const platform = UI.el('input', { type: 'text', placeholder: '平台（可选）' });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加排期' });
    addBtn.addEventListener('click', function () {
      AppStore.mutate(function (st) {
        AppMedia.addSchedule(st, { date: date, contentId: sel.value, platform: platform.value });
      });
      window.App.render();
    });
    return UI.el('div', { class: 'toolbar', style: 'margin-top:10px' }, sel, platform, addBtn);
  }

  window.Views.media = function (container) {
    const state = AppStore.get();
    let body;
    if (mediaTab === 'ideas') body = ideasTab(state);
    else if (mediaTab === 'contents') body = contentsTab(state);
    else body = scheduleTab(state);
    const view = UI.el('section', { class: 'view' }, tabs(mediaTab), body);
    UI.renderInto(container, view);
  };
})();
