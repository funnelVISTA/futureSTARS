/**
 * POST /api/admin-check  { email }  ->  { allowed: boolean }
 *
 * Gates the magic link. The browser asks here first; only an allowlisted email
 * gets a sign-in link requested at all, so strangers never trigger an email or
 * create an auth account.
 *
 * The allowlist itself never reaches the browser — this runs with the service
 * role and returns a single boolean.
 *
 * This is a UX gate, not the security boundary. Even if someone bypassed it and
 * signed in, profiles.is_admin would still be false and RLS would return zero
 * rows. Defence in depth, with the real wall at the database.
 */
import { createClient } from '@supabase/supabase-js';

const isEmail = (v) => typeof v === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ error: 'Not configured' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }

  const email = String(body?.email ?? '').trim().toLowerCase();
  if (!isEmail(email)) return res.status(400).json({ error: 'Invalid email address' });

  try {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await sb
      .from('admin_allowlist')
      .select('email')
      .ilike('email', email)      // case-insensitive: staff type it however they like
      .maybeSingle();
    if (error) throw error;

    return res.status(200).json({ allowed: !!data });
  } catch (e) {
    console.error('admin-check failed:', e);
    // Fail closed — an unreachable allowlist must not grant access.
    return res.status(500).json({ error: 'Could not verify that address. Please try again.' });
  }
}
