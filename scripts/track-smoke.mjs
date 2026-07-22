// Unit checks for the pageview beacon's normalisation. These are the privacy
// and correctness boundary: what reaches the database is exactly what these
// four functions return, and nothing here is visible in the dashboard until
// it's already been written.
import { cleanPath, refHost, deviceOf, visitorHash, BOT } from '../api/track.js';

let bad = 0;
const eq = (got, want, label) => {
  if (got === want) return;
  console.error(`  ✗ ${label}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
  bad++;
};

/* ------------------------------------------------------------ paths */
eq(cleanPath('/'), '/', 'root');
eq(cleanPath('/index.html'), '/', 'index.html collapses to root');
eq(cleanPath('/register.html'), '/register', 'extension stripped');
eq(cleanPath('/register/'), '/register', 'trailing slash stripped');
eq(cleanPath('/Register'), '/register', 'case normalised so pages do not split');
eq(cleanPath('register'), '/register', 'leading slash added');
eq(cleanPath(undefined), '/', 'missing path defaults to root');
eq(cleanPath('/x#top'), '/x', 'fragment stripped');
// The one that matters: a guardian's email must never land in the path column
// because it happened to be in the query string.
eq(cleanPath('/register?email=parent@example.com&utm_source=fb'), '/register',
   'query string stripped (this is what keeps PII out of the path)');
eq(cleanPath('/' + 'a'.repeat(500)).length, 200, 'path capped at 200 chars');

/* -------------------------------------------------------- referrers */
eq(refHost('https://www.google.com/search?q=x', 'futurestarsfoundation.com'), 'google.com',
   'referrer reduced to host, www stripped, query dropped');
eq(refHost('https://futurestarsfoundation.com/about', 'futurestarsfoundation.com'), null,
   'self-referral dropped — internal navigation is not a traffic source');
eq(refHost('https://www.futurestarsfoundation.com/', 'futurestarsfoundation.com'), null,
   'self-referral dropped even with www');
eq(refHost('', 'x.com'), null, 'empty referrer');
eq(refHost('not a url', 'x.com'), null, 'garbage referrer does not throw');

/* ----------------------------------------------------------- device */
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
const IPAD   = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
const MAC    = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120';
const ANDROID_PHONE  = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36';
const ANDROID_TABLET = 'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 Chrome/120 Safari/537.36';

eq(deviceOf(IPHONE, 390), 'mobile', 'iPhone');
eq(deviceOf(IPAD, 820), 'tablet', 'iPad — must not be counted as mobile');
eq(deviceOf(MAC, 1440), 'desktop', 'desktop Safari/Chrome');
eq(deviceOf(ANDROID_PHONE, 412), 'mobile', 'Android phone');
// Android tablets omit "Mobile"; without the negative lookahead they'd all be
// filed as mobile and the split would be meaningless on a youth-facing site.
eq(deviceOf(ANDROID_TABLET, 800), 'tablet', 'Android tablet (no "Mobile" token)');
eq(deviceOf('', 320), 'mobile', 'falls back to viewport width when UA is useless');
eq(deviceOf('', 0), 'desktop', 'no signal at all still returns something');

/* -------------------------------------------------------------- bots */
for (const ua of ['Googlebot/2.1', 'curl/8.4.0', 'HeadlessChrome/120',
                  'facebookexternalhit/1.1', 'AhrefsBot/7.0', 'Chrome-Lighthouse'])
  if (!BOT.test(ua)) { console.error(`  ✗ bot not filtered: ${ua}`); bad++; }
for (const ua of [IPHONE, MAC, ANDROID_PHONE])
  if (BOT.test(ua)) { console.error(`  ✗ real browser wrongly filtered as a bot: ${ua}`); bad++; }

/* ------------------------------------------------------------ hashes */
const A = visitorHash('1.2.3.4', IPHONE);
eq(visitorHash('1.2.3.4', IPHONE), A, 'same visitor, same day → same hash (so they count once)');
if (visitorHash('1.2.3.5', IPHONE) === A) { console.error('  ✗ different IPs collide'); bad++; }
if (visitorHash('1.2.3.4', MAC) === A) { console.error('  ✗ different user-agents collide'); bad++; }
if (/1\.2\.3\.4/.test(A)) { console.error('  ✗ raw IP present in the stored hash'); bad++; }
eq(A.length, 32, 'digest truncated to 32 chars');

if (bad) { console.error(`  ✗ ${bad} beacon check${bad === 1 ? '' : 's'} failed`); process.exit(1); }
console.log('  ✓ beacon normalisation: paths, referrers, devices, bots, hashing');
