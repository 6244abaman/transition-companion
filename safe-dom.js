/* safe-dom.js — never show the raw words "null", "undefined" or "NaN" (brief 27 Nov 2026, §1.1).
   Native append()/prepend()/replaceChildren()/before()/after() turn null into the text "null".
   This guard drops empty values for every script on the page, and exposes safeDisplay(). */
(function () {
  'use strict';
  const empty = v => v === null || v === undefined || v === false || (typeof v === 'number' && Number.isNaN(v)) || v === 'null' || v === 'undefined' || v === 'NaN';
  window.safeDisplay = function (value) {
    if (empty(value) || value === '') return '';
    if (typeof value === 'object') return '';
    return String(value);
  };
  const wrap = (proto, name) => {
    const orig = proto && proto[name];
    if (typeof orig !== 'function' || orig.__safe) return;
    const fn = function (...nodes) { return orig.apply(this, nodes.filter(n => !empty(n))); };
    fn.__safe = true;
    proto[name] = fn;
  };
  ['append', 'prepend', 'replaceChildren', 'before', 'after', 'replaceWith'].forEach(n => {
    wrap(window.Element && Element.prototype, n);
    wrap(window.DocumentFragment && DocumentFragment.prototype, n);
    wrap(window.Document && Document.prototype, n);
    wrap(window.CharacterData && CharacterData.prototype, n);
  });
})();
