(function (global) {
  'use strict';

  const MEALS = ['早餐', '午餐', '晚餐', '加餐'];

  function newId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }

  function ensureDiet(state) {
    if (!state.diet) state.diet = {};
    if (!Array.isArray(state.diet.records)) state.diet.records = [];
    if (!Array.isArray(state.diet.recipes)) state.diet.recipes = [];
    if (!state.diet.goal) state.diet.goal = { calories: null, protein: null, water: null };
    if (!Array.isArray(state.diet.water)) state.diet.water = [];
    if (!Array.isArray(state.diet.customFoods)) state.diet.customFoods = [];
    if (!Array.isArray(state.diet.mealPlans)) state.diet.mealPlans = [];
    return state.diet;
  }

  function addRecord(state, fields) {
    const d = ensureDiet(state);
    const date = (fields && fields.date) || '';
    const food = String((fields && fields.food) || '').trim();
    if (!date || !food) throw new Error('日期和食物不能为空');
    const rec = {
      id: newId('diet'),
      date: date,
      meal: (fields && fields.meal) || '早餐',
      food: food,
      calories: Number(fields && fields.calories) || 0,
      protein: Number(fields && fields.protein) || 0
    };
    d.records.push(rec);
    return rec;
  }

  function updateRecord(state, id, patch) {
    const rec = ensureDiet(state).records.find((x) => x.id === id);
    if (!rec) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') rec[k] = patch[k]; });
    return rec;
  }

  function deleteRecord(state, id) {
    const d = ensureDiet(state);
    const item = d.records.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'dietRecords', item);
    d.records = d.records.filter((x) => x.id !== id);
  }

  function recordsByDate(state, date) {
    return ensureDiet(state).records.filter((x) => x.date === date);
  }

  function recentFoods(state, limit) {
    const recs = ensureDiet(state).records.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const seen = [];
    const out = [];
    recs.forEach((r) => {
      if (seen.indexOf(r.food) < 0) { seen.push(r.food); out.push(r.food); }
    });
    return out.slice(0, limit || 8);
  }

  function totalsByDate(state, date) {
    const records = recordsByDate(state, date);
    return {
      meals: records.length,
      calories: records.reduce((s, r) => s + (Number(r.calories) || 0), 0),
      protein: records.reduce((s, r) => s + (Number(r.protein) || 0), 0)
    };
  }

  function progress(goal, totals) {
    return {
      caloriePercent: goal && goal.calories ? Math.min(100, Math.round((totals.calories / goal.calories) * 100)) : 0,
      proteinPercent: goal && goal.protein ? Math.min(100, Math.round((totals.protein / goal.protein) * 100)) : 0
    };
  }

  function addCustomFood(state, fields) {
    const d = ensureDiet(state);
    const name = String((fields && fields.name) || '').trim();
    if (!name) throw new Error('自定义食物名称不能为空');
    const item = {
      id: newId('cfood'),
      name: name,
      kcal100: Number(fields && fields.kcal100) || 0,
      protein100: Number(fields && fields.protein100) || 0
    };
    d.customFoods.unshift(item);
    return item;
  }

  function deleteCustomFood(state, id) {
    const d = ensureDiet(state);
    const item = d.customFoods.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'dietCustomFoods', item);
    d.customFoods = d.customFoods.filter((x) => x.id !== id);
  }

  function listCustomFoods(state) {
    return ensureDiet(state).customFoods;
  }

  function addRecipe(state, fields) {
    const d = ensureDiet(state);
    const name = String((fields && fields.name) || '').trim();
    if (!name) throw new Error('食谱名称不能为空');
    const recipe = {
      id: newId('recipe'),
      name: name,
      calories: Number(fields && fields.calories) || 0,
      protein: Number(fields && fields.protein) || 0
    };
    d.recipes.push(recipe);
    return recipe;
  }

  function updateRecipe(state, id, patch) {
    const r = ensureDiet(state).recipes.find((x) => x.id === id);
    if (!r) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id') r[k] = patch[k]; });
    return r;
  }

  function deleteRecipe(state, id) {
    const d = ensureDiet(state);
    const item = d.recipes.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'dietRecipes', item);
    d.recipes = d.recipes.filter((x) => x.id !== id);
  }

  function setGoal(state, goal) {
    const d = ensureDiet(state);
    d.goal = {
      calories: goal && goal.calories !== undefined && goal.calories !== '' ? Number(goal.calories) : d.goal.calories,
      protein: goal && goal.protein !== undefined && goal.protein !== '' ? Number(goal.protein) : d.goal.protein,
      water: goal && goal.water !== undefined && goal.water !== '' ? Number(goal.water) : d.goal.water
    };
    return d.goal;
  }

  function addWater(state, date) {
    const d = ensureDiet(state);
    let item = d.water.find((w) => w.date === date);
    if (!item) {
      item = { id: newId('water'), date: date, cups: 0 };
      d.water.push(item);
    }
    item.cups += 1;
    return item;
  }

  function deleteWater(state, date) {
    const d = ensureDiet(state);
    const item = d.water.find((w) => w.date === date);
    if (item) item.cups = Math.max(0, item.cups - 1);
  }

  function cupsByDate(state, date) {
    const item = ensureDiet(state).water.find((w) => w.date === date);
    return item ? item.cups : 0;
  }


  function padDate(n) { return String(n).padStart(2, '0'); }
  function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + padDate(d.getMonth() + 1) + '-' + padDate(d.getDate());
  }

  function addMealPlan(state, fields) {
    const d = ensureDiet(state);
    const date = (fields && fields.date) || '';
    const food = String((fields && fields.food) || '').trim();
    if (!date || !food) throw new Error('日期和食物不能为空');
    const item = {
      id: newId('mealplan'),
      date: date,
      meal: (fields && fields.meal) || '早餐',
      food: food,
      calories: Number(fields && fields.calories) || 0,
      protein: Number(fields && fields.protein) || 0
    };
    d.mealPlans.push(item);
    return item;
  }

  function deleteMealPlan(state, id) {
    const d = ensureDiet(state);
    const item = d.mealPlans.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'dietMealPlans', item);
    d.mealPlans = d.mealPlans.filter((x) => x.id !== id);
  }

  function mealPlansByDate(state, date) {
    return ensureDiet(state).mealPlans.filter((x) => x.date === date);
  }

  function mealPlansByRange(state, dates) {
    const map = {};
    dates.forEach((date) => { map[date] = mealPlansByDate(state, date); });
    return map;
  }

  function dailyTotalsSeries(state, days) {
    return days.map((date) => {
      const t = totalsByDate(state, date);
      return { date: date, calories: t.calories, protein: t.protein };
    });
  }

  function monthDates(year, month) {
    const days = new Date(year, month, 0).getDate();
    const list = [];
    for (let i = 1; i <= days; i += 1) {
      list.push(year + '-' + padDate(month) + '-' + padDate(i));
    }
    return list;
  }

  function heatmap(state, year, month) {
    const goal = (state.diet && state.diet.goal && state.diet.goal.calories) || null;
    return monthDates(year, month).map((date) => {
      const t = totalsByDate(state, date);
      const ratio = goal ? Math.min(1, t.calories / goal) : 0;
      return { date: date, calories: t.calories, ratio: ratio };
    });
  }

  function rangeSummary(state, days) {
    const goal = (state.diet && state.diet.goal && state.diet.goal.calories) || null;
    let totalCalories = 0;
    let hitDays = 0;
    let overDays = 0;
    days.forEach((date) => {
      const t = totalsByDate(state, date);
      totalCalories += t.calories;
      if (goal) {
        if (t.calories >= goal * 0.9 && t.calories <= goal * 1.1) hitDays += 1;
        else if (t.calories > goal * 1.1) overDays += 1;
      }
    });
    return { avgCalories: days.length ? Math.round(totalCalories / days.length) : 0, hitDays: hitDays, overDays: overDays };
  }

  function weekDates(start) {
    const list = [];
    for (let i = 0; i < 7; i += 1) list.push(addDays(start, i));
    return list;
  }
  const api = {
    MEALS: MEALS,
    newId: newId,
    addRecord: addRecord,
    updateRecord: updateRecord,
    deleteRecord: deleteRecord,
    recordsByDate: recordsByDate,
    totalsByDate: totalsByDate,
    recentFoods: recentFoods,
    progress: progress,
    addCustomFood: addCustomFood,
    deleteCustomFood: deleteCustomFood,
    listCustomFoods: listCustomFoods,
    addRecipe: addRecipe,
    updateRecipe: updateRecipe,
    deleteRecipe: deleteRecipe,
    setGoal: setGoal,
    addWater: addWater,
    deleteWater: deleteWater,
    cupsByDate: cupsByDate,
    addDays: addDays,
    addMealPlan: addMealPlan,
    deleteMealPlan: deleteMealPlan,
    mealPlansByDate: mealPlansByDate,
    mealPlansByRange: mealPlansByRange,
    dailyTotalsSeries: dailyTotalsSeries,
    monthDates: monthDates,
    heatmap: heatmap,
    rangeSummary: rangeSummary,
    weekDates: weekDates
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.AppDiet = api;
})(typeof window !== 'undefined' ? window : globalThis);





