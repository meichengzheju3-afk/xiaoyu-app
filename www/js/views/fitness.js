(function () {
  'use strict';
  window.Views = window.Views || {};

  let fitnessTab = 'plans';
  let logDate = null;

  function tabBar(current) {
    const defs = [['plans', '训练计划'], ['recommended', '推荐计划'], ['logs', '训练日志'], ['body', '身体数据']];
    return UI.el('div', { class: 'tabs' }, defs.map((d) => UI.el('button', {
      class: 'tab' + (current === d[0] ? ' active' : ''),
      text: d[1],
      onclick: function () { fitnessTab = d[0]; window.App.render(); }
    })));
  }

  function plansTab(state) {
    const plans = (state.fitness && state.fitness.plans) || [];
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加训练日', onclick: function () { openPlanModal(); } });
    const list = UI.el('div', { class: 'grid cols-2' });
    if (!plans.length) list.appendChild(UI.emptyState('还没有训练计划', '添加一个训练日'));
    plans.forEach(function (plan) {
      const table = UI.el('div', { class: 'card', style: 'margin-top:8px' },
        UI.el('h4', { text: plan.name + (plan.date ? '（' + plan.date + '）' : '') }),
        plan.exercises.length ? plan.exercises.map(function (ex, i) {
          return UI.el('div', { class: 'list-item' },
            UI.el('span', { text: ex.name }),
            UI.el('span', { class: 'muted', text: ex.sets + ' 组 · ' + ex.reps + ' 次 · ' + ex.weight + ' kg' }),
            UI.el('span', { class: 'spacer' }),
            UI.el('button', { class: 'btn', text: '删除', onclick: function () {
              AppStore.mutate(function (st) { AppFitness.deleteExercise(st, plan.id, i); });
              window.App.render();
            } })
          );
        }) : UI.el('div', { class: 'muted', text: '还没有动作' }),
        UI.el('div', { class: 'toolbar', style: 'margin-top:10px' },
          UI.el('button', { class: 'btn', text: '添加动作', onclick: function () { openExerciseModal(plan); } }),
          UI.el('button', { class: 'btn', text: '删除计划', onclick: function () {
            UI.confirm('删除训练计划「' + plan.name + '」？', { danger: true }).then(function (ok) {
              if (!ok) return;
              AppStore.mutate(function (st) { AppFitness.deletePlan(st, plan.id); });
              window.App.render();
            });
          } })
        )
      );
      list.appendChild(table);
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, UI.el('span', { class: 'spacer' }), addBtn), list);
  }

  function openPlanModal() {
    const name = UI.el('input', { type: 'text', placeholder: '训练日名称（如 练背）' });
    const date = UI.el('input', { type: 'date' });
    UI.modal({
      title: '添加训练日',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, name, date),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!name.value.trim()) { UI.toast('请输入训练日名称'); return; }
      AppStore.mutate(function (st) { AppFitness.addPlan(st, { name: name.value, date: date.value }); });
      window.App.render();
    });
  }

  function openExerciseModal(plan) {
    const name = UI.el('input', { type: 'text', placeholder: '动作名称' });
    const sets = UI.el('input', { type: 'text', placeholder: '组数' });
    const reps = UI.el('input', { type: 'text', placeholder: '次数' });
    const weight = UI.el('input', { type: 'text', placeholder: '重量 kg' });
    UI.modal({
      title: '添加动作',
      body: UI.el('div', { class: 'grid cols-2', style: 'gap:10px' }, name, sets, reps, weight),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!name.value.trim()) { UI.toast('请输入动作名称'); return; }
      AppStore.mutate(function (st) { AppFitness.addExercise(st, plan.id, { name: name.value, sets: sets.value, reps: reps.value, weight: weight.value }); });
      window.App.render();
    });
  }

  function logsTab(state) {
    if (!logDate) logDate = AppSummary.todayStr();
    const logs = AppFitness.logsByDate(state, logDate).slice().reverse();
    const plans = (state.fitness && state.fitness.plans) || [];
    const dateInput = UI.el('input', { type: 'date', value: logDate });
    dateInput.addEventListener('change', function () { logDate = dateInput.value; window.App.render(); });
    const applyBtn = UI.el('button', { class: 'btn btn-secondary', text: '套用训练计划', onclick: function () { openApplyModal(); } });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '手动记录', onclick: function () { openManualLogModal(); } });

    const list = UI.el('div', { class: 'card' });
    if (!logs.length) list.appendChild(UI.emptyState('这一天没有训练记录'));
    logs.forEach(function (log) {
      list.appendChild(UI.el('div', { class: 'card', style: 'margin-bottom:10px' },
        UI.el('h4', { text: log.part || '训练记录' }),
        log.exercises.length ? log.exercises.map(function (ex) {
          return UI.el('div', { class: 'list-item' },
            UI.el('span', { text: ex.name }),
            UI.el('span', { class: 'muted', text: ex.sets + ' 组 · ' + ex.reps + ' 次 · ' + ex.weight + ' kg' })
          );
        }) : UI.el('div', { class: 'muted', text: '无动作' }),
        UI.el('div', { class: 'toolbar', style: 'margin-top:8px' }, UI.el('button', { class: 'btn', text: '删除', onclick: function () {
          UI.confirm('删除这条训练日志？', { danger: true }).then(function (ok) {
            if (!ok) return;
            AppStore.mutate(function (st) { AppFitness.deleteLog(st, log.id); });
            window.App.render();
          });
        } }))
      ));
    });

    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, dateInput, UI.el('span', { class: 'spacer' }), applyBtn, addBtn), list);
  }

  function openApplyModal() {
    const state = AppStore.get();
    const plans = (state.fitness && state.fitness.plans) || [];
    const sel = UI.el('select', {}, plans.map((p) => UI.el('option', { value: p.id, text: p.name })));
    UI.modal({
      title: '套用训练计划',
      body: plans.length ? UI.el('div', {}, sel) : UI.el('div', { class: 'muted', text: '还没有训练计划' }),
      actions: [{ text: '取消', value: false }, { text: '套用', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      AppStore.mutate(function (st) { AppFitness.applyPlan(st, sel.value, logDate); });
      window.App.render();
    });
  }

  function openManualLogModal() {
    const part = UI.el('input', { type: 'text', placeholder: '训练部位（如 背）' });
    const name = UI.el('input', { type: 'text', placeholder: '动作名称' });
    const sets = UI.el('input', { type: 'text', placeholder: '组数' });
    const reps = UI.el('input', { type: 'text', placeholder: '次数' });
    const weight = UI.el('input', { type: 'text', placeholder: '重量 kg' });
    UI.modal({
      title: '手动记录',
      body: UI.el('div', { class: 'grid cols-2', style: 'gap:10px' }, part, name, sets, reps, weight),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      AppStore.mutate(function (st) {
        AppFitness.addLog(st, { date: logDate, part: part.value, exercises: [{ name: name.value || '训练', sets: sets.value, reps: reps.value, weight: weight.value }] });
      });
      window.App.render();
    });
  }

  function bodyTab(state) {
    const records = AppFitness.bodyRecords(state);
    const date = UI.el('input', { type: 'date', value: AppSummary.todayStr() });
    const weight = UI.el('input', { type: 'number', step: '0.1', placeholder: '体重 kg' });
    const waist = UI.el('input', { type: 'number', step: '0.1', placeholder: '腰围 cm' });
    const hip = UI.el('input', { type: 'number', step: '0.1', placeholder: '臀围 cm' });
    const bodyFat = UI.el('input', { type: 'number', step: '0.1', placeholder: '体脂 %' });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '记录' });
    addBtn.addEventListener('click', function () {
      AppStore.mutate(function (st) { AppFitness.addBodyRecord(st, { date: date.value, weight: weight.value, waist: waist.value, hip: hip.value, bodyFat: bodyFat.value }); });
      window.App.render();
    });

    const list = UI.el('div', { class: 'card' });
    if (!records.length) list.appendChild(UI.emptyState('还没有身体数据'));
    records.slice().reverse().forEach(function (r) {
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { class: 'muted', text: r.date }),
        UI.el('span', { text: '体重 ' + (r.weight || '-') + ' kg · 腰围 ' + (r.waist || '-') + ' cm · 臀围 ' + (r.hip || '-') + ' cm · 体脂 ' + (r.bodyFat || '-') + '%' }),
        UI.el('span', { class: 'spacer' }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () {
          UI.confirm('删除这条身体数据？', { danger: true }).then(function (ok) {
            if (!ok) return;
            AppStore.mutate(function (st) { AppFitness.deleteBodyRecord(st, r.id); });
            window.App.render();
          });
        } })
      ));
    });

    return UI.el('div', {},
      UI.el('div', { class: 'toolbar' }, date, weight, waist, hip, bodyFat, addBtn),
      list
    );
  }


  function recommendedTab(state) {
    let goal = '全部';
    let equipment = '全部';
    let days = '';
    let exKeyword = '';
    let exMuscle = '全部';

    function renderFilters() {
      const goalSel = UI.el('select', { value: goal },
        ['全部', '增肌', '减脂', '塑形', '增力'].map((g) => UI.el('option', { value: g, text: g, selected: goal === g ? 'selected' : null })));
      goalSel.addEventListener('change', function () { goal = goalSel.value; window.App.render(); });
      const eqSel = UI.el('select', { value: equipment },
        ['全部', '无器械', '器械'].map((e) => UI.el('option', { value: e, text: e, selected: equipment === e ? 'selected' : null })));
      eqSel.addEventListener('change', function () { equipment = eqSel.value; window.App.render(); });
      const daySel = UI.el('select', { value: days },
        [['', '每周天数'], ['3', '3 天'], ['4', '4 天'], ['5', '5 天'], ['6', '6 天']].map((d) => UI.el('option', { value: d[0], text: d[1], selected: days === d[0] ? 'selected' : null })));
      daySel.addEventListener('change', function () { days = daySel.value; window.App.render(); });
      return UI.el('div', { class: 'toolbar' },
        UI.el('span', { class: 'muted', text: '定制向导' }), goalSel, eqSel, daySel, UI.el('span', { class: 'spacer' })
      );
    }

    function adopt(plan) {
      UI.confirm('采用「' + plan.name + '」为你的训练计划？').then(function (ok) {
        if (!ok) return;
        AppStore.mutate(function (st) {
          AppFitness.addPlanWithExercises(st, { name: plan.name, date: AppSummary.todayStr(), exercises: plan.exercises });
        });
        UI.toast('已采用，可到「训练计划」中微调');
        window.App.render();
      });
    }

    const filters = renderFilters();
    const opts = { goal: goal === '全部' ? '' : goal, equipment: equipment === '全部' ? '' : equipment, daysPerWeek: days || '' };
    const plans = AppFitnessRecommended.recommend(opts);
    const planCards = UI.el('div', { class: 'grid cols-2' });
    if (!plans.length) planCards.appendChild(UI.emptyState('没有匹配的推荐计划', '调整筛选条件试试'));
    plans.forEach(function (plan) {
      planCards.appendChild(UI.el('div', { class: 'card' },
        UI.el('h4', { text: plan.name }),
        UI.el('div', { class: 'muted', text: plan.description }),
        UI.el('div', { style: 'margin-top:8px' },
          UI.el('span', { class: 'badge blue', text: plan.goal }),
          UI.el('span', { class: 'badge gray', text: plan.equipment }),
          UI.el('span', { class: 'badge green', text: '每周 ' + plan.daysPerWeek + ' 天' })
        ),
        UI.el('div', { class: 'card', style: 'margin-top:10px; padding:12px' }, plan.exercises.map((ex) => UI.el('div', { class: 'list-item' }, UI.el('span', { text: ex.name }), UI.el('span', { class: 'muted', text: ex.sets + ' 组 · ' + ex.reps + ' 次 · ' + ex.weight })))),
        UI.el('div', { class: 'toolbar', style: 'margin-top:10px' }, UI.el('button', { class: 'btn btn-primary', text: '采用此计划', onclick: function () { adopt(plan); } }))
      ));
    });

    const exSearch = UI.el('input', { type: 'search', placeholder: '搜索动作', value: exKeyword });
    exSearch.addEventListener('input', function () { exKeyword = exSearch.value; window.App.render(); });
    const exMuscleSel = UI.el('select', { value: exMuscle },
      ['全部', '胸', '背', '腿', '肩', '手臂', '核心', '臀', '全身'].map((m) => UI.el('option', { value: m, text: m, selected: exMuscle === m ? 'selected' : null })));
    exMuscleSel.addEventListener('change', function () { exMuscle = exMuscleSel.value; window.App.render(); });
    const exercises = AppFitnessRecommended.searchExercises(exKeyword, exMuscle === '全部' ? '' : exMuscle);
    const exList = UI.el('div', { class: 'card' }, exercises.map((e) => UI.el('span', { class: 'badge blue', style: 'margin:4px', text: e.name + ' · ' + e.muscle })));

    return UI.el('div', {}, filters, planCards, UI.el('h3', { style: 'margin:20px 0 10px', text: '动作库' }), UI.el('div', { class: 'toolbar' }, exSearch, exMuscleSel), exList);
  }
  window.Views.fitness = function (container) {
    const state = AppStore.get();
    let body;
    if (fitnessTab === 'plans') body = plansTab(state);
    else if (fitnessTab === 'recommended') body = recommendedTab(state);
    else if (fitnessTab === 'logs') body = logsTab(state);
    else body = bodyTab(state);
    UI.renderInto(container, UI.el('section', { class: 'view' }, tabBar(fitnessTab), body));
  };
})();

