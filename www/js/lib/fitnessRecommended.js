(function (global) {
  'use strict';

  const PLANS = [
    {
      id: 'rec-fullbody',
      name: '全身入门训练',
      goal: '塑形',
      daysPerWeek: 3,
      equipment: '无器械',
      description: '适合刚开始健身，每周 3 次，覆盖全身主要肌群。',
      exercises: [
        { name: '徒手深蹲', muscle: '腿', sets: '3', reps: '15', weight: '自重' },
        { name: '俯卧撑', muscle: '胸', sets: '3', reps: '10', weight: '自重' },
        { name: '平板支撑', muscle: '核心', sets: '3', reps: '30秒', weight: '自重' },
        { name: '臀桥', muscle: '臀', sets: '3', reps: '15', weight: '自重' },
        { name: '登山跑', muscle: '核心', sets: '3', reps: '20', weight: '自重' }
      ]
    },
    {
      id: 'rec-upperlower',
      name: '上下肢分化',
      goal: '增肌',
      daysPerWeek: 4,
      equipment: '器械',
      description: '上肢、下肢分开训练，适合有器械、每周 4 练。',
      exercises: [
        { name: '杠铃卧推', muscle: '胸', sets: '4', reps: '8', weight: '60% 1RM' },
        { name: '坐姿划船', muscle: '背', sets: '4', reps: '10', weight: '中' },
        { name: '深蹲', muscle: '腿', sets: '4', reps: '8', weight: '70% 1RM' },
        { name: '硬拉', muscle: '背', sets: '3', reps: '6', weight: '75% 1RM' }
      ]
    },
    {
      id: 'rec-pushpull',
      name: '推拉腿分化',
      goal: '增肌',
      daysPerWeek: 6,
      equipment: '器械',
      description: '推、拉、腿三天循环，适合有训练基础、时间充足。',
      exercises: [
        { name: '杠铃卧推', muscle: '胸', sets: '4', reps: '8', weight: '中' },
        { name: '引体向上', muscle: '背', sets: '4', reps: '8', weight: '自重' },
        { name: '深蹲', muscle: '腿', sets: '5', reps: '5', weight: '大' },
        { name: '站姿推举', muscle: '肩', sets: '4', reps: '10', weight: '中' }
      ]
    },
    {
      id: 'rec-5x5',
      name: '5×5 增力计划',
      goal: '增力',
      daysPerWeek: 3,
      equipment: '器械',
      description: '围绕深蹲、卧推、硬拉等复合动作做 5 组 5 次。',
      exercises: [
        { name: '深蹲', muscle: '腿', sets: '5', reps: '5', weight: '80% 1RM' },
        { name: '卧推', muscle: '胸', sets: '5', reps: '5', weight: '80% 1RM' },
        { name: '硬拉', muscle: '背', sets: '1', reps: '5', weight: '80% 1RM' },
        { name: '杠铃划船', muscle: '背', sets: '5', reps: '5', weight: '中' }
      ]
    },
    {
      id: 'rec-home',
      name: '家庭无器械塑形',
      goal: '减脂',
      daysPerWeek: 4,
      equipment: '无器械',
      description: '在家完成，轻重量多次数，配合有氧减脂。',
      exercises: [
        { name: '开合跳', muscle: '全身', sets: '4', reps: '30秒', weight: '自重' },
        { name: '深蹲跳', muscle: '腿', sets: '4', reps: '12', weight: '自重' },
        { name: '波比跳', muscle: '全身', sets: '4', reps: '10', weight: '自重' },
        { name: '卷腹', muscle: '核心', sets: '4', reps: '20', weight: '自重' }
      ]
    }
  ];

  const EXERCISES = [
    { name: '杠铃卧推', muscle: '胸' }, { name: '俯卧撑', muscle: '胸' }, { name: '哑铃飞鸟', muscle: '胸' },
    { name: '引体向上', muscle: '背' }, { name: '坐姿划船', muscle: '背' }, { name: '硬拉', muscle: '背' }, { name: '杠铃划船', muscle: '背' },
    { name: '深蹲', muscle: '腿' }, { name: '深蹲跳', muscle: '腿' }, { name: '箭步蹲', muscle: '腿' },
    { name: '站姿推举', muscle: '肩' }, { name: '侧平举', muscle: '肩' },
    { name: '弯举', muscle: '手臂' }, { name: '臂屈伸', muscle: '手臂' },
    { name: '平板支撑', muscle: '核心' }, { name: '卷腹', muscle: '核心' }, { name: '臀桥', muscle: '臀' },
    { name: '开合跳', muscle: '全身' }, { name: '波比跳', muscle: '全身' }, { name: '登山跑', muscle: '核心' }
  ];

  function getPlans() { return PLANS; }
  function getExercises() { return EXERCISES; }

  function searchExercises(keyword, muscle) {
    const k = String(keyword || '').toLowerCase().trim();
    return EXERCISES.filter((e) => {
      const okMuscle = !muscle || e.muscle === muscle;
      const okKw = !k || e.name.toLowerCase().indexOf(k) >= 0 || e.muscle.indexOf(k) >= 0;
      return okMuscle && okKw;
    });
  }

  function recommend(options) {
    options = options || {};
    let list = PLANS.slice();
    if (options.goal) list = list.filter((p) => p.goal === options.goal);
    if (options.equipment) list = list.filter((p) => p.equipment === options.equipment);
    if (options.daysPerWeek) list = list.filter((p) => p.daysPerWeek <= Number(options.daysPerWeek));
    return list;
  }

  function getPlan(id) { return PLANS.find((p) => p.id === id) || null; }

  const api = { getPlans: getPlans, getExercises: getExercises, searchExercises: searchExercises, recommend: recommend, getPlan: getPlan };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.AppFitnessRecommended = api;
})(typeof window !== 'undefined' ? window : globalThis);
