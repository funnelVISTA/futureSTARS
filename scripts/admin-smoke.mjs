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
    focus() {}, click() { self._on.click?.({ stopPropagation() {} }); },
    appendChild() {}, remove() {},
    querySelector: () => stub('child'),
    // admin.js binds row buttons with $$('[data-x]', panel) after writing
    // innerHTML. Returning [] here would make every click test vacuous, so
    // scan the markup we were just handed and hand back matching stubs.
    querySelectorAll(sel) {
      const m = /^\[data-([a-z-]+)\]$/.exec(sel);
      if (!m) return [];
      // Memoised against the current markup. Without this every call would mint
      // fresh stubs, so the button admin.js bound a listener to and the button
      // the test clicks would be different objects and nothing would fire.
      //
      // Keyed per selector: the contacts tab looks up [data-view] and
      // [data-read] against the same panel, and a single slot would let the
      // second lookup evict the first and hand the test unbound stubs.
      self._qsa ||= new Map();
      const key = self.innerHTML;
      if (self._qsa.get(sel)?.key === key) return self._qsa.get(sel).list;

      const camel = m[1].replace(/-(\w)/g, (_, c) => c.toUpperCase());
      const re = new RegExp(`data-${m[1]}="([^"]*)"(?:\\s+data-kind="([^"]*)")?`, 'g');
      const list = [];
      for (let x; (x = re.exec(self.innerHTML)); ) {
        const b = stub('btn');
        b.dataset[camel] = x[1];
        if (x[2]) b.dataset.kind = x[2];
        list.push(b);
      }
      self._qsa.set(sel, { key, list });
      return list;
    }
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

