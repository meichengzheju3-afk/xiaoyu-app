(function (global) {
  'use strict';

  const FOODS = [
    { name: '米饭', kcal100: 116, protein100: 2.6 },
    { name: '馒头', kcal100: 223, protein100: 7 },
    { name: '面条', kcal100: 110, protein100: 3.4 },
    { name: '全麦面包', kcal100: 246, protein100: 8.5 },
    { name: '燕麦', kcal100: 379, protein100: 13.2 },
    { name: '红薯', kcal100: 86, protein100: 1.6 },
    { name: '玉米', kcal100: 112, protein100: 4 },
    { name: '鸡蛋', kcal100: 144, protein100: 13.3 },
    { name: '鸡胸肉', kcal100: 165, protein100: 31 },
    { name: '鸡腿', kcal100: 181, protein100: 16 },
    { name: '牛肉', kcal100: 250, protein100: 26 },
    { name: '猪肉', kcal100: 395, protein100: 13 },
    { name: '鱼肉', kcal100: 105, protein100: 17 },
    { name: '虾', kcal100: 99, protein100: 21 },
    { name: '西兰花', kcal100: 34, protein100: 2.8 },
    { name: '菠菜', kcal100: 24, protein100: 2.9 },
    { name: '西红柿', kcal100: 18, protein100: 0.9 },
    { name: '黄瓜', kcal100: 15, protein100: 0.7 },
    { name: '生菜', kcal100: 15, protein100: 1.4 },
    { name: '胡萝卜', kcal100: 39, protein100: 1 },
    { name: '苹果', kcal100: 52, protein100: 0.3 },
    { name: '香蕉', kcal100: 93, protein100: 1.4 },
    { name: '橙子', kcal100: 47, protein100: 0.9 },
    { name: '草莓', kcal100: 32, protein100: 0.7 },
    { name: '蓝莓', kcal100: 57, protein100: 0.7 },
    { name: '牛奶', kcal100: 54, protein100: 3 },
    { name: '酸奶', kcal100: 72, protein100: 2.5 },
    { name: '豆浆', kcal100: 31, protein100: 3 },
    { name: '拿铁', kcal100: 43, protein100: 2.3 },
    { name: '坚果', kcal100: 607, protein100: 20 },
    { name: '巧克力', kcal100: 546, protein100: 7 },
    { name: '薯片', kcal100: 536, protein100: 7 },
    { name: '番茄炒蛋', kcal100: 85, protein100: 5 },
    { name: '宫保鸡丁', kcal100: 150, protein100: 12 },
    { name: '红烧肉', kcal100: 300, protein100: 10 },
    { name: '清蒸鱼', kcal100: 90, protein100: 17 },
    { name: '麻婆豆腐', kcal100: 120, protein100: 8 },
    { name: '青椒肉丝', kcal100: 110, protein100: 9 }
  ];

  function searchFoods(keyword) {
    const k = String(keyword || '').toLowerCase().trim();
    if (!k) return [];
    return FOODS.filter((f) => f.name.toLowerCase().indexOf(k) >= 0).slice(0, 10);
  }

  function findFood(name) {
    const n = String(name || '').trim();
    if (!n) return null;
    return FOODS.find((f) => f.name === n) || null;
  }

  function calcNutrition(food, grams) {
    const g = Number(grams);
    const base = g > 0 ? g : 100;
    return {
      calories: Math.round((food.kcal100 * base) / 100),
      protein: Math.round((food.protein100 * base) / 100 * 10) / 10
    };
  }

  const api = { FOODS: FOODS, searchFoods: searchFoods, findFood: findFood, calcNutrition: calcNutrition };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.AppFoodDb = api;
})(typeof window !== 'undefined' ? window : globalThis);
