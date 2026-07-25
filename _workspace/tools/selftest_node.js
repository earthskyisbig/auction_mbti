// 부동산투자성향테스트.html 인라인 스크립트를 Node에서 구동하기 위한 최소 DOM 스텁.
// 목적: ?selftest=1 이 실행하는 순수 로직(T1~T15)을 브라우저 없이 검증.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = process.argv[2];
const html = fs.readFileSync(SRC, 'utf8');
const code = html.match(/<script>([\s\S]*)<\/script>/)[1];

function mkEl(id) {
  const el = {
    id, _html: '', _text: '', style: {}, dataset: {}, value: '', textContent: '',
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    appendChild(){}, removeChild(){}, select(){}, scrollIntoView(){}, click(){},
    querySelectorAll(){ return mkList(); }, querySelector(){ return null; },
    get innerHTML(){ return this._html; }, set innerHTML(v){ this._html = String(v); },
  };
  return el;
}
function mkList(arr) { const a = arr || []; a.forEach = Array.prototype.forEach.bind(a); return a; }

const store = {};
const elCache = {};
const localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; },
};

const document = {
  getElementById: id => (elCache[id] || (elCache[id] = mkEl(id))),
  querySelectorAll: () => mkList(),
  createElement: () => mkEl('new'),
  body: { appendChild(){}, removeChild(){} },
  // 테마 토글이 data-theme 을 붙이는 대상
  documentElement: { _attrs:{}, setAttribute(k,v){ this._attrs[k]=v; }, getAttribute(k){ return this._attrs[k]||null; } },
  execCommand(){ return true; },
};

const location = { search: '', pathname: '/index.html', href: 'http://x/index.html' };
const sandbox = {
  document, localStorage, location, console,
  history: { replaceState(){} },
  navigator: { clipboard: null },
  window: { scrollTo(){}, print(){}, matchMedia: () => ({ matches:false }) },
  URLSearchParams, URL: { createObjectURL: () => 'blob:x', revokeObjectURL(){} },
  Blob: function(){}, setTimeout, JSON, Math, Date, Object, Array, String, Number,
  parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent, escape, unescape,
  btoa: s => Buffer.from(s, 'binary').toString('base64'),
  atob: s => Buffer.from(s, 'base64').toString('binary'),
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

// 셀프테스트 결과를 회수하기 위해 마지막에 runSelfTest() 반환값을 노출
vm.runInContext(code + '\n;globalThis.__runSelfTest = runSelfTest;', sandbox, { filename: 'app.js' });

const el = document.getElementById('selftest-body');
const res = sandbox.__runSelfTest();
// innerHTML 에서 태그 제거해 콘솔로 출력
const plain = el._html
  .replace(/<[^>]+>/g, m => (m === '</div>' || m === '</p>' ? '\n' : ''))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .split('\n').filter(l => l.trim()).join('\n');
console.log(plain);
process.exit(res.fail === 0 ? 0 : 1);
