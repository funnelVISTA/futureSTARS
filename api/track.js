/**
 * POST /api/track  { p, r, u, w }  ->  204
 *
 * Cookieless pageview beacon. See supabase/migrations/007_analytics.sql for the
 * privacy shape and what it costs us in accuracy.
 *
 * Three rules this file exists to enforce:
 *   1. The raw IP is never stored. It is hashed with the user-agent and a salt
 *      that rotates at midnight, and only the digest is written.
 *   2. It always returns 204, even on failure. A broken analytics call must
 *      never surface an error on a visitor's page or block navigation.
 *   3. It never trusts the client for anything that matters. Paths are
 *      normalised against a hard length cap, referrers are reduced to a host,
 *      and unknown junk is dropped rather than stored.
 */
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

export const BOT = /bot|crawl|spider|slurp|bing|yandex|baidu|duckduck|facebookexternalhit|preview|fetch|curl|wget|python|headless|lighthouse|pingdom|uptime|monitor|scan|semrush|ahrefs|gpt|claude|perplexity/i;

const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket?.remoteAddress || '';

/**
 * Rotates at midnight UTC. Anything hashed yesterday is unlinkable to anything
 * hashed today — that is the whole point, and it is why multi-day "visitors"
 * means visits-by-day rather than people.
 */
export const visitorHash = (ip, ua) => {
  const salt = process.env.ANALYTICS_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fsf';
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${day}|${salt}|${ip}|${ua}`).digest('hex').slice(0, 32);
};

/** Query strings and hashes are stripped — they carry no reporting value here
 *  and can carry personal data a visitor pasted into the address bar. */
export const cleanPath = (v) => {
  let p = String(v ?? '/').split('#')[0].split('?')[0].trim();
  if (!p.startsWith('/')) p = '/' + p;
  p = p.replace(/\/index\.html?$/i, '/').replace(/\.html?$/i, '');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return (p || '/').slice(0, 200).toLowerCase();
};

export const refHost = (v, self) => {
  try {
    const h = new URL(String(v)).hostname.replace(/^www\./, '').toLowerCase();
    return !h || h === self ? null : h.slice(0, 120);   // self-referral is just navigation
  } catch { return null; }
};

export const deviceOf = (ua, width) => {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return 'tablet';
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) return 'mobile';
  const w = Number(width);
  if (Number.isFinite(w) && w > 0) return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  return 'desktop';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  // Not configured, or a bot: accept and drop. Never tell the caller either way.
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ua = String(req.headers['user-agent'] || '').slice(0, 400);
  if (!url || !key || !ua || BOT.test(ua)) return res.status(204).end();

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(204).end(); } }
  if (!body || typeof body !== 'object') return res.status(204).end();

  const path = cleanPath(body.p);
  // Staff traffic would otherwise inflate the numbers the staff are reading.
  if (path.startsWith('/admin')) return res.status(204).end();

  try {
    const self = String(req.headers.host || '').replace(/^www\./, '').toLowerCase();
    const supabase = createClient(url, key, { auth: { persistSession: false } });

    await supabase.from('pageviews').insert({
      path,
      referrer_host: refHost(body.r, self),
      utm_source: body.u ? String(body.u).trim().slice(0, 80).toLowerCase() || null : null,
      device: deviceOf(ua, body.w),
      // Supplied by the CDN edge — country only, never city or coordinates.
      country: String(req.headers['x-vercel-ip-country'] || '').slice(0, 2).toUpperCase() || null,
      visitor_hash: visitorHash(clientIp(req), ua)
    });
  } catch (e) {
    // Logged for us, invisible to the visitor. Losing a pageview is acceptable;
    // letting analytics break a page is not.
    console.error('track failed:', e.message);
  }

  return res.status(204).end();
}
