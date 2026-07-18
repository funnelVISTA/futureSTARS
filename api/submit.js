/**
 * POST /api/submit — the single write path for every form on the site.
 *
 * Everything goes through here rather than browser→Supabase directly, so that:
 *   • the service-role key stays server-side (a browser key could be used to
 *     write anything from anywhere),
 *   • payloads are validated before they reach the database,
 *   • spam is filtered by Turnstile,
 *   • one place owns notification email.
 *
 * Env (set in Vercel → Settings → Environment Variables):
 *   SUPABASE_URL                required
 *   SUPABASE_SERVICE_ROLE_KEY   required — server-only, never expose
 *   TURNSTILE_SECRET_KEY        optional — spam check runs only if set
 *   RESEND_API_KEY              optional — notification email only if set
 *   NOTIFY_EMAIL                optional — where notifications go
 *   NOTIFY_FROM                 optional — verified sender domain
 */
import { createClient } from '@supabase/supabase-js';

const MIN_AGE = 3;
const MAX_AGE = 19;

const PROGRAMS = [
  'Sports Development & Unity Programs',
  'Education & Career Support',
  'Basic Needs and Welfare Support Services',
  'Mentorship, Leadership & Life Skills Development',
  'Settlement & Cultural Integration',
  'Community Development',
  'Infrastructure & International Outreach: Home Centre & Dormitory'
];

/* --------------------------------------------------------------- helpers */
const str = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const bool = (v) => v === true || v === 'true' || v === 'on';
const isEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

const ageFrom = (dob) => {
  const d = new Date(dob);
  if (isNaN(d)) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
};

const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket?.remoteAddress || null;

/** Cloudflare Turnstile. Skipped entirely when no secret is configured. */
async function passesSpamCheck(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip })
    });
    const data = await r.json();
    return !!data.success;
  } catch {
    return false;   // fail closed — a broken spam check shouldn't open the door
  }
}

/** Best-effort notification. Never fails the submission. */
async function notify(subject, lines) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || 'FSF Website <onboarding@resend.dev>',
        to: [to],
        subject,
        text: lines.filter(Boolean).join('\n')
      })
    });
  } catch (e) {
    console.error('notify failed:', e.message);
  }
}

/* ------------------------------------------------------------- validators */
/** Each returns { error } or { row, children?, subscribe?, summary } */
const handlers = {
  registration(b) {
    const required = {
      guardian_name: str(b.guardian_name, 200),
      guardian_relationship: str(b.guardian_relationship, 100),
      guardian_email: str(b.guardian_email, 200),
      guardian_phone: str(b.guardian_phone, 50),
      guardian_street: str(b.guardian_street, 300),
      guardian_city: str(b.guardian_city, 120),
      guardian_postal: str(b.guardian_postal, 20),
      emergency_name: str(b.emergency_name, 200),
      emergency_phone: str(b.emergency_phone, 50)
    };
    for (const [k, v] of Object.entries(required)) {
      if (!v) return { error: `Missing required field: ${k}` };
    }
    if (!isEmail(required.guardian_email)) return { error: 'Invalid email address' };
    if (!bool(b.consent_policy) || !bool(b.consent_accurate)) {
      return { error: 'Both required consents must be given' };
    }

    const kids = Array.isArray(b.children) ? b.children : [];
    if (!kids.length) return { error: 'At least one participant is required' };
    if (kids.length > 10) return { error: 'Too many participants in one submission' };

    const children = [];
    for (const [i, c] of kids.entries()) {
      const name = str(c.child_name, 200);
      const dob = str(c.child_dob, 20);
      const program = str(c.program, 200);
      if (!name || !dob || !program) {
        return { error: `Participant ${i + 1} is missing name, date of birth, or program` };
      }
      // Re-checked server-side: the browser check is a convenience, not a guard.
      const age = ageFrom(dob);
      if (age === null || age < MIN_AGE || age > MAX_AGE) {
        return { error: `Participant ${i + 1} must be aged ${MIN_AGE}–${MAX_AGE} (got ${age ?? 'invalid date'})` };
      }
      if (!PROGRAMS.includes(program)) {
        return { error: `Participant ${i + 1} has an unrecognised program` };
      }
      children.push({
        child_name: name,
        child_dob: dob,
        program,
        school: str(c.school, 200) || null,
        medical: str(c.medical, 2000) || null,
        photo_consent: bool(c.photo_consent)
      });
    }

    return {
      table: 'registrations',
      row: {
        ...required,
        emergency_relationship: str(b.emergency_relationship, 100) || null,
        consent_policy: true,
        consent_accurate: true,
        consent_newsletter: bool(b.consent_newsletter)
      },
      children,
      subscribe: bool(b.consent_newsletter) ? required.guardian_email : null,
      summary: [
        `New registration from ${required.guardian_name} <${required.guardian_email}>`,
        `Phone: ${required.guardian_phone}`,
        '',
        ...children.map((c, i) => `${i + 1}. ${c.child_name} — ${c.program} (DOB ${c.child_dob})`)
      ]
    };
  },

  contact(b) {
    const row = {
      first_name: str(b.first, 120),
      last_name: str(b.last, 120),
      email: str(b.email, 200),
      message: str(b.message, 5000)
    };
    if (!row.first_name || !row.last_name || !row.email || !row.message) {
      return { error: 'All fields are required' };
    }
    if (!isEmail(row.email)) return { error: 'Invalid email address' };
    return {
      table: 'contacts', row,
      summary: [`New message from ${row.first_name} ${row.last_name} <${row.email}>`, '', row.message]
    };
  },

  volunteer(b) {
    const row = {
      name: str(b.name, 200),
      dob: str(b.dob, 20) || null,
      email: str(b.email, 200),
      phone: str(b.phone, 50),
      street: str(b.street, 300) || null,
      city: str(b.city, 120) || null,
      province: str(b.province, 120) || null,
      postal: str(b.zip, 20) || null,
      country: str(b.country, 120) || null,
      emergency_contact: str(b.emergency, 300) || null,
      interests: Array.isArray(b.interests) ? b.interests.map((x) => str(x, 120)) : [],
      availability: Array.isArray(b.availability) ? b.availability.map((x) => str(x, 60)) : [],
      why: str(b.why, 3000) || null,
      skills: str(b.skills, 3000) || null,
      medical_needs: str(b.medical, 2000) || null,
      criminal_record_check: ['Yes', 'No'].includes(str(b.crc, 10)) ? str(b.crc, 10) : null,
      policy_agreed: bool(b.policy),
      consent: bool(b.consent),
      signature: str(b.signature, 200) || null,
      signed_date: str(b.sigdate, 20) || null
    };
    if (!row.name || !row.email || !row.phone) return { error: 'Name, email and phone are required' };
    if (!isEmail(row.email)) return { error: 'Invalid email address' };
    if (!row.policy_agreed || !row.consent) return { error: 'Required agreements must be accepted' };
    return {
      table: 'volunteers', row,
      summary: [
        `New volunteer application: ${row.name} <${row.email}>`,
        `Phone: ${row.phone}`,
        `Criminal record check: ${row.criminal_record_check || 'not stated'}`,
        `Interests: ${row.interests.join(', ') || '—'}`
      ]
    };
  },

  partnership(b) {
    const row = {
      org_name: str(b.org, 250),
      contact_person: str(b.person, 200),
      title: str(b.title, 150) || null,
      email: str(b.email, 200),
      phone: str(b.phone, 50),
      website: str(b.website, 300) || null,
      address: str(b.address, 300) || null,
      partnership_type: str(b.ptype, 200) || null,
      description: str(b.describe, 3000) || null,
      focus_area: str(b.focus, 2000) || null,
      prior_partnership: str(b.prior, 10) || null,
      heard_about: str(b.hear, 100) || null,
      consent: bool(b.consent)
    };
    if (!row.org_name || !row.contact_person || !row.email || !row.phone) {
      return { error: 'Organization, contact person, email and phone are required' };
    }
    if (!isEmail(row.email)) return { error: 'Invalid email address' };
    if (!row.consent) return { error: 'Consent is required' };
    return {
      table: 'partnerships', row,
      summary: [
        `New partnership enquiry: ${row.org_name}`,
        `Contact: ${row.contact_person} <${row.email}>`,
        `Type: ${row.partnership_type || '—'}`
      ]
    };
  }
};

