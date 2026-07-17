// Minimal DOM stub: enough for main.js to execute top-to-bottom. We're not
// testing behaviour here — only that nothing throws during init (TDZ, bad
// property access, etc.), which `node --check` cannot see.
import { readFileSync } from 'node:fs';

const el = () => new Proxy(function(){}, {
  get(_, k) {
    if (k === 'classList') return { add(){}, remove(){}, toggle(){}, contains(){ return false; } };
    if (k === 'style') return new Proxy({}, { get: () => () => {}, set: () => true });
    if (k === 'dataset') return {};
    if (k === 'children') return [];
    if (k === 'childNodes') return [];
    if (k === 'textContent' || k === 'innerHTML' || k === 'value' || k === 'className') return '';
    if (k === 'offsetTop' || k === 'offsetHeight' || k === 'scrollHeight' || k === 'clientHeight') return 0;
    if (k === 'getBoundingClientRect') return () => ({top:0,left:0,right:0,bottom:0,width:0,height:0,x:0,y:0});
    if (k === 'closest' || k === 'querySelector') return () => el();
    if (k === 'querySelectorAll') return () => [];
    if (k === 'matches' || k === 'contains') return () => false;
    if (k === 'getAttribute') return () => null;
    if (k === 'setAttribute' || k === 'removeAttribute') return () => {};
    if (k === 'addEventListener' || k === 'removeEventListener' || k === 'focus' || k === 'click') return () => {};
    if (k === 'appendChild' || k === 'remove') return () => {};
    if (k === 'content') return '';
    return el();
  },
  set: () => true,
  apply: () => el(),
});

const listeners = {};
global.window = {
  matchMedia: () => ({ matches: false, addEventListener(){} }),
  addEventListener: (t, f) => (listeners[t] = f),
  scrollY: 0, innerWidth: 1280, innerHeight: 900,
  getSelection: () => ({ removeAllRanges(){}, addRange(){} }),
  ScrollTrigger: undefined, gsap: undefined,
};
global.document = new Proxy({}, {
  get(_, k) {
    if (k === 'querySelector') return () => el();
    if (k === 'querySelectorAll') return () => [];
    if (k === 'addEventListener') return (t, f) => (listeners['doc:' + t] = f);
    if (k === 'documentElement') return el();
    if (k === 'body') return el();
    if (k === 'head') return el();
    if (k === 'createElement') return () => el();
    if (k === 'createRange') return () => el();
    if (k === 'hidden') return false;
    return el();
  }
});
global.IntersectionObserver = class { constructor(){} observe(){} unobserve(){} };
global.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.performance = { now: () => 0 };
Object.defineProperty(global, "navigator", { value: { clipboard: { writeText: async () => {} } }, configurable: true });
global.setTimeout = (f) => 0;
global.clearTimeout = () => {};
Object.assign(global, { innerWidth: 1280, innerHeight: 900, scrollY: 0 });

const src = readFileSync('assets/js/main.js', 'utf8');
try {
  new Function(src)();
  console.log('  ✓ main.js initialised with no runtime error');
} catch (e) {
  console.error('  ✗ THREW during init:', e.constructor.name + ':', e.message);
  process.exitCode = 1;
}

// now fire the scroll handler — this is the path that would have hit the TDZ
try {
  listeners['scroll']?.();
  console.log('  ✓ scroll handler ran clean (this is where the TDZ would fire)');
} catch (e) {
  console.error('  ✗ scroll handler THREW:', e.constructor.name + ':', e.message);
  process.exitCode = 1;
}