const docOn = {};
global.document = {
  documentElement: stub('html'),
  activeElement: null,
  querySelector: bySel,
  querySelectorAll: (sel) => (sel === '.tab' ? TABS : []),
  addEventListener(t, f) { docOn[t] = f; },
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

// Every value is a distinct sentinel so the modal assertions below can prove
// each one actually reached the page. These rows carry EVERY column in
// supabase/schema.sql — that is the point: the complaint that prompted this
// view was that the dashboard silently dropped fields.
const ROWS = {
  registrations: [{ id: 'r1', created_at: daysAgo(2),
    guardian_name: 'Amara Okonkwo', guardian_relationship: 'Mother',
    guardian_email: 'amara@example.com', guardian_phone: '604-555-0111',
    guardian_street: '1200 Fraser Way', guardian_city: 'Surrey', guardian_postal: 'V3T 0A1',
    emergency_name: 'Chidi Okonkwo', emergency_phone: '778-555-0122',
    emergency_relationship: 'Uncle',
    consent_policy: true, consent_accurate: true, consent_newsletter: false,
    status: 'new', staff_notes: 'Called back Tuesday',
    source_ip: '203.0.113.7', user_agent: 'RegUA/1.0' }],
  participants: [{ id: 'p1', registration_id: 'r1', child_name: 'Zuri Okonkwo',
    child_dob: '2014-03-09', program: 'Soccer Development', school: 'Fraser Heights Elementary',
    medical: 'Peanut allergy — carries EpiPen', photo_consent: false }],
  volunteers:   [{ id: 'v1', created_at: daysAgo(1), name: 'Devon Clarke',
    dob: '1996-11-02', email: 'devon@example.com', phone: '604-555-0133',
    street: '88 Alder Cres', city: 'Delta', province: 'BC', postal: 'V4K 1N2',
    country: 'Canada', emergency_contact: 'Marie Clarke 604-555-0144',
    interests: ['Coaching', 'Transport'], availability: ['Weekends'],
    why: 'Played club football and want to give back',
    skills: 'NCCP level 1 coaching certificate',
    medical_needs: 'None',
    criminal_record_check: 'Yes', policy_agreed: true, consent: true,
    signature: 'Devon Clarke', signed_date: '2026-07-01',
    status: 'screening', staff_notes: 'CRC copy on file',
    source_ip: '203.0.113.8', user_agent: 'VolUA/1.0' }],
  partnerships: [{ id: 'q1', created_at: daysAgo(400), org_name: 'Harbour Foods Ltd',
    contact_person: 'Priya Raman', title: 'Community Manager',
    email: 'priya@example.com', phone: '604-555-0155',
    website: 'https://harbourfoods.example', address: '9 Dock Road, Vancouver',
    partnership_type: 'Sponsorship', description: 'Kit sponsorship for one season',
    focus_area: 'Youth nutrition', prior_partnership: 'Donated snacks in 2025',
    heard_about: 'Word of mouth', consent: true,
    status: 'new', staff_notes: 'Follow up in September',
    source_ip: '203.0.113.9', user_agent: 'PartUA/1.0' }],
  contacts:     [{ id: 'c1', created_at: daysAgo(3), first_name: 'Sam', last_name: 'Whitfield',
    email: 'sam@example.com', message: 'Do you run programmes in Burnaby?',
    is_read: false, staff_notes: 'Replied by email',
    source_ip: '203.0.113.10', user_agent: 'ContactUA/1.0' }],
  subscribers:  [{ id: 's1', created_at: daysAgo(5), consented_at: daysAgo(5),
    email: 'subscriber@example.com', consent_source: 'registration_form',
    source_ip: '203.0.113.11', user_agent: 'SubUA/1.0', unsubscribed_at: null }]
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
const $refreshBtn = bySel('#refresh');
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

/* ------------------------------------------------ full record modal ---
   The reason this view exists: the tables show a summary, and several columns
   (volunteer address, availability, skills, signature; partnership website,
   focus area, description) appeared NOWHERE in the dashboard. Each case below
   opens a record and asserts every stored value reached the page, so a column
   added later that nobody wired up fails the build instead of going unnoticed. */

const openFrom = async (tabName, kind) => {
  const b = TABS.find((t) => t.dataset.tab === tabName);
  b._on.click();
  for (let i = 0; i < 8; i++) await settle();
  const btns = bySel('#panel').querySelectorAll('[data-view]');
  const hit = btns.find((x) => x.dataset.kind === kind);
  if (!hit) { fail(`no View button rendered on the ${tabName} tab`); return ''; }
  hit._on.click({ stopPropagation() {} });
  for (let i = 0; i < 4; i++) await settle();
  return bySel('#modal-body').innerHTML;
};

// Sentinels that must survive into the modal. Anything omitted from the render
// is a field staff would never see.
const MUST_SHOW = {
  registrations: ['registrations', ['Amara Okonkwo', 'Mother', 'amara@example.com', '604-555-0111',
    '1200 Fraser Way', 'Surrey', 'V3T 0A1', 'Chidi Okonkwo', '778-555-0122', 'Uncle',
    'Zuri Okonkwo', 'Soccer Development', 'Fraser Heights Elementary',
    'Peanut allergy', 'Called back Tuesday', '203.0.113.7']],
  volunteers: ['volunteers', ['Devon Clarke', 'devon@example.com', '604-555-0133',
    '88 Alder Cres', 'Delta', 'BC', 'V4K 1N2', 'Canada', 'Marie Clarke',
    'Coaching', 'Transport', 'Weekends', 'give back', 'NCCP level 1',
    'CRC copy on file', '203.0.113.8']],
  partnerships: ['partnerships', ['Harbour Foods Ltd', 'Priya Raman', 'Community Manager',
    'priya@example.com', '604-555-0155', 'harbourfoods.example', '9 Dock Road',
    'Sponsorship', 'Kit sponsorship', 'Youth nutrition', 'Donated snacks in 2025',
    'Word of mouth', 'Follow up in September', '203.0.113.9']],
  contacts: ['contacts', ['Sam', 'Whitfield', 'sam@example.com',
    'programmes in Burnaby', 'Replied by email', '203.0.113.10']],
  subscribers: ['subscribers', ['subscriber@example.com', 'registration_form', '203.0.113.11']]
};

for (const [tabName, [kind, needles]] of Object.entries(MUST_SHOW)) {
  const html = await openFrom(tabName, kind);
  const gone = needles.filter((n) => !html.includes(n));
  if (gone.length) fail(`${tabName} record hides: ${gone.join(', ')}`);
  else console.log(`  ✓ ${tabName}: full record shows every stored field`);
}

// Reopen a registration for the remaining structural checks.
const reg = await openFrom('registrations', 'registrations');

// DUMP_HTML=<file> writes the markup admin.js actually produced, so it can be
// viewed against the real stylesheet without a Supabase login. Test-only — the
// shipping code has no hook in it.
if (process.env.DUMP_HTML) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(process.env.DUMP_HTML, JSON.stringify({
    kind: bySel('#modal-kind').textContent,
    title: bySel('#modal-title').textContent,
    sub: bySel('#modal-sub').textContent,
    body: reg
  }, null, 2));
}

// photo_consent is false and medical is set — both are safeguarding answers a
// summary row would round away.
if (!/Photo consent[\s\S]{0,220}?>No</.test(reg)) fail('photo consent "No" not shown on the child card');
else console.log('  ✓ photo-consent "No" is stated, not just omitted');

// An unanswered optional field must say so. Dropping the row would read as
// "never asked", which is a different fact from "asked and skipped".
ROWS.registrations[0].staff_notes = '';
ROWS.registrations[0].emergency_relationship = null;
$refreshBtn._on.click();
for (let i = 0; i < 10; i++) await settle();
const blankFields = await openFrom('registrations', 'registrations');
if (!blankFields.includes('Not provided')) fail('empty fields are dropped instead of marked "Not provided"');
else console.log('  ✓ unanswered fields are marked, not silently dropped');

// Escape must close it — staff will hit it before hunting for the X.
if (typeof docOn.keydown !== 'function') fail('no keydown handler bound for Escape');
else {
  bySel('#modal').classList.contains = () => false;   // pretend it is open
  let closed = false;
  bySel('#modal').classList.add = (c) => { if (c === 'hidden') closed = true; };
  docOn.keydown({ key: 'Escape' });
  if (!closed) fail('Escape did not close the record');
  else console.log('  ✓ Escape closes the record');
}

/* --------------------------------------------------------- day one ---
   The state the client actually sees the hour this ships: table empty, so the
   aggregates come back as nulls and absent keys rather than zeros. Every
   fallback in the template exists for this pass — without them the first thing
   FSF ever sees on the tab is a blank panel. */
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
  // The record tests above left the dashboard on Registrations; refresh only
  // re-renders analytics when that tab is the active one.
  btn._on.click();
  for (let i = 0; i < 6; i++) await settle();
  $refreshBtn._on.click();
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