/* ------------------------------------------------------------------ route */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Supabase env vars missing');
    return res.status(503).json({
      ok: false,
      error: "The form isn't connected yet. Please email info@futurestarsfoundation.com."
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ ok: false, error: 'Invalid JSON' }); }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Missing body' });
  }

  // Honeypot: a hidden field only a bot would fill. Accept-and-discard so the
  // bot sees success and doesn't retry with a different strategy.
  if (str(body.company_website)) return res.status(200).json({ ok: true });

  const handle = handlers[body.type];
  if (!handle) return res.status(400).json({ ok: false, error: 'Unknown form type' });

  const ip = clientIp(req);
  if (!(await passesSpamCheck(body.turnstile_token, ip))) {
    return res.status(400).json({ ok: false, error: 'Spam check failed. Please reload and try again.' });
  }

  const result = handle(body);
  if (result.error) return res.status(400).json({ ok: false, error: result.error });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const meta = { source_ip: ip, user_agent: str(req.headers['user-agent'], 500) };

  try {
    const { data, error } = await supabase
      .from(result.table)
      .insert({ ...result.row, ...meta })
      .select('id')
      .single();
    if (error) throw error;

    // children are a separate table; roll the parent back if they fail so we
    // never keep a registration with no participants attached
    if (result.children?.length) {
      const { error: kidErr } = await supabase
        .from('participants')
        .insert(result.children.map((c) => ({ ...c, registration_id: data.id })));
      if (kidErr) {
        await supabase.from('registrations').delete().eq('id', data.id);
        throw kidErr;
      }
    }

    // newsletter opt-in — recorded with its own consent trail for CASL
    if (result.subscribe) {
      await supabase.from('subscribers').upsert(
        {
          email: result.subscribe,
          consent_source: `${body.type}_form`,
          consented_at: new Date().toISOString(),
          unsubscribed_at: null,
          ...meta
        },
        { onConflict: 'email' }
      );
    }

    await notify(`FSF website — ${body.type}`, result.summary);
    return res.status(200).json({ ok: true, id: data.id });
  } catch (e) {
    // Log the detail server-side; return something a visitor can act on.
    console.error('submit failed:', e);
    return res.status(500).json({
      ok: false,
      error: "Sorry — we couldn't save that. Please try again, or email info@futurestarsfoundation.com."
    });
  }
}
