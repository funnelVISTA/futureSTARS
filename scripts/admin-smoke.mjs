// Drives assets/js/admin.js through a stubbed DOM + Supabase client, then
// clicks the Analytics tab and inspects what it rendered.
//
// The point is the template in renderAnalytics: it walks a nested payload from
// analytics_summary(), and a missing key there throws at runtime somewhere only
// a signed-in admin can see. `node --check` cannot catch that. Neither can the
// main smoke test, which only loads main.js.
import { readFileSync } from 'node:fs';

/* ----------------------------------------------------------- DOM stubs */
const made = new Map();

const stub = (name = '?') => {
  const self = {
    _name: name,
    innerHTML: '', textContent: '', value: '', className: '',
    dataset: {}, _on: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    style: {},
    addEventListener(t, f) { self._on[t] = f; },
    removeAttribute() {}, setAttribute() {}, getAttribute: () => null,
    focus() {}, click() { self._on.click?.(); },
    appendChild() {}, remove() {},
    querySelector: () => stub('child'), querySelectorAll: () => []
  };
  self.parentElement = { classList: self.classList };
  return self;
};

const bySel = (sel) => {
  if (!made.has(sel)) made.set(sel, stub(sel));
  return made.get(sel);
};

// The tab strip has to be real: admin.js binds a click handler per button and
// the whole analytics path hangs off that handler.
const TABS = ['registrations', 'analytics', 'roster', 'volunteers', 'partnerships', 'contacts', 'subscribers']
  .map((t) => { const b = stub('tab:' + t); b.dataset.tab = t; return b; });

global.document = {
  documentElement: stub('html'),
  querySelector: bySel,
  querySelectorAll: (sel) => (sel === '.tab' ? TABS : []),
  addEventListener() {},
  createElement: () => ({ set href(v) {}, get href() { return ''; }, click() {}, download: '' })
};
global.window = { supabase: null };
global.localStorage = { getItem: () => null, setItem() {} };
global.location = { hash: '', pathname: '/admin', origin: 'https://x.test', reload() {} };
global.history = { replaceState() {} };
global.setTimeout = (f) => 0;
global.clearTimeout = () => {};
global.URL = { createObjectURL: () => 'blob:', revokeObjectURL() {} };
global.Blob = class {};

/* ------------------------------------------------------- fake backend */
const now = new Date();
const daysAgo = (n) => new Date(now - n * 864e5).toISOString();
const ymd = (n) => new Date(now - n * 864e5).toISOString().slice(0, 10);

const ROWS = {
  registrations: [{ id: 'r1', created_at: daysAgo(2), guardian_name: 'A Guardian',
    guardian_relationship: 'Mother', guardian_email: 'a@b.c', guardian_phone: '604',
    guardian_street: '1 St', guardian_city: 'Surrey', guardian_postal: 'V0V 0V0',
    emergency_name: 'E', emergency_phone: '778', status: 'new' }],
  participants: [{ id: 'p1', registration_id: 'r1', child_name: 'Kid',
    child_dob: '2014-03-09', program: 'Soccer', photo_consent: true, medical: '' }],
  volunteers:   [{ id: 'v1', created_at: daysAgo(1), name: 'V', email: 'v@b.c', phone: '1',
    criminal_record_check: 'Yes', policy_agreed: true, interests: ['Coaching'] }],
  partnerships: [{ id: 'q1', created_at: daysAgo(400), org_name: 'Org', contact_person: 'C',
    email: 'o@b.c', partnership_type: 'Sponsor', status: 'new' }],
  contacts:     [{ id: 'c1', created_at: daysAgo(3), first_name: 'F', last_name: 'L',
    email: 'f@b.c', message: 'hi', is_read: false }],
  subscribers:  [{ id: 's1', created_at: daysAgo(5), consented_at: daysAgo(5),
    email: 's@b.c', consent_source: 'footer', unsubscribed_at: null }]
};

// Deliberately shaped like a REAL early-days response: mostly zeros, one quiet
// day, empty breakdown arrays. That is the state the client will actually see
// on day one, and it is exactly where a naive template divides by zero.
const SUMMARY = {
  generated_at: now.toISOString(), tz: 'America/Vancouver',
  first_seen: daysAgo(9), days: 30,
  totals: { today_views: 4, today_visitors: 3, yest_visitors: 0,
            d7_views: 12, d7_visitors: 7, prev7_visitors: 4,
            d30_views: 20, d30_visitors: 11, prev30_visitors: 0,
            all_views: 20, all_visitors: 11 },
  daily: Array.from({ length: 30 }, (_, i) => ({
    day: ymd(29 - i), views: i === 29 ? 4 : (i % 7 === 0 ? 2 : 0),
    visitors: i === 29 ? 3 : (i % 7 === 0 ? 1 : 0) })),
  top_pages: [{ path: '/', views: 14, visitors: 9 }, { path: '/register', views: 6, visitors: 4 }],
  referrers: [{ source: 'Direct / none', visitors: 8 }, { source: 'google.com', visitors: 3 }],
  devices:   [{ device: 'mobile', visitors: 7 }, { device: 'desktop', visitors: 4 }],
  countries: [{ country: 'CA', visitors: 10 }],
  best_day:  { day: ymd(0), visitors: 3 }
};

let rpcCalls = 0;
const query = (table) => {
  const res = { data: ROWS[table] || [], error: null };
  const chain = {
    order: () => Promise.resolve(res),
    eq: () => chain,
    maybeSingle: () => Promise.resolve({ data: { is_admin: true }, error: null }),
    then: (f) => Promise.resolve(res).then(f)
  };
  return chain;
};

