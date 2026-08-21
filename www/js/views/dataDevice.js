(function () {
  'use strict';
  window.Views = window.Views || {};

  let dataDeviceTab = 'overview';

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = UI.el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function tabBar(current) {
    const defs = [['overview', '数据概览'], ['backup', '备份恢复'], ['trash', '回收站'], ['devices', '设备账号']];
    return UI.el('div', { class: 'tabs' }, defs.map((d) => UI.el('button', {
      class: 'tab' + (current === d[0] ? ' active' : ''),
      text: d[1],
      onclick: function () { dataDeviceTab = d[0]; window.App.render(); }
    })));
  }

  function overviewTab(state) {
    const o = AppDataDevice.overview(state);
    const c = o.counts;
    const rows = [
      ['首页备忘', c.memos],
      ['今日计划任务', c.plans],
      ['自媒体（灵感/内容/排期）', c.mediaIdeas + '/' + c.mediaContents + '/' + c.mediaSchedule],
      ['开发（项目/卡片/问题/笔记/日志）', c.devProjects + '/' + c.devCards + '/' + c.devIssues + '/' + c.devNotes + '/' + c.devLogs],
      ['咨询（客户/个案/日程/纪要）', c.consultingClients + '/' + c.consultingCases + '/' + c.consultingEvents + '/' + c.consultingNotes],
      ['健身（计划/日志/身体数据）', c.fitnessPlans + '/' + c.fitnessLogs + '/' + c.fitnessBody],
      ['饮食（记录/食谱）', c.dietRecords + '/' + c.dietRecipes],
      ['小说阅读（书籍/进度/笔记/记录）', c.novelsBooks + '/' + c.novelsProgress + '/' + c.novelsNotes + '/' + c.novelsRecords],
      ['设备账号', c.devices],
      ['备份数量', c.backups]
    ];
    const list = UI.el('div', { class: 'card' });
    rows.forEach((r) => {
      list.appendChild(UI.el('div', { class: 'list-item' }, UI.el('span', { text: r[0] }), UI.el('span', { class: 'spacer' }), UI.el('span', { class: 'badge blue', text: String(r[1]) })));
    });
    const needBackup = AppTrash.backupReminder(state, 7);
    const backupInfo = UI.el('div', { class: 'card', style: 'margin-bottom:12px' },
      UI.el('h4', { text: '最近备份' }),
      UI.el('div', { class: 'muted', text: o.lastBackupAt ? new Date(o.lastBackupAt).toLocaleString('zh-CN') : '尚未备份' }),
      needBackup ? UI.el('span', { class: 'badge high', text: '建议尽快备份' }) : null
    );
    const exportCard = UI.el('div', { class: 'card', style: 'margin-bottom:12px' },
      UI.el('h4', { text: '导出数据' }),
      UI.el('div', { class: 'toolbar' },
        UI.el('button', { class: 'btn', text: '导出 JSON', onclick: function () { download('app-data.json', AppExport.exportJson(state), 'application/json'); } }),
        UI.el('button', { class: 'btn', text: '导出 CSV', onclick: function () { download('app-data.csv', '\\uFEFF' + AppExport.exportCsv(state), 'text/csv;charset=utf-8'); } })
      )
    );
    return UI.el('div', {}, backupInfo, exportCard, list);
  }

  function backupTab(state) {
    const listEl = UI.el('div', { class: 'card' });
    const backupBtn = UI.el('button', { class: 'btn btn-primary', text: '一键备份' });
    backupBtn.addEventListener('click', async function () {
      try {
        const b = await AppApi.backup();
        AppStore.set(await AppApi.getState());
        UI.toast('备份成功：' + b.file);
        loadBackups(listEl);
      } catch (e) { UI.toast('备份失败：' + e.message); }
    });

    const fileInput = UI.el('input', { type: 'file', accept: '.json' });
    const restoreBtn = UI.el('button', { class: 'btn btn-secondary', text: '从文件恢复' });
    restoreBtn.addEventListener('click', function () {
      const file = fileInput.files && fileInput.files[0];
      if (!file) { UI.toast('请先选择备份文件'); return; }
      UI.confirm('恢复将覆盖当前全部数据，确定继续吗？建议先备份。', { danger: true, okText: '确定恢复' }).then(async function (ok) {
        if (!ok) return;
        try {
          await AppApi.restoreByFile(file);
          AppStore.set(await AppApi.getState());
          UI.toast('恢复成功', 'success');
          window.App.render();
        } catch (e) { UI.toast('恢复失败：' + e.message, 'error'); }
      });
    });

    const controls = UI.el('div', { class: 'toolbar' }, backupBtn, fileInput, restoreBtn);
    const wrap = UI.el('div', {}, controls, listEl);
    loadBackups(listEl);
    return wrap;
  }

  async function loadBackups(listEl) {
    listEl.replaceChildren(UI.el('div', { class: 'muted', text: '加载中…' }));
    try {
      const backups = await AppApi.listBackups();
      listEl.replaceChildren();
      if (!backups.length) listEl.appendChild(UI.emptyState('还没有备份'));
      backups.forEach(function (b) {
        const row = UI.el('div', { class: 'list-item' },
          UI.el('span', { text: b.file }),
          UI.el('span', { class: 'muted', text: new Date(b.time).toLocaleString('zh-CN') }),
          UI.el('span', { class: 'spacer' }),
          UI.el('button', { class: 'btn', text: '下载', onclick: function () { AppApi.downloadBackup(b.file).catch(function (e) { UI.toast(e.message, 'error'); }); } }),
          UI.el('button', { class: 'btn btn-secondary', text: '恢复', onclick: function () {
            UI.confirm('确定用「' + b.file + '」恢复？当前数据将被替换。', { danger: true, okText: '确定恢复' }).then(async function (ok) {
              if (!ok) return;
              try {
                await AppApi.restoreByStored(b.file);
                AppStore.set(await AppApi.getState());
                UI.toast('恢复成功');
                window.App.render();
              } catch (e) { UI.toast('恢复失败：' + e.message); }
            });
          } })
        );
        listEl.appendChild(row);
      });
    } catch (e) {
      listEl.replaceChildren(UI.el('div', { class: 'muted', text: '加载备份失败：' + e.message }));
    }
  }

  function devicesTab(state) {
    const items = (state.devices && state.devices.items) || [];
    const name = UI.el('input', { type: 'text', placeholder: '名称' });
    const type = UI.el('input', { type: 'text', placeholder: '类型（如 电脑 / 外设 / 软件账号）' });
    const purpose = UI.el('input', { type: 'text', placeholder: '用途（可选）' });
    const info = UI.el('input', { type: 'text', placeholder: '关键信息（可选）' });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加' });
    addBtn.addEventListener('click', function () {
      if (!name.value.trim()) { UI.toast('请输入名称'); return; }
      AppStore.mutate(function (st) { AppDataDevice.addDevice(st, { name: name.value, type: type.value, purpose: purpose.value, info: info.value }); });
      window.App.render();
    });
    const list = UI.el('div', { class: 'card' });
    if (!items.length) list.appendChild(UI.emptyState('还没有设备记录'));
    items.forEach(function (d) {
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { class: 'badge gray', text: d.type || '未分类' }),
        UI.el('span', { text: d.name }),
        d.purpose ? UI.el('span', { class: 'muted', text: d.purpose }) : null,
        UI.el('span', { class: 'spacer' }),
        UI.el('button', { class: 'btn', text: '编辑', onclick: function () { openDeviceModal(d); } }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () {
          UI.confirm('删除设备「' + d.name + '」？', { danger: true }).then(function (ok) {
            if (!ok) return;
            AppStore.mutate(function (st) { AppDataDevice.deleteDevice(st, d.id); });
            window.App.render();
          });
        } })
      ));
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, name, type, purpose, info, addBtn), list);
  }

  function openDeviceModal(d) {
    const name = UI.el('input', { type: 'text', placeholder: '名称', value: d ? d.name : '' });
    const type = UI.el('input', { type: 'text', placeholder: '类型', value: d ? d.type : '' });
    const purpose = UI.el('input', { type: 'text', placeholder: '用途', value: d ? d.purpose : '' });
    const info = UI.el('input', { type: 'text', placeholder: '关键信息', value: d ? d.info : '' });
    UI.modal({
      title: d ? '编辑设备' : '添加设备',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, name, type, purpose, info),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!name.value.trim()) { UI.toast('请输入名称'); return; }
      const fields = { name: name.value, type: type.value, purpose: purpose.value, info: info.value };
      AppStore.mutate(function (st) {
        if (d) AppDataDevice.updateDevice(st, d.id, fields);
        else AppDataDevice.addDevice(st, fields);
      });
      window.App.render();
    });
  }


  function trashTab(state) {
    const items = AppTrash.list(state);
    const purgeAll = UI.el('button', { class: 'btn btn-danger', text: '清空回收站', onclick: function () {
      UI.confirm('清空回收站后无法恢复，确定吗？', { danger: true }).then(function (ok) {
        if (!ok) return;
        AppStore.mutate(function (st) { AppTrash.purgeExpired(st, 0); });
        window.App.render();
      });
    } });
    const list = UI.el('div', { class: 'card' });
    if (!items.length) list.appendChild(UI.emptyState('回收站是空的', '删除的内容会先到这里'));
    items.forEach(function (t) {
      const name = (t.item && (t.item.title || t.item.text || t.item.name || t.item.food || t.item.content)) || '（未命名）';
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { class: 'badge gray', text: t.key }),
        UI.el('span', { text: String(name) }),
        UI.el('span', { class: 'spacer' }),
        UI.el('button', { class: 'btn btn-secondary', text: '恢复', onclick: function () {
          AppStore.mutate(function (st) { AppTrash.restore(st, t.id); });
          UI.toast('已恢复', 'success');
          window.App.render();
        } }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () {
          AppStore.mutate(function (st) { AppTrash.purge(st, t.id); });
          window.App.render();
        } })
      ));
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, UI.el('span', { class: 'spacer' }), purgeAll), list);
  }
  window.Views.dataDevice = function (container) {
    const state = AppStore.get();
    let body;
    if (dataDeviceTab === 'overview') body = overviewTab(state);
    else if (dataDeviceTab === 'backup') body = backupTab(state);
    else if (dataDeviceTab === 'trash') body = trashTab(state);
    else body = devicesTab(state);
    UI.renderInto(container, UI.el('section', { class: 'view' }, tabBar(dataDeviceTab), body));
  };
})();




