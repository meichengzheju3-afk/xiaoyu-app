(function (global) {
  'use strict';

  const routes = [
    { hash: '#/home', name: 'home', title: '首页总览' },
    { hash: '#/plan', name: 'plan', title: '今日计划' },
    { hash: '#/media', name: 'media', title: '自媒体' },
    { hash: '#/dev', name: 'dev', title: '开发工作' },
    { hash: '#/consulting', name: 'consulting', title: '咨询工作' },
    { hash: '#/fitness', name: 'fitness', title: '健身计划' },
    { hash: '#/diet', name: 'diet', title: '饮食计划' },
    { hash: '#/novels', name: 'novels', title: '小说阅读' },
    { hash: '#/data-device', name: 'dataDevice', title: '数据与设备' }
  ];

  function resolveRoute(hash) {
    const clean = (hash || '#/home').split('?')[0];
    const route = routes.find((r) => r.hash === clean);
    return route || routes[0];
  }

  const api = { routes: routes, resolveRoute: resolveRoute };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.AppRouter = api;
})(typeof window !== 'undefined' ? window : globalThis);

