// Exercises /api/submit's validation. Fake env so we get past the 503 guard —
// validation runs before any DB call, so every 400 path is fully testable.
process.env.SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-key';

const { default: handler } = await import('../api/submit.js');

const call = async (body, method = 'POST') => {
  const req = { method, body, headers: { 'user-agent': 'test' }, socket: {} };
  let status = 200, payload = null;
  const res = {
    status(s) { status = s; return this; },
    json(p) { payload = p; return this; },
    setHeader() {}
  };
  await handler(req, res);
  return { status, payload };
};

const yearsAgo = (n) => {
  const d = new Date(); d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
};

const goodReg = (over = {}) => ({
  type: 'registration',
  guardian_name: 'Amina Kamara', guardian_relationship: 'Parent',
  guardian_email: 'amina@example.com', guardian_phone: '778-555-0134',
  guardian_street: '123 King George Blvd', guardian_city: 'Surrey', guardian_postal: 'V3T 5H6',
  emergency_name: 'Joseph Kamara', emergency_phone: '778-555-0199',
  consent_policy: true, consent_accurate: true,
  children: [{ child_name: 'Zara', child_dob: yearsAgo(11),
               program: 'Sports Development & Unity Programs' }],
  ...over
});

const tests = [];
const t = async (name, run) => { tests.push({ name, ...(await run()) }); };

await t('GET rejected', async () => {
  const r = await call({}, 'GET');
  return { pass: r.status === 405, got: r.status };
});
await t('honeypot filled → silently accepted', async () => {
  const r = await call({ ...goodReg(), company_website: 'bot.com' });
  return { pass: r.status === 200 && r.payload.ok, got: r.status };
});
await t('unknown form type → 400', async () => {
  const r = await call({ type: 'nonsense' });
  return { pass: r.status === 400, got: r.payload?.error };
});
await t('missing guardian name → 400', async () => {
  const r = await call(goodReg({ guardian_name: '' }));
  return { pass: r.status === 400 && /guardian_name/.test(r.payload.error), got: r.payload?.error };
});
await t('bad email → 400', async () => {
  const r = await call(goodReg({ guardian_email: 'not-an-email' }));
  return { pass: /Invalid email/.test(r.payload?.error || ''), got: r.payload?.error };
});
await t('consent not given → 400', async () => {
  const r = await call(goodReg({ consent_policy: false }));
  return { pass: /consent/i.test(r.payload?.error || ''), got: r.payload?.error };
});
await t('no children → 400', async () => {
  const r = await call(goodReg({ children: [] }));
  return { pass: /at least one/i.test(r.payload?.error || ''), got: r.payload?.error };
});
await t('child age 2 → 400 (too young)', async () => {
  const r = await call(goodReg({ children: [{ child_name: 'Tiny', child_dob: yearsAgo(2),
    program: 'Sports Development & Unity Programs' }] }));
  return { pass: /aged 3–19/.test(r.payload?.error || ''), got: r.payload?.error };
});
await t('child age 20 → 400 (too old)', async () => {
  const r = await call(goodReg({ children: [{ child_name: 'Older', child_dob: yearsAgo(20),
    program: 'Sports Development & Unity Programs' }] }));
  return { pass: /aged 3–19/.test(r.payload?.error || ''), got: r.payload?.error };
});
await t('unknown program → 400', async () => {
  const r = await call(goodReg({ children: [{ child_name: 'X', child_dob: yearsAgo(10),
    program: 'Underwater Basket Weaving' }] }));
  return { pass: /unrecognised program/.test(r.payload?.error || ''), got: r.payload?.error };
});
await t('11 children → 400 (cap)', async () => {
  const kids = Array.from({ length: 11 }, (_, i) => ({ child_name: 'K' + i,
    child_dob: yearsAgo(10), program: 'Community Development' }));
  const r = await call(goodReg({ children: kids }));
  return { pass: /too many/i.test(r.payload?.error || ''), got: r.payload?.error };
});
await t('contact missing message → 400', async () => {
  const r = await call({ type: 'contact', first: 'A', last: 'B', email: 'a@b.com', message: '' });
  return { pass: /required/i.test(r.payload?.error || ''), got: r.payload?.error };
});
await t('valid registration passes validation (reaches DB)', async () => {
  const r = await call(goodReg());
  // fake creds → DB call fails → 500. Reaching 500 proves validation passed.
  return { pass: r.status === 500, got: r.status + ' (500 = validation OK, DB unreachable as expected)' };
});

let fail = 0;
for (const x of tests) { if (!x.pass) fail++; console.log(`  ${x.pass ? '✓' : '✗'} ${x.name}${x.pass ? '' : '  → ' + x.got}`); }
console.log(`\n  ${tests.length - fail}/${tests.length} passed`);
process.exitCode = fail ? 1 : 0;
