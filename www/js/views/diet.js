(function () {
  'use strict';
  window.Views = window.Views || {};

  let dietTab = 'today';
  let dietDate = null;

  function tabBar(current) {
    const defs = [['today', '今日饮食'], ['week', '周计划'], ['month', '月计划'], ['recipes', '食谱库'], ['goal', '目标']];
    return UI.el('div', { class: 'tabs' }, defs.map((d) => UI.el('button', {
      class: 'tab' + (current === d[0] ? ' active' : ''),
      text: d[1],
      onclick: function () { dietTab = d[0]; window.App.render(); }
    })));
  }

  function hideFoodDropdown() {
    const old = document.querySelector('.food-dropdown');
    if (old) old.remove();
  }

  function showFoodDropdown(input, items, onPick) {
    hideFoodDropdown();
    const wrap = UI.el('div', { class: 'food-dropdown' });
    wrap.style.cssText = 'position:absolute; top:100%; left:0; width:260px; max-height:260px; overflow:auto; background:var(--panel); border:1px solid var(--border); border-radius:10px; box-shadow:var(--shadow); z-index:70;';
    input.parentNode.style.position = 'relative';
    if (!items.length) wrap.appendChild(UI.el('div', { class: 'muted', style: 'padding:10px', text: '没有匹配食物' }));
    items.forEach((f) => {
      const it = UI.el('div', { class: 'list-item', style: 'cursor:pointer', onclick: function () { hideFoodDropdown(); onPick(f); } },
        UI.el('span', { text: f.name }),
        UI.el('span', { class: 'muted', text: f.kcal100 + ' kcal/100g' })
      );
      wrap.appendChild(it);
    });
    input.parentNode.appendChild(wrap);
  }

  function mealSection(state, meal) {
    const records = AppDiet.recordsByDate(state, dietDate).filter((r) => r.meal === meal);
    let selectedFood = null;

    const foodInput = UI.el('input', { type: 'text', placeholder: '吃了什么' });
    const gramsInput = UI.el('input', { type: 'number', step: '1', value: '', placeholder: '100', style: 'width:80px' });
    const calBox = UI.el('input', { type: 'number', value: '0', style: 'width:90px', title: '热量 kcal' });
    const proBox = UI.el('input', { type: 'number', step: '0.1', value: '0', style: 'width:90px', title: '蛋白质 g' });

    function updateCalc() {
      if (selectedFood) {
        const r = AppFoodDb.calcNutrition(selectedFood, gramsInput.value || 100);
        calBox.value = r.calories;
        proBox.value = r.protein;
      }
    }

    function pick(f) { selectedFood = f; foodInput.value = f.name; updateCalc(); }
    foodInput.addEventListener('input', function () {
      selectedFood = null;
      const kw = foodInput.value.trim();
      if (!kw) {
        const recent = AppDiet.recentFoods(state, 8).map((name) => AppFoodDb.findFood(name) || { name: name, kcal100: 0, protein100: 0 });
        if (recent.length) showFoodDropdown(foodInput, recent, pick);
        else hideFoodDropdown();
        calBox.value = '0'; proBox.value = '0';
        return;
      }
      const custom = AppDiet.listCustomFoods(state).filter((f) => f.name.toLowerCase().indexOf(kw.toLowerCase()) >= 0).map((f) => ({ name: f.name, kcal100: f.kcal100, protein100: f.protein100 }));
      const items = AppFoodDb.searchFoods(kw).concat(custom).slice(0, 8);
      showFoodDropdown(foodInput, items, pick);
    });
    foodInput.addEventListener('change', function () {
      const found = AppFoodDb.findFood(foodInput.value) || AppDiet.listCustomFoods(state).find((f) => f.name === foodInput.value);
      if (found) pick(found);
    });
    gramsInput.addEventListener('input', updateCalc);

    const saveCustomBtn = UI.el('button', { class: 'btn btn-secondary', text: '存为自定义食物', onclick: function () { openCustomFoodModal(); } });
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加' });
    addBtn.addEventListener('click', function () {
      const food = foodInput.value;
      if (!food.trim()) { UI.toast('请输入食物'); return; }
      AppStore.mutate(function (st) {
        AppDiet.addRecord(st, { date: dietDate, meal: meal, food: food, calories: calBox.value, protein: proBox.value });
      });
      window.App.render();
    });

    const list = UI.el('div');
    records.forEach(function (r) {
      list.appendChild(UI.el('div', { class: 'list-item' },
        UI.el('span', { text: r.food }),
        UI.el('span', { class: 'muted', text: r.calories + ' kcal · ' + r.protein + ' g' }),
        UI.el('span', { class: 'spacer' }),
        UI.el('button', { class: 'btn', text: '删除', onclick: function () {
          UI.confirm('删除食物「' + r.food + '」？', { danger: true }).then(function (ok) {
            if (!ok) return;
            AppStore.mutate(function (st) { AppDiet.deleteRecord(st, r.id); });
            window.App.render();
          });
        } })
      ));
    });

    return UI.el('div', { class: 'card' },
      UI.el('h4', { text: meal }),
      UI.el('div', { class: 'toolbar' }, foodInput, UI.el('label', { text: '份量(克)' }), gramsInput, UI.el('span', { class: 'muted', text: '热量' }), calBox, UI.el('span', { class: 'muted', text: '蛋白质' }), proBox, addBtn, saveCustomBtn),
      list
    );
  }

  function openCustomFoodModal() {
    const name = UI.el('input', { type: 'text', placeholder: '食物名称' });
    const kcal = UI.el('input', { type: 'number', placeholder: '每100g热量 kcal' });
    const protein = UI.el('input', { type: 'number', step: '0.1', placeholder: '每100g蛋白质 g' });
    UI.modal({
      title: '保存为自定义食物',
      body: UI.el('div', { class: 'grid', style: 'gap:10px' }, name, kcal, protein),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!name.value.trim()) { UI.toast('请输入食物名称'); return; }
      AppStore.mutate(function (st) { AppDiet.addCustomFood(st, { name: name.value, kcal100: kcal.value, protein100: protein.value }); });
      UI.toast('已保存自定义食物');
      window.App.render();
    });
  }

  function todayTab(state) {
    if (!dietDate) dietDate = AppSummary.todayStr();
    const totals = AppDiet.totalsByDate(state, dietDate);
    const goal = (state.diet && state.diet.goal) || {};
    const p = AppDiet.progress(goal, totals);
    const cups = AppDiet.cupsByDate(state, dietDate);

    const dateInput = UI.el('input', { type: 'date', value: dietDate });
    dateInput.addEventListener('change', function () { dietDate = dateInput.value; window.App.render(); });

    const waterAdd = UI.el('button', { class: 'btn', text: '+ 一杯水', onclick: function () { AppStore.mutate(function (st) { AppDiet.addWater(st, dietDate); }); window.App.render(); } });
    const waterDel = UI.el('button', { class: 'btn', text: '- 一杯水', onclick: function () { AppStore.mutate(function (st) { AppDiet.deleteWater(st, dietDate); }); window.App.render(); } });

    const summary = UI.el('div', { class: 'grid cols-2' },
      UI.el('div', { class: 'card' }, UI.el('h4', { text: '热量' }), UI.el('div', { class: 'muted', text: totals.calories + ' / ' + (goal.calories || '-') + ' kcal' }), UI.el('div', { class: 'progress' }, UI.el('span', { style: 'width:' + p.caloriePercent + '%' }))),
      UI.el('div', { class: 'card' }, UI.el('h4', { text: '蛋白质' }), UI.el('div', { class: 'muted', text: totals.protein + ' / ' + (goal.protein || '-') + ' g' }), UI.el('div', { class: 'progress' }, UI.el('span', { style: 'width:' + p.proteinPercent + '%' })))
    );

    const waterCard = UI.el('div', { class: 'card' }, UI.el('h4', { text: '饮水' }), UI.el('div', { class: 'muted', text: cups + ' / ' + (goal.water || '-') + ' 杯' }), UI.el('div', { class: 'toolbar' }, waterAdd, waterDel));

    const meals = AppDiet.MEALS.map((m) => mealSection(state, m));
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, dateInput), summary, waterCard, UI.el('div', { class: 'grid cols-2', style: 'margin-top:16px' }, meals));
  }

  function recipesTab(state) {
    const recipes = (state.diet && state.diet.recipes) || [];
    const addBtn = UI.el('button', { class: 'btn btn-primary', text: '添加食谱', onclick: function () { openRecipeModal(); } });
    const list = UI.el('div', { class: 'grid cols-2' });
    if (!recipes.length) list.appendChild(UI.emptyState('还没有常用食谱'));
    recipes.forEach(function (r) {
      list.appendChild(UI.el('div', { class: 'card' },
        UI.el('h4', { text: r.name }),
        UI.el('div', { class: 'muted', text: r.calories + ' kcal · ' + r.protein + ' g' }),
        UI.el('div', { class: 'toolbar', style: 'margin-top:8px' },
          UI.el('button', { class: 'btn', text: '编辑', onclick: function () { openRecipeModal(r); } }),
          UI.el('button', { class: 'btn', text: '删除', onclick: function () { UI.confirm('删除食谱「' + r.name + '」？', { danger: true }).then(function (ok) { if (!ok) return; AppStore.mutate(function (st) { AppDiet.deleteRecipe(st, r.id); }); window.App.render(); }); } })
        )
      ));
    });
    return UI.el('div', {}, UI.el('div', { class: 'toolbar' }, UI.el('span', { class: 'spacer' }), addBtn), list);
  }

  function openRecipeModal(recipe) {
    const name = UI.el('input', { type: 'text', placeholder: '名称', value: recipe ? recipe.name : '' });
    const calories = UI.el('input', { type: 'number', placeholder: '热量 kcal', value: recipe ? String(recipe.calories) : '' });
    const protein = UI.el('input', { type: 'number', placeholder: '蛋白质 g', value: recipe ? String(recipe.protein) : '' });
    UI.modal({ title: recipe ? '编辑食谱' : '添加食谱', body: UI.el('div', { class: 'grid', style: 'gap:10px' }, name, calories, protein), actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }] }).then(function (ok) {
      if (!ok) return;
      if (!name.value.trim()) { UI.toast('请输入食谱名称'); return; }
      const fields = { name: name.value, calories: calories.value, protein: protein.value };
      AppStore.mutate(function (st) { if (recipe) AppDiet.updateRecipe(st, recipe.id, fields); else AppDiet.addRecipe(st, fields); });
      window.App.render();
    });
  }

  function goalTab(state) {
    const goal = (state.diet && state.diet.goal) || {};
    const calories = UI.el('input', { type: 'number', placeholder: '每日热量目标 kcal', value: goal.calories ? String(goal.calories) : '' });
    const protein = UI.el('input', { type: 'number', placeholder: '每日蛋白质目标 g', value: goal.protein ? String(goal.protein) : '' });
    const water = UI.el('input', { type: 'number', placeholder: '每日饮水目标 杯', value: goal.water ? String(goal.water) : '' });
    const saveBtn = UI.el('button', { class: 'btn btn-primary', text: '保存目标' });
    saveBtn.addEventListener('click', function () { AppStore.mutate(function (st) { AppDiet.setGoal(st, { calories: calories.value, protein: protein.value, water: water.value }); }); UI.toast('目标已保存'); window.App.render(); });
    return UI.el('div', { class: 'card', style: 'max-width:480px' }, UI.el('h3', { text: '每日目标' }), UI.el('div', { class: 'grid', style: 'gap:10px' }, calories, protein, water), UI.el('div', { class: 'toolbar', style: 'margin-top:12px' }, saveBtn));
  }


  let weekStart = null;

  function openMealPlanModal(date, meal) {
    const state = AppStore.get();
    const listId = 'food-list-' + Date.now();
    const options = AppFoodDb.FOODS.concat(AppDiet.listCustomFoods(state).map((f) => ({ name: f.name, kcal100: f.kcal100, protein100: f.protein100 })));
    const dl = UI.el('datalist', { id: listId }, options.map((f) => UI.el('option', { value: f.name })));
    const food = UI.el('input', { type: 'text', list: listId, placeholder: '吃什么' });
    const grams = UI.el('input', { type: 'number', value: '', placeholder: '100' });
    const cal = UI.el('input', { type: 'number', value: '0', placeholder: '热量' });
    const pro = UI.el('input', { type: 'number', step: '0.1', value: '0', placeholder: '蛋白质' });
    food.addEventListener('change', function () {
      const f = AppFoodDb.findFood(food.value) || AppDiet.listCustomFoods(state).find((x) => x.name === food.value);
      if (f) { const r = AppFoodDb.calcNutrition(f, grams.value || 100); cal.value = r.calories; pro.value = r.protein; }
    });
    const mealSel = UI.el('select', {}, AppDiet.MEALS.map((m) => UI.el('option', { value: m, text: m, selected: meal === m ? 'selected' : null })));
    UI.modal({
      title: meal + '计划 · ' + date,
      body: UI.el('div', {}, dl, UI.el('div', { class: 'grid', style: 'gap:10px' }, mealSel, food, grams, cal, pro)),
      actions: [{ text: '取消', value: false }, { text: '保存', value: true, class: 'btn-primary' }]
    }).then(function (ok) {
      if (!ok) return;
      if (!food.value.trim()) { UI.toast('请输入食物'); return; }
      AppStore.mutate(function (st) { AppDiet.addMealPlan(st, { date: date, meal: mealSel.value, food: food.value, calories: cal.value, protein: pro.value }); });
      window.App.render();
    });
  }

  function weekTab(state) {
    if (!weekStart) weekStart = AppSummary.todayStr();
    const days = AppDiet.weekDates(weekStart);
    const summary = AppDiet.rangeSummary(state, days);
    const prev = UI.el('button', { class: 'btn', text: '◀', onclick: function () { weekStart = AppDiet.addDays(weekStart, -7); window.App.render(); } });
    const next = UI.el('button', { class: 'btn', text: '▶', onclick: function () { weekStart = AppDiet.addDays(weekStart, 7); window.App.render(); } });
    const cols = UI.el('div', { class: 'grid cols-7', style: 'grid-template-columns: repeat(7, 1fr)' });
    days.forEach(function (date) {
      const plans = AppDiet.mealPlansByDate(state, date);
      const t = AppDiet.totalsByDate(state, date);
      const cell = UI.el('div', { class: 'card', style: 'padding:10px' },
        UI.el('div', { class: 'muted', text: date.slice(5) }),
        UI.el('div', { style: 'margin:6px 0' }, AppDiet.MEALS.map(function (meal) {
          return UI.el('div', { style: 'margin-bottom:4px' },
            UI.el('span', { class: 'muted', text: meal + ' ' }),
            plans.filter((x) => x.meal === meal).map((x) => UI.el('div', { class: 'badge gray', text: x.food + ' ' + x.calories + 'kcal', title: '点击删除' , onclick: function () { AppStore.mutate(function (st) { AppDiet.deleteMealPlan(st, x.id); }); window.App.render(); } }))
          );
        })),
        UI.el('div', { class: 'muted', text: '合计 ' + t.calories + ' kcal' }),
        UI.el('button', { class: 'btn', text: '添加计划', onclick: function () { openMealPlanModal(date, '早餐'); } })
      );
      cols.appendChild(cell);
    });
    return UI.el('div', {},
      UI.el('div', { class: 'toolbar' }, prev, next, UI.el('span', { class: 'muted', text: '平均 ' + summary.avgCalories + ' kcal · 达标 ' + summary.hitDays + ' 天 · 超标 ' + summary.overDays + ' 天' })),
      cols
    );
  }

  let calYear = null;
  let calMonth = null;

  function renderTrendChart(state) {
    const today = AppSummary.todayStr();
    const days = [];
    for (let i = 29; i >= 0; i -= 1) days.push(AppDiet.addDays(today, -i));
    const series = AppDiet.dailyTotalsSeries(state, days);
    const goal = (state.diet && state.diet.goal && state.diet.goal.calories) || null;
    const max = Math.max(goal || 0, ...series.map((x) => x.calories), 1);
    const svg = UI.el('svg', { width: '100%', height: '160', viewBox: '0 0 600 160' });
    svg.style.cssText = 'display:block';
    const lineCal = series.map((x, i) => (i * 20) + ',' + (150 - Math.round((x.calories / max) * 130))).join(' ');
    const linePro = series.map((x, i) => (i * 20) + ',' + (150 - Math.round((x.protein / 100) * 130))).join(' ');
    svg.appendChild(UI.el('polyline', { points: lineCal, fill: 'none', stroke: '#4f46e5', 'stroke-width': '2' }));
    svg.appendChild(UI.el('polyline', { points: linePro, fill: 'none', stroke: '#10b981', 'stroke-width': '2' }));
    return UI.el('div', { class: 'card' },
      UI.el('h4', { text: '最近 30 天趋势' }),
      UI.el('div', { class: 'muted', text: '紫线=热量 kcal · 绿线=蛋白质 g（蛋白按 100g 上限）' }),
      svg
    );
  }

  function monthTab(state) {
    if (!calYear) { const now = new Date(); calYear = now.getFullYear(); calMonth = now.getMonth() + 1; }
    const data = AppDiet.heatmap(state, calYear, calMonth);
    const summary = AppDiet.rangeSummary(state, AppDiet.monthDates(calYear, calMonth));
    const prev = UI.el('button', { class: 'btn', text: '◀', onclick: function () { calMonth -= 1; if (calMonth < 1) { calMonth = 12; calYear -= 1; } window.App.render(); } });
    const next = UI.el('button', { class: 'btn', text: '▶', onclick: function () { calMonth += 1; if (calMonth > 12) { calMonth = 1; calYear += 1; } window.App.render(); } });
    const label = UI.el('span', { class: 'muted', text: calYear + ' 年 ' + calMonth + ' 月' });
    const grid = UI.el('div', { class: 'grid cols-7', style: 'grid-template-columns: repeat(7, 1fr)' });
    data.forEach(function (d) {
      const bg = d.calories === 0 ? 'var(--panel-2)' : d.ratio >= 0.9 ? 'rgba(16,185,129,.35)' : d.ratio >= 0.5 ? 'rgba(79,70,229,.22)' : 'rgba(239,68,68,.2)';
      grid.appendChild(UI.el('div', { class: 'card', style: 'min-height:46px; background:' + bg, text: d.date.slice(8) + '日 ' + d.calories + 'kcal' }));
    });
    return UI.el('div', {},
      UI.el('div', { class: 'toolbar' }, prev, label, next, UI.el('span', { class: 'spacer' }), UI.el('span', { class: 'muted', text: '月平均 ' + summary.avgCalories + ' kcal · 达标 ' + summary.hitDays + ' 天 · 超标 ' + summary.overDays + ' 天' })),
      grid,
      renderTrendChart(state)
    );
  }
  window.Views.diet = function (container) {
    const state = AppStore.get();
    let body;
    if (dietTab === 'today') body = todayTab(state);
    else if (dietTab === 'week') body = weekTab(state);
    else if (dietTab === 'month') body = monthTab(state);
    else if (dietTab === 'recipes') body = recipesTab(state);
    else body = goalTab(state);
    UI.renderInto(container, UI.el('section', { class: 'view' }, tabBar(dietTab), body));
  };
})();




