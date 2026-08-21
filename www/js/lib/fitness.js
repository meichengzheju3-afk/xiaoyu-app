(function (global) {
  'use strict';

  function newId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }

  function ensureFitness(state) {
    if (!state.fitness) state.fitness = {};
    if (!Array.isArray(state.fitness.plans)) state.fitness.plans = [];
    if (!Array.isArray(state.fitness.logs)) state.fitness.logs = [];
    if (!Array.isArray(state.fitness.body)) state.fitness.body = [];
    return state.fitness;
  }

  function addPlan(state, fields) {
    const f = ensureFitness(state);
    const name = String((fields && fields.name) || '').trim();
    if (!name) throw new Error('训练日名称不能为空');
    const plan = {
      id: newId('fplan'),
      name: name,
      date: (fields && fields.date) || '',
      exercises: []
    };
    f.plans.push(plan);
    return plan;
  }

  function updatePlan(state, id, patch) {
    const p = ensureFitness(state).plans.find((x) => x.id === id);
    if (!p) return null;
    Object.keys(patch || {}).forEach((k) => { if (k !== 'id' && k !== 'exercises') p[k] = patch[k]; });
    return p;
  }

  function deletePlan(state, id) {
    const f = ensureFitness(state);
    const item = f.plans.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'fitnessPlans', item);
    f.plans = f.plans.filter((x) => x.id !== id);
  }

  function addExercise(state, planId, fields) {
    const f = ensureFitness(state);
    const plan = f.plans.find((x) => x.id === planId);
    if (!plan) throw new Error('训练计划不存在');
    const name = String((fields && fields.name) || '').trim();
    if (!name) throw new Error('动作名称不能为空');
    const ex = {
      name: name,
      sets: (fields && fields.sets) || '',
      reps: (fields && fields.reps) || '',
      weight: (fields && fields.weight) || ''
    };
    plan.exercises.push(ex);
    return ex;
  }

  function deleteExercise(state, planId, index) {
    const f = ensureFitness(state);
    const plan = f.plans.find((x) => x.id === planId);
    if (!plan) return;
    if (index >= 0 && index < plan.exercises.length) plan.exercises.splice(index, 1);
  }

  function addPlanWithExercises(state, fields) {
    const plan = addPlan(state, { name: (fields && fields.name) || '', date: (fields && fields.date) || '' });
    const exercises = Array.isArray(fields && fields.exercises) ? fields.exercises : [];
    exercises.forEach((ex) => addExercise(state, plan.id, ex));
    return plan;
  }

  function addLog(state, fields) {
    const f = ensureFitness(state);
    const date = (fields && fields.date) || '';
    if (!date) throw new Error('训练日期不能为空');
    const log = {
      id: newId('flog'),
      date: date,
      part: (fields && fields.part) || '',
      exercises: Array.isArray(fields && fields.exercises) ? fields.exercises : []
    };
    f.logs.push(log);
    return log;
  }

  function applyPlan(state, planId, date) {
    const f = ensureFitness(state);
    const plan = f.plans.find((x) => x.id === planId);
    if (!plan) throw new Error('训练计划不存在');
    const log = {
      id: newId('flog'),
      date: date,
      part: plan.name,
      exercises: plan.exercises.map((e) => ({ name: e.name, sets: e.sets, reps: e.reps, weight: e.weight }))
    };
    f.logs.push(log);
    return log;
  }

  function deleteLog(state, id) {
    const f = ensureFitness(state);
    const item = f.logs.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'fitnessLogs', item);
    f.logs = f.logs.filter((x) => x.id !== id);
  }

  function logsByDate(state, date) {
    return ensureFitness(state).logs.filter((x) => x.date === date);
  }

  function addBodyRecord(state, fields) {
    const f = ensureFitness(state);
    const date = (fields && fields.date) || '';
    if (!date) throw new Error('记录日期不能为空');
    const rec = {
      id: newId('body'),
      date: date,
      weight: (fields && fields.weight) || '',
      waist: (fields && fields.waist) || '',
      hip: (fields && fields.hip) || '',
      bodyFat: (fields && fields.bodyFat) || ''
    };
    f.body.push(rec);
    return rec;
  }

  function deleteBodyRecord(state, id) {
    const f = ensureFitness(state);
    const item = f.body.find((x) => x.id === id);
    if (item && global.AppTrash) global.AppTrash.archive(state, 'fitnessBody', item);
    f.body = f.body.filter((x) => x.id !== id);
  }

  function bodyRecords(state) {
    return ensureFitness(state).body.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  const api = {
    newId: newId,
    addPlan: addPlan,
    updatePlan: updatePlan,
    deletePlan: deletePlan,
    addExercise: addExercise,
    addPlanWithExercises: addPlanWithExercises,
    deleteExercise: deleteExercise,
    addLog: addLog,
    applyPlan: applyPlan,
    deleteLog: deleteLog,
    logsByDate: logsByDate,
    addBodyRecord: addBodyRecord,
    deleteBodyRecord: deleteBodyRecord,
    bodyRecords: bodyRecords
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.AppFitness = api;
})(typeof window !== 'undefined' ? window : globalThis);


