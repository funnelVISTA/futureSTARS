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

/** Send one email via Resend. Never throws — email must not fail a submission. */
async function sendMail({ to, subject, html, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || 'FSF Website <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {})
      })
    });
    if (!r.ok) console.error('resend rejected:', r.status, await r.text());
  } catch (e) {
    console.error('sendMail failed:', e.message);
  }
}

const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Branded shell so staff mail doesn't look like a raw dump. */
const wrap = (heading, rowsHtml, footer = '') => `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f6f5f0;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e7e2d4">
      <div style="background:#0b0b0f;padding:18px 22px">
        <span style="color:#e3a812;font-weight:800;letter-spacing:.5px">FUTURE STARS FOUNDATION</span>
      </div>
      <div style="padding:22px">
        <h2 style="margin:0 0 14px;font-size:18px;color:#17161c">${heading}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#17161c">${rowsHtml}</table>
        ${footer}
      </div>
    </div>
  </div>`;

const row2 = (label, value) => value
  ? `<tr>
       <td style="padding:6px 10px 6px 0;color:#6b6a63;white-space:nowrap;vertical-align:top">${esc(label)}</td>
       <td style="padding:6px 0;vertical-align:top"><strong>${esc(value)}</strong></td>
     </tr>`
  : '';

/** Confirmation to the person who submitted — so they know it landed. */
const confirmation = (name, body) => wrap(
  `Thanks, ${esc(name.split(' ')[0] || 'there')} \u2014 we've got it.`,
  '',
  `<div style="font-size:14px;line-height:1.6;color:#17161c">${body}</div>
   <p style="margin-top:18px;font-size:13px;color:#6b6a63">
     Questions? Reply to this email or call +1 (778) 707-1921.<br/>
     Future Stars Foundation \u00b7 9835 King George Blvd., Surrey BC
   </p>`
);

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
      subject: `New registration — ${required.guardian_name} (${children.length} ${children.length === 1 ? 'child' : 'children'})`,
      replyTo: required.guardian_email,
      staffHtml: wrap('New program registration',
        row2('Guardian', required.guardian_name) +
        row2('Relationship', required.guardian_relationship) +
        row2('Email', required.guardian_email) +
        row2('Phone', required.guardian_phone) +
        row2('Address', `${required.guardian_street}, ${required.guardian_city} ${required.guardian_postal}`) +
        row2('Emergency', `${required.emergency_name} — ${required.emergency_phone}`),
        `<h3 style="margin:18px 0 8px;font-size:15px;color:#17161c">Participants</h3>` +
        children.map((c) => `
          <div style="border:1px solid #e7e2d4;border-radius:8px;padding:12px;margin-bottom:8px">
            <strong style="font-size:14px">${esc(c.child_name)}</strong>
            <div style="font-size:13px;color:#6b6a63;margin-top:4px">
              ${esc(c.program)}<br/>DOB ${esc(c.child_dob)}
              ${c.school ? `<br/>School: ${esc(c.school)}` : ''}
              ${c.medical ? `<br/><span style="color:#c0392f">Medical/allergies: ${esc(c.medical)}</span>` : ''}
              <br/>Photo consent: ${c.photo_consent ? 'yes' : 'no'}
            </div>
          </div>`).join('')),
      confirmTo: required.guardian_email,
      confirmHtml: confirmation(required.guardian_name,
        `<p>We've received your registration for
         <strong>${children.map((c) => esc(c.child_name)).join(', ')}</strong>.</p>
         <p>A team member will be in touch to confirm
         ${children.length === 1 ? "your child's place" : 'their places'} and let you know
         about any program fee.</p>`)
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
      subject: `New message — ${row.first_name} ${row.last_name}`,
      replyTo: row.email,
      staffHtml: wrap('New contact message',
        row2('From', `${row.first_name} ${row.last_name}`) + row2('Email', row.email),
        `<div style="margin-top:14px;padding:12px;background:#faf7ef;border-radius:8px;
                     font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(row.message)}</div>`),
      confirmTo: row.email,
      confirmHtml: confirmation(row.first_name,
        `<p>Thanks for getting in touch — we've received your message and will reply soon.</p>`)
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
      subject: `New volunteer application — ${row.name}`,
      replyTo: row.email,
      staffHtml: wrap('New volunteer application',
        row2('Name', row.name) + row2('Email', row.email) + row2('Phone', row.phone) +
        row2('Criminal record check', row.criminal_record_check || 'not stated') +
        row2('Youth protection policy', row.policy_agreed ? 'agreed' : 'NOT agreed') +
        row2('Interests', row.interests.join(', ')) +
        row2('Availability', row.availability.join(', ')),
        row.criminal_record_check === 'No'
          ? `<p style="margin-top:14px;padding:10px;background:#fdeceb;border-radius:8px;
                       font-size:13px;color:#c0392f">
               No criminal record check on file — screen before any contact with youth.
             </p>` : ''),
      confirmTo: row.email,
      confirmHtml: confirmation(row.name,
        `<p>Thanks for offering to volunteer with Future Stars Foundation.</p>
         <p>Our team will review your application and be in touch about next steps,
            including any screening required before working with youth.</p>`)
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
      subject: `New partnership enquiry — ${row.org_name}`,
      replyTo: row.email,
      staffHtml: wrap('New partnership enquiry',
        row2('Organization', row.org_name) + row2('Contact', row.contact_person) +
        row2('Title', row.title) + row2('Email', row.email) + row2('Phone', row.phone) +
        row2('Type', row.partnership_type) + row2('Focus area', row.focus_area) +
        row2('Worked with youth before', row.prior_partnership) +
        row2('Heard about us via', row.heard_about),
        row.description
          ? `<div style="margin-top:14px;padding:12px;background:#faf7ef;border-radius:8px;
                         font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(row.description)}</div>` : ''),
      confirmTo: row.email,
      confirmHtml: confirmation(row.contact_person,
        `<p>Thanks for your interest in partnering with Future Stars Foundation.</p>
         <p>We've received your enquiry on behalf of <strong>${esc(row.org_name)}</strong>
            and will be in touch to explore how we can work together.</p>`)
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

    // Fire both emails in parallel. They're deliberately awaited so the
    // serverless function doesn't exit before they're sent, but sendMail never
    // throws — a mail failure must not turn a saved submission into an error.
    await Promise.all([
      sendMail({
        to: process.env.NOTIFY_EMAIL,
        subject: result.subject || `FSF website — ${body.type}`,
        html: result.staffHtml,
        replyTo: result.replyTo            // staff can reply straight to the person
      }),
      result.confirmTo
        ? sendMail({ to: result.confirmTo, subject: 'We received your submission — Future Stars Foundation', html: result.confirmHtml })
        : null
    ]);

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