global.window.supabase = {
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'u1', email: 'admin@x.test' } } } }),
      onAuthStateChange() {}, signOut: async () => {},
      signInWithOtp: async () => ({ error: null })
    },
    from: (t) => ({ select: () => query(t), update: () => ({ eq: async () => ({ error: null }) }) }),
    rpc: async (name, args) => {
      rpcCalls++;
      if (name !== 'analytics_summary') throw new Error('unexpected rpc: ' + name);
      if (args?.days !== 30) throw new Error('expected days=30, got ' + args?.days);
      return { data: SUMMARY, error: null };
    }
  })
};

global.fetch = async (url) => ({
  ok: true, status: 200,
  text: async () => JSON.stringify({ supabaseUrl: 'https://x.supabase.co', supabaseAnonKey: 'anon' }),
  json: async () => ({ allowed: true })
});

/* --------------------------------------------------------------- run */
const fail = (msg) => { console.error('  ✗ ' + msg); process.exitCode = 1; };
const settle = () => new Promise((r) => setImmediate(r));

// The tab handler is async, so anything it throws surfaces here rather than at
// the call site. Without this the harness dies with a raw stack instead of
// naming the failure.
process.on('unhandledRejection', (e) => {
  fail('render THREW asynchronously: ' + (e?.constructor?.name || '') + ': ' + (e?.message || e));
  process.exit(1);
});

try {
  new Function(readFileSync('assets/js/admin.js', 'utf8'))();
} catch (e) {
  fail('admin.js THREW during init: ' + e.constructor.name + ': ' + e.message);
  process.exit(1);
}
for (let i = 0; i < 12; i++) await settle();

if (!bySel('#stats').innerHTML.includes('Registrations')) fail('stat cards did not render');
else console.log('  ✓ admin.js booted and rendered the dashboard');

// Click Analytics.
const btn = TABS.find((t) => t.dataset.tab === 'analytics');
try { btn._on.click(); } catch (e) { fail('analytics tab handler THREW: ' + e.message); }
for (let i = 0; i < 12; i++) await settle();

const html = bySel('#panel').innerHTML;
if (rpcCalls !== 1) fail(`expected exactly 1 analytics_summary call, got ${rpcCalls}`);

const want = [
  ['lifetime total',   'Lifetime'],
  ['today card',       'Today'],
  ['trend chart',      'Visitors per day'],
  ['conversion block', 'Did visitors act?'],
  ['top pages',        'Most visited pages'],
  ['referrers',        'Where visitors came from'],
  ['privacy footnote', 'No cookies']
];
const missing = want.filter(([, s]) => !html.includes(s));
if (missing.length) fail('analytics panel missing: ' + missing.map((m) => m[0]).join(', '));
else console.log('  ✓ analytics tab rendered every section');

// 11 visitors, 3 actions inside 30 days (the 400-day-old partnership must be
// excluded) => 27.3%. Guards both the maths and the date window.
if (!html.includes('27.3%')) fail('conversion rate wrong — expected 27.3%, panel says: ' +
  (html.match(/Conversion rate:.{0,60}/)?.[0] || 'no rate at all'));
else console.log('  ✓ conversion rate correct, and old records excluded from the window');

// yest_visitors is 0 while today is 3: the delta helper must not divide by zero.
if (html.includes('Infinity') || html.includes('NaN')) fail('NaN/Infinity leaked into the panel');
else console.log('  ✓ no NaN/Infinity from empty comparison periods');

if (rpcCalls === 1) {
  try { btn._on.click(); } catch (e) { fail('re-click THREW: ' + e.message); }
  for (let i = 0; i < 6; i++) await settle();
  if (rpcCalls !== 1) fail('re-opening the tab refetched; the cache is not working');
  else console.log('  ✓ reopening the tab uses the cached payload');
}

/* --------------------------------------------------------- day one ---
   The state the client actually sees the hour this ships: table empty, so the
   aggregates come back as nulls and absent keys rather than zeros. Every
   fallback in the template exists for this pass — without them the first thing
   FSF ever sees on the tab is a blank panel. */
const $refresh = bySel('#refresh');
Object.assign(SUMMARY, {
  first_seen: null, best_day: null,
  totals: { all_views: 0, all_visitors: 0 },   // every other key absent, as jsonb would give
  // NOT [] — generate_series still gap-fills 30 zero rows against an empty
  // table. All-zero is the case that makes a naive peak calculation 0 and
  // divides every bar height by it.
  daily: Array.from({ length: 30 }, (_, i) => ({ day: ymd(29 - i), views: 0, visitors: 0 })),
  top_pages: [], referrers: [], devices: [], countries: []
});
for (const k of Object.keys(ROWS)) ROWS[k] = [];

try {
  $refresh._on.click();
  for (let i = 0; i < 14; i++) await settle();
} catch (e) {
  fail('empty-database render THREW: ' + e.constructor.name + ': ' + e.message);
}

const blank = bySel('#panel').innerHTML;
if (!blank.includes('Visitors per day')) fail('empty state did not render the dashboard at all');
else if (blank.includes('NaN') || blank.includes('undefined') || blank.includes('Infinity'))
  fail('empty state leaked NaN/undefined/Infinity into the page');
else if (!blank.includes('Not enough traffic yet'))
  fail('empty state should say there is no conversion rate yet, not print one');
else console.log('  ✓ empty database renders clean (no NaN, no undefined, honest copy)');
