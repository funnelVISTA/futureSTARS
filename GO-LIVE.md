# Go-Live Checklist — Future Stars Foundation

Running list of everything that must be settled **before this replaces the live
WordPress site** at futurestarsfoundation.com.

Kept current as work progresses. Anything discovered mid-build gets added here
rather than mentioned once and lost.

**Status legend:** 🔴 blocks launch · 🟠 before real traffic · 🟡 waiting on FSF · 🟢 polish

---

## 🔴 Blocks launch

| # | Item | Why it matters |
|---|---|---|
| 1 | **Don't point the domain until Stripe ships** | The WordPress donation page is FSF's **only** card-payment route today. Cutting over first removes card giving entirely. |
| 2 | **Privacy policy page** | The site collects minors' names, DOB, addresses and medical notes. BC PIPA/PIPEDA expect a policy. Currently declined by client — revisit before launch. |
| 3 | **Supabase Free → Pro** (~$25/mo) | Free projects **pause when idle**, which would take every form down. Pro also gives daily backups — needed on children's data. |
| 4 | **Vercel Hobby → Pro** (~$20/mo) | Hobby is non-commercial per Vercel's ToS. This is paid client work. |
| 5 | **Update OG/meta URLs** | `og:image` and `og:url` are absolute and point at `futurestarsfoundation.vercel.app`. Link previews break at cutover unless updated. |

## 🟠 Before real traffic

| # | Item | Why it matters |
|---|---|---|
| 6 | **Notification email** — set `RESEND_API_KEY`, `NOTIFY_EMAIL`, `NOTIFY_FROM` | ✅ **Code done.** Branded HTML to staff (reply-to = submitter) + confirmation to the submitter. **Waiting only on a Resend account + keys.** Until then nobody is told when a registration arrives. |
| 7 | **Spam protection** — Turnstile | ✅ **Code done, both halves.** Needs **two** values set together: `SITE_KEY` in `assets/js/turnstile.js` (public) **and** `TURNSTILE_SECRET_KEY` in Vercel. ⚠️ **Setting only the secret breaks every form** — the server would reject submissions with no token. Until both are set it no-ops safely. |
| 8 | **Admin allowlist** | ✅ **Built.** `admin_allowlist` table gates the magic link server-side; allowlisted users are auto-provisioned as admins on first sign-in. `mailmofixit@gmail.com` seeded. Add FSF staff via migration 003's snippet. |
| 8b | **Disable public signups** in Supabase → Auth → Providers | Belt-and-braces behind the allowlist: stops any auth account being created by someone who bypasses the UI gate. |
| 8c | **Point Supabase Auth at Resend SMTP** | Supabase's built-in auth email is rate-limited and often lands in spam. If a sign-in link doesn't arrive, staff can't log in. Reuse the Resend account from #6. |
| 9 | **Sender domain DNS** (SPF/DKIM) | Notification email lands in spam without it. |
| 10 | **Replace the 7 program images** | Current ones are 325×250 stock — soft on modern screens, and several show no youth of African descent, which misrepresents who FSF serves. |
| 11 | **Analytics** — Plausible (~$9/mo, cookieless) | Chosen over GA4 to avoid forcing a cookie banner onto a youth-facing site. |
| 12 | **Preserve SEO at cutover** | Existing Google Search Console / Analytics history for futurestarsfoundation.com. Set up redirects for the old WordPress URLs. |

## 🟡 Waiting on FSF (see `Discovery_Future_Stars_Foundation.pdf`)

| # | Item | Blocks |
|---|---|---|
| 13 | **Is FSF a CRA-registered charity?** (number ending `RR0001`) | Whether the donate page may mention **tax receipts at all**. Site says "non-profit" with no number anywhere — a non-profit legally *cannot* issue receipts. **Do not imply otherwise.** |
| 14 | **Program fees** — price per program | Phase 2 Stripe |
| 15 | **Stripe account** in FSF's legal entity + bank | Phase 2. Money must never route through a FunnelVista account. |
| 16 | **Bursary / subsidy path?** | FSF serves low-income and refugee youth — a hard paywall may exclude the people the programs exist for. |
| 17 | **Real impact numbers** | The single biggest donor-trust gap. Site currently publishes **zero** statistics; counters only animate what the content supports (7 programs, 2 regions). Nothing has been invented. |
| 18 | **Photo consent** for youth currently shown on the site | Legal exposure |
| 19 | **`home-about.png` licence** | Shows faint tiled marks resembling an unlicensed stock watermark. Excluded from the build; kept on disk for review. |
| 20 | **Blog decision** — keep WordPress, build into `/admin`, or drop | 4 links still point at the old WordPress site |
| 21 | **Age range confirmation** | Built to 3–19 as two constants; widening is a one-line change |
| 22 | **Contact form routing** | Which inbox(es) submissions go to |

## 🟢 Polish / later

