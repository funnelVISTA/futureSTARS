/**
 * GET /api/config — public client configuration for /admin.
 *
 * Returns the Supabase URL and the ANON key. Both are designed to be public:
 * the anon key identifies the project, it does not authorise anything. Every
 * table has RLS on, `anon` holds no grants at all, and reads are further gated
 * on profiles.is_admin — so this key alone reads nothing.
 *
 * It's served from here rather than committed to the repo purely so the value
 * lives with the other env vars and can be rotated without a code change.
 *
 * The SERVICE ROLE key is never exposed here. It stays server-side in
 * /api/submit, which is the only write path.
 */
export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return res.status(503).json({
      error: 'Admin is not configured yet. Set SUPABASE_URL and SUPABASE_ANON_KEY.'
    });
  }

  // Short cache: config rarely changes, but a rotated key should take effect
  // without waiting on a long TTL.
  res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');
  return res.status(200).json({ supabaseUrl: url, supabaseAnonKey: anonKey });
}
