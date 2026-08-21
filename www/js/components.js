(function (global) {
  'use strict';

  function el(tag, attrs) {
    const node = document.createElement(tag);
    const children = Array.prototype.slice.call(arguments, 2);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        const v = attrs[k];
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v !== null && v !== undefined) node.setAttribute(k, v);
      });
    }
    (function append(arr) {
      arr.forEach((c) => {
        if (c === null || c === undefined) return;
        if (Array.isArray(c)) { append(c); return; }
        if (typeof c === 'string' || typeof c === 'number') node.appendChild(document.createTextNode(String(c)));
        else node.appendChild(c);
      });
    })(children);
    return node;
  }

  function emptyState(title, desc, mascot) {
    return el('div', { class: 'empty' },
      el('span', { class: 'mascot', text: mascot || '☁️' }),
      el('div', { class: 'empty-title', text: title || '这里还空空的' }),
      desc ? el('div', { class: 'muted', text: desc }) : null
    );
  }

  function toast(message, type) {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const icon = type === 'success' ? '✅' : type === 'error' ? '😢' : '💡';
    const item = el('div', { class: 'toast ' + (type || 'info') },
      el('span', { text: icon }),
      el('span', { text: message })
    );
    root.appendChild(item);
    setTimeout(() => item.remove(), 2200);
  }

  function modal(options) {
    const root = document.getElementById('modal-root');
    if (!root) return Promise.resolve(null);
    return new Promise((resolve) => {
      const overlay = el('div', { class: 'modal-overlay' });
      const box = el('div', { class: 'modal' });
      if (options.title) box.appendChild(el('h3', { text: options.title }));
      if (options.body) box.appendChild(options.body);
      const actions = el('div', { class: 'modal-actions' });
      (options.actions || []).forEach((a) => {
        const btn = el('button', { class: 'btn ' + (a.class || ''), text: a.text, type: 'button' });
        btn.addEventListener('click', () => { root.removeChild(overlay); resolve(a.value); });
        actions.appendChild(btn);
      });
      if (!options.actions || !options.actions.length) {
        const ok = el('button', { class: 'btn btn-primary', text: '知道了', type: 'button' });
        ok.addEventListener('click', () => { root.removeChild(overlay); resolve(true); });
        actions.appendChild(ok);
      }
      box.appendChild(actions);
      overlay.appendChild(box);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && options.dismissable !== false) { root.removeChild(overlay); resolve(null); }
      });
      root.appendChild(overlay);
    });
  }

  function confirm(message, options) {
    options = options || {};
    return modal({
      title: options.title || '请确认',
      body: el('p', { text: message }),
      actions: [
        { text: options.cancelText || '取消', value: false },
        { text: options.okText || '确定', value: true, class: options.danger ? 'btn-danger' : 'btn-primary' }
      ]
    });
  }

  function renderInto(container, node) {
    container.replaceChildren(node);
    return node;
  }

  global.UI = { el: el, emptyState: emptyState, toast: toast, modal: modal, confirm: confirm, renderInto: renderInto };
})(window);