| # | Item |
|---|---|
| 23 | **Retention job** — purge registrations/contacts/subscribers at 12 months (FSF's instruction). ⚠️ **Payment records must NOT follow this rule** — CRA generally requires ~6 years. Revisit when Stripe lands. |
| 24 | Program capacity + waitlist (pending FSF's answer on caps) |
| 25 | Newsletter → Mailchimp/Brevo sync (consent trail is already being captured) |
| 26 | File upload for the partnership form (field exists, not wired) |
| 27 | Contact link is missing from the mobile menu — currently reachable only by scrolling or via the footer |

## 🔵 Admin dashboard backlog (menu — client to choose, nothing agreed yet)

The dashboard today is a **viewer**: it reads and exports. The main upgrade
available is making it a **working tool** — staff acting on records rather than
just reading them. `status` and `staff_notes` columns already exist and are
unused by the UI.

**Recommended first batch** (28, 29, 30, 34 — all low effort, two are safeguarding wins):

| # | Item | Value | Effort |
|---|---|---|---|
| 28 | **Photo consent report** — one list of who may *not* be photographed. Consent is captured per child but buried; staff need it before posting event photos. Highest-value item here. | High | Low |
| 29 | **Medical & allergy sheet, per program** — printable, for coaches on the field. Data already collected, just not in usable form. | High | Low |
| 30 | **Registration workflow** — confirm / waitlist / cancel in one click. Schema supports it; UI only displays it. | High | Low |
| 31 | **Auto-generated impact numbers** — children served, by program, by age, over time. Fills the biggest gap on the public site (no published stats; none invented). Feeds donor + funder conversations. | High | Medium |
| 32 | **Volunteer screening tracker** — staff-verified flag + CRC **expiry dates**. Currently only shows the applicant's self-reported answer. Highest-stakes record held. | High | Medium |
| 33 | **Attendance check-in** per session — safeguarding + funder reporting. *Hold until FSF confirms they'd use it.* | High | Medium |
| 34 | **Staff notes** on any record — fields already exist. | Medium | Low |
| 35 | **Manage admins in-app** — add/remove allowlist without SQL. | Medium | Low |
| 36 | **Duplicate detection** — same child registered twice. | Medium | Low |
| 37 | **Charts** — registrations over time / by program. Good for board meetings. | Medium | Low |
| 38 | **Bulk email a program's parents** ("practice cancelled"). *Hold until FSF confirms they'd use it.* | High | Medium |
| 39 | **Capacity + auto-waitlist** per program. Duplicate of #24 — pending FSF's answer on caps. | High | Medium |
| 40 | **Funder / grant export** — demographic breakdowns for applications. | High at grant time | Medium |
| 41 | **Retention purge tool** with preview of what will be deleted. Pairs with #23. | Medium | Medium |
| 42 | **Audit log** — who viewed/changed what. Genuinely relevant for children's data. | Medium | Medium |
| 43 | Payment status, outstanding fees, donation metrics | High | **Blocked on Phase 2 (Stripe)** |

**On the Messages tab (keep, don't invest):** it surfaces the `contacts` table,
and right now it's the *only* way to see a contact submission because email
notifications aren't configured yet (#6). Once they are, staff will reply from
their inbox and this tab drops in value — but keep it: inboxes are personal and
get deleted or leave with the person, the database is the durable shared record.

**Already scoped but genuinely blocked, not forgotten:** donation metrics
(Phase 2), traffic/conversion funnel (Plausible not set up), program capacity
(FSF hasn't answered caps).

---

## ⚠️ Gotchas to remember

- **Every new Supabase table needs `grant … to service_role`.** The project has
  "Automatically expose new tables" disabled (deliberately — safer default), so a
  new table is invisible to the Data API until explicitly granted. This bit us
  once: `admin_allowlist` was created without a grant and every sign-in check
  returned 500. It failed closed, which is right, but sign-in was impossible.
- **Supabase Auth → URL Configuration** must list the live site. It ships
  defaulted to `http://localhost:3000`, and any `emailRedirectTo` not on the
  Redirect URLs allowlist is ignored in favour of Site URL — so sign-in links
  land on a dead localhost page. Add the real domain here at cutover too.
- **Magic links are single-use and email scanners pre-fetch them**, which
  consumes the token and produces `otp_expired` on a link the user never
  clicked. If it recurs, switch from click-link to a 6-digit code.
- The Supabase SQL Editor only shows the **last** statement's result set. Write
  multi-check verification queries as a single `union all`.

## ✅ Done

- Site rebuilt, deployed, push-to-deploy working
- Light/dark theme — audited, 0 contrast failures in both themes
- `/register` page with multi-child support and server-side age validation
- Phase 1 backend: Supabase (ca-central-1), 7 tables, RLS on all, admin-only reads
- `api/submit.js` — all 4 forms writing to the database, **verified end-to-end against live Supabase**
- Honeypot spam filter (0 spam rows persisted in testing)
- CASL consent trail on newsletter opt-in (timestamp, source, IP)
- Build guards: JS syntax, runtime smoke test, `vercel.json` schema validation
