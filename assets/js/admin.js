/* ==========================================================================
   Future Stars Foundation — /admin

   Auth: Supabase magic link. There is no signup path; a new account lands on
   "not authorised" until an existing admin sets profiles.is_admin = true.

   Reads go browser → Supabase directly using the ANON key, which authorises
   nothing on its own: every table has RLS, `anon` has no grants, and the read
   policies require public.is_admin(). Writes still only happen server-side via
   /api/submit — this page only ever reads, plus one narrow update to mark a
   message read.
   ========================================================================== */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let sb = null;            // supabase client
  let me = null;            // signed-in user
  let data = {};            // loaded tables
  let tab = 'registrations';
  let filter = '';

  /* ------------------------------------------------------------- helpers */
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const show = (id) => ['booting', 'login', 'denied', 'dash'].forEach((s) =>
    $('#' + s).classList.toggle('hidden', s !== id));

  const fmtDate = (v) => v ? new Date(v).toLocaleDateString('en-CA',
    { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const fmtDateTime = (v) => v ? new Date(v).toLocaleString('en-CA',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const ageFrom = (dob) => {
    if (!dob) return '';
    const d = new Date(dob), n = new Date();
    let a = n.getFullYear() - d.getFullYear();
    const m = n.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
    return a;
  };

  let toastT;
  const toast = (msg) => {
    const t = $('#toast');
    $('#toast-text').textContent = msg;
    t.classList.remove('translate-y-24', 'opacity-0');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.add('translate-y-24', 'opacity-0'), 4000);
  };

  const pill = (text, tone) => {
    const tones = {
      good: 'bg-teal/12 text-teal ring-teal/25',
      warn: 'bg-gold/12 text-gold ring-gold/25',
      bad:  'bg-coral/12 text-coral ring-coral/25',
      mute: 'bg-cream/8 text-cream/60 ring-cream/15'
    };
    return `<span class="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[0.68rem] font-bold ring-1 ${tones[tone] || tones.mute}">${esc(text)}</span>`;
  };

  /* --------------------------------------------------------- theme toggle */
  const htmlEl = document.documentElement;
  $('#theme-toggle')?.addEventListener('click', () => {
    const next = htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    htmlEl.setAttribute('data-theme', next);
    try { localStorage.setItem('fsf-theme', next); } catch (e) {}
  });

  /* ---------------------------------------------------------------- boot */
  async function boot() {
    let cfg;
    try {
      const r = await fetch('/api/config');
      // A non-JSON body means the function isn't there at all (local static
      // server, bad deploy) — surface that plainly instead of letting a JSON
      // parse error like "Unexpected token '<'" reach staff.
      const raw = await r.text();
      try { cfg = JSON.parse(raw); }
      catch { throw new Error('The admin API is not responding. If you are running locally, /api only exists on Vercel.'); }
      if (!r.ok) throw new Error(cfg.error || 'Admin is not configured.');
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error('Admin configuration is incomplete.');
    } catch (e) {
      $('#booting').innerHTML =
        `<div class="mx-auto max-w-md rounded-2xl border border-coral/25 bg-coral/8 p-6">
           <p class="font-semibold text-coral">Can't start the dashboard</p>
           <p class="mt-2 text-sm text-cream/70">${esc(e.message)}</p>
           <p class="mt-3 text-xs text-cream/50">
             Check that SUPABASE_URL and SUPABASE_ANON_KEY are set in Vercel, then redeploy.
           </p>
         </div>`;
      return;
    }

    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

    // Magic-link callback lands here with tokens in the URL hash; the client
    // consumes them, then we tidy the address bar so they aren't left in
    // history or copied into a shared link.
    const { data: { session } } = await sb.auth.getSession();
    if (location.hash.includes('access_token')) {
      history.replaceState(null, '', location.pathname);
    }

    sb.auth.onAuthStateChange((_e, s) => { if (!s) show('login'); });

    session ? afterLogin(session) : show('login');
  }

  /* --------------------------------------------------------------- login */
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#login-email').value.trim();
    const note = $('#login-note');
    const btn = $('#login-form button[type=submit]');

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      note.textContent = 'Please enter a valid email address.';
      note.className = 'mt-4 text-sm text-coral';
      return;
    }

    btn.disabled = true; btn.classList.add('opacity-70');
    note.textContent = 'Sending…';
    note.className = 'mt-4 text-sm text-cream/60';

    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: location.origin + location.pathname }
    });

    btn.disabled = false; btn.classList.remove('opacity-70');
    if (error) {
      note.textContent = error.message;
      note.className = 'mt-4 text-sm text-coral';
    } else {
      note.innerHTML = `Check <strong>${esc(email)}</strong> for your sign-in link. It expires shortly, so use it soon.`;
      note.className = 'mt-4 text-sm text-gold-lite';
    }
  });

  const signOut = async () => { await sb.auth.signOut(); location.reload(); };
  $('#signout').addEventListener('click', signOut);
  $('#denied-signout').addEventListener('click', signOut);

  /* ---------------------------------------------------------- admin gate */
  async function afterLogin(session) {
    me = session.user;
    $('#who').textContent = me.email;
    $('#who').classList.remove('hidden');

    // A brand-new account has no profiles row, so this correctly denies until
    // an existing admin flips the flag.
    const { data: profile } = await sb
      .from('profiles').select('is_admin').eq('id', me.id).maybeSingle();

    if (!profile?.is_admin) {
      $('#denied-email').textContent = me.email;
      show('denied');
      return;
    }

    $('#signout').classList.remove('hidden');
    show('dash');
    await load();
  }

  /* ----------------------------------------------------------- load data */
  async function load() {
    const q = (t, sel = '*') => sb.from(t).select(sel).order('created_at', { ascending: false });
    const [regs, parts, vols, partners, contacts, subs] = await Promise.all([
      q('registrations'), q('participants'), q('volunteers'),
      q('partnerships'), q('contacts'), q('subscribers')
    ]);

    const err = [regs, parts, vols, partners, contacts, subs].find((r) => r.error);
    if (err) { toast('Could not load: ' + err.error.message); return; }

    data = {
      registrations: regs.data || [],
      participants:  parts.data || [],
      volunteers:    vols.data || [],
      partnerships:  partners.data || [],
      contacts:      contacts.data || [],
      subscribers:   subs.data || []
    };

    // attach children to their registration for the expandable rows
    data.registrations.forEach((r) => {
      r._children = data.participants.filter((p) => p.registration_id === r.id);
    });

    renderStats();
    render();
  }

  $('#refresh').addEventListener('click', async () => { await load(); toast('Refreshed'); });

  /* --------------------------------------------------------------- stats */
  function renderStats() {
    const unread = data.contacts.filter((c) => !c.is_read).length;
    const needsScreening = data.volunteers.filter(
      (v) => v.criminal_record_check !== 'Yes' || !v.policy_agreed).length;
    const activeSubs = data.subscribers.filter((s) => !s.unsubscribed_at).length;

    const card = (label, value, sub, tone) => `
      <div class="rounded-2xl border border-cream/10 bg-ink-2/60 p-5">
        <div class="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold leading-none ${tone || 'text-gold'}">${value}</div>
        <p class="mt-2 text-[0.7rem] font-bold uppercase tracking-wider text-cream/70">${label}</p>
        ${sub ? `<p class="mt-1 text-xs text-cream/55">${sub}</p>` : ''}
      </div>`;

    $('#stats').innerHTML = [
      card('Registrations', data.registrations.length,
           `${data.participants.length} participant${data.participants.length === 1 ? '' : 's'}`),
      card('Volunteers', data.volunteers.length,
           needsScreening ? `${needsScreening} need screening` : 'all screened',
           needsScreening ? 'text-coral' : 'text-teal'),
      card('Partnerships', data.partnerships.length),
      card('Messages', data.contacts.length,
           unread ? `${unread} unread` : 'all read', unread ? 'text-coral' : 'text-gold'),
      card('Subscribers', activeSubs, 'active')
    ].join('');
  }

  /* ---------------------------------------------------------------- tabs */
  $$('.tab').forEach((b) => b.addEventListener('click', () => {
    tab = b.dataset.tab;
    $$('.tab').forEach((o) => {
      const on = o === b;
      o.classList.toggle('btn-gold', on);
      o.classList.toggle('btn-ghost', !on);
      o.setAttribute('aria-selected', String(on));
    });
    $('#search').value = ''; filter = '';
    render();
  }));

  $('#search').addEventListener('input', (e) => {
    filter = e.target.value.toLowerCase().trim();
    render();
  });

  /* -------------------------------------------------------------- tables */
  const TH = 'px-4 py-3 text-left text-[0.68rem] font-bold uppercase tracking-wider text-cream/55 whitespace-nowrap';
  const TD = 'px-4 py-3 align-top text-sm';

  const table = (headers, rowsHtml) => `
    <table class="w-full min-w-[720px] border-collapse">
      <thead class="border-b border-cream/10 bg-ink/40">
        <tr>${headers.map((h) => `<th class="${TH}">${h}</th>`).join('')}</tr>
      </thead>
      <tbody class="divide-y divide-cream/8">${rowsHtml}</tbody>
    </table>`;

  const empty = (msg) => `<p class="px-4 py-14 text-center text-sm text-cream/50">${msg}</p>`;

  /** Rows currently visible, after the search filter. */
  function visible() {
    const rows = {
      registrations: data.registrations,
      roster:        data.participants,
      volunteers:    data.volunteers,
      partnerships:  data.partnerships,
      contacts:      data.contacts,
      subscribers:   data.subscribers
    }[tab] || [];
    if (!filter) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(filter));
  }

  function render() {
    const rows = visible();
    $('#count').textContent = `${rows.length} ${rows.length === 1 ? 'record' : 'records'}`;
    const panel = $('#panel');

    if (!rows.length) {
      panel.innerHTML = empty(filter ? 'Nothing matches that search.' : 'Nothing here yet.');
      return;
    }

    if (tab === 'registrations') {
      panel.innerHTML = table(
        ['Received', 'Guardian', 'Contact', 'Children', 'Status'],
        rows.map((r) => `
          <tr class="cursor-pointer transition-colors hover:bg-cream/[0.03]" data-expand="${r.id}">
            <td class="${TD} whitespace-nowrap text-cream/70">${fmtDate(r.created_at)}</td>
            <td class="${TD}">
              <div class="font-semibold">${esc(r.guardian_name)}</div>
              <div class="text-xs text-cream/55">${esc(r.guardian_relationship)}</div>
            </td>
            <td class="${TD}">
              <a href="mailto:${esc(r.guardian_email)}" class="text-gold-lite hover:underline">${esc(r.guardian_email)}</a>
              <div class="text-xs text-cream/55">${esc(r.guardian_phone)}</div>
            </td>
            <td class="${TD}">${r._children.length}</td>
            <td class="${TD}">${pill(r.status, r.status === 'confirmed' ? 'good' : r.status === 'new' ? 'warn' : 'mute')}</td>
          </tr>
          <tr class="hidden bg-ink/50" data-detail="${r.id}">
            <td class="px-4 pb-5 pt-1" colspan="5">
              <div class="grid gap-3 sm:grid-cols-2">
                ${r._children.map((c) => `
                  <div class="rounded-xl border border-cream/10 bg-ink-2/60 p-4">
                    <div class="font-semibold">${esc(c.child_name)} <span class="text-cream/55">· age ${ageFrom(c.child_dob)}</span></div>
                    <div class="mt-1 text-xs text-cream/65">${esc(c.program)}</div>
                    <div class="mt-1 text-xs text-cream/50">DOB ${fmtDate(c.child_dob)}${c.school ? ' · ' + esc(c.school) : ''}</div>
                    ${c.medical ? `<div class="mt-2 rounded-lg bg-coral/10 px-2.5 py-1.5 text-xs text-coral">⚠ ${esc(c.medical)}</div>` : ''}
                    <div class="mt-2 text-[0.68rem] text-cream/50">Photo consent: ${c.photo_consent ? 'yes' : 'no'}</div>
                  </div>`).join('')}
              </div>
              <div class="mt-3 text-xs text-cream/55">
                Emergency: <strong class="text-cream/80">${esc(r.emergency_name)}</strong> · ${esc(r.emergency_phone)}
                ${r.emergency_relationship ? ' · ' + esc(r.emergency_relationship) : ''}<br/>
                Address: ${esc(r.guardian_street)}, ${esc(r.guardian_city)} ${esc(r.guardian_postal)}
              </div>
            </td>
          </tr>`).join('')
      );
      $$('[data-expand]', panel).forEach((tr) => tr.addEventListener('click', () => {
        $(`[data-detail="${tr.dataset.expand}"]`, panel)?.classList.toggle('hidden');
      }));

    } else if (tab === 'roster') {
      // Grouped by program — the view staff actually need on the day.
      const byProgram = {};
      rows.forEach((p) => (byProgram[p.program] ||= []).push(p));
      panel.innerHTML = Object.entries(byProgram).sort().map(([program, kids]) => `
        <div class="border-b border-cream/10 p-5 last:border-b-0">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3 class="text-base">${esc(program)}</h3>
            ${pill(kids.length + (kids.length === 1 ? ' child' : ' children'), 'warn')}
          </div>
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            ${kids.map((c) => {
              const g = data.registrations.find((r) => r.id === c.registration_id);
              return `<div class="rounded-xl border border-cream/10 bg-ink-2/50 p-3 text-sm">
                <div class="font-semibold">${esc(c.child_name)} <span class="text-cream/50">· ${ageFrom(c.child_dob)}</span></div>
                ${g ? `<div class="mt-1 text-xs text-cream/55">${esc(g.guardian_name)} · ${esc(g.guardian_phone)}</div>
                       <div class="text-xs text-cream/45">ICE: ${esc(g.emergency_name)} ${esc(g.emergency_phone)}</div>` : ''}
                ${c.medical ? `<div class="mt-2 rounded-lg bg-coral/10 px-2 py-1 text-xs text-coral">⚠ ${esc(c.medical)}</div>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>`).join('');

    } else if (tab === 'volunteers') {
      panel.innerHTML = table(
        ['Applied', 'Name', 'Contact', 'Record check', 'Policy', 'Interests'],
        rows.map((v) => `
          <tr class="transition-colors hover:bg-cream/[0.03]">
            <td class="${TD} whitespace-nowrap text-cream/70">${fmtDate(v.created_at)}</td>
            <td class="${TD} font-semibold">${esc(v.name)}</td>
            <td class="${TD}">
              <a href="mailto:${esc(v.email)}" class="text-gold-lite hover:underline">${esc(v.email)}</a>
              <div class="text-xs text-cream/55">${esc(v.phone)}</div>
            </td>
            <td class="${TD}">${pill(v.criminal_record_check || 'not stated',
                                     v.criminal_record_check === 'Yes' ? 'good' : 'bad')}</td>
            <td class="${TD}">${pill(v.policy_agreed ? 'agreed' : 'not agreed', v.policy_agreed ? 'good' : 'bad')}</td>
            <td class="${TD} text-xs text-cream/65">${esc((v.interests || []).join(', ')) || '—'}</td>
          </tr>`).join('')
      );

    } else if (tab === 'partnerships') {
      panel.innerHTML = table(
        ['Received', 'Organization', 'Contact', 'Type', 'Status'],
        rows.map((p) => `
          <tr class="transition-colors hover:bg-cream/[0.03]">
            <td class="${TD} whitespace-nowrap text-cream/70">${fmtDate(p.created_at)}</td>
            <td class="${TD} font-semibold">${esc(p.org_name)}</td>
            <td class="${TD}">
              ${esc(p.contact_person)}
              <div class="text-xs"><a href="mailto:${esc(p.email)}" class="text-gold-lite hover:underline">${esc(p.email)}</a></div>
            </td>
            <td class="${TD} text-xs text-cream/65">${esc(p.partnership_type) || '—'}</td>
            <td class="${TD}">${pill(p.status, p.status === 'active' ? 'good' : 'warn')}</td>
          </tr>`).join('')
      );

    } else if (tab === 'contacts') {
      panel.innerHTML = table(
        ['Received', 'From', 'Message', ''],
        rows.map((c) => `
          <tr class="transition-colors hover:bg-cream/[0.03] ${c.is_read ? '' : 'bg-gold/[0.04]'}">
            <td class="${TD} whitespace-nowrap text-cream/70">${fmtDateTime(c.created_at)}</td>
            <td class="${TD}">
              <div class="font-semibold">${esc(c.first_name)} ${esc(c.last_name)}</div>
              <a href="mailto:${esc(c.email)}" class="text-xs text-gold-lite hover:underline">${esc(c.email)}</a>
            </td>
            <td class="${TD} max-w-md whitespace-pre-wrap text-cream/75">${esc(c.message)}</td>
            <td class="${TD}">
              <button class="btn btn-ghost !px-3 !py-1.5 !text-[0.68rem]" data-read="${c.id}" data-state="${c.is_read}">
                ${c.is_read ? 'Mark unread' : 'Mark read'}
              </button>
            </td>
          </tr>`).join('')
      );
      $$('[data-read]', panel).forEach((b) => b.addEventListener('click', async () => {
        const next = b.dataset.state !== 'true';
        const { error } = await sb.from('contacts').update({ is_read: next }).eq('id', b.dataset.read);
        if (error) return toast('Could not update: ' + error.message);
        const row = data.contacts.find((c) => c.id === b.dataset.read);
        if (row) row.is_read = next;
        renderStats(); render();
      }));

    } else if (tab === 'subscribers') {
      panel.innerHTML = table(
        ['Subscribed', 'Email', 'Source', 'Status'],
        rows.map((s) => `
          <tr class="transition-colors hover:bg-cream/[0.03]">
            <td class="${TD} whitespace-nowrap text-cream/70">${fmtDate(s.consented_at)}</td>
            <td class="${TD}"><a href="mailto:${esc(s.email)}" class="text-gold-lite hover:underline">${esc(s.email)}</a></td>
            <td class="${TD} text-xs text-cream/65">${esc(s.consent_source)}</td>
            <td class="${TD}">${s.unsubscribed_at ? pill('unsubscribed', 'mute') : pill('active', 'good')}</td>
          </tr>`).join('')
      );
    }
  }

  /* ----------------------------------------------------------- CSV export */
  $('#export').addEventListener('click', () => {
    const rows = visible();
    if (!rows.length) return toast('Nothing to export.');

    // Registrations export flattens to one row per CHILD — that's the shape
    // staff actually want in a spreadsheet.
    let out = rows;
    if (tab === 'registrations') {
      out = rows.flatMap((r) => (r._children.length ? r._children : [{}]).map((c) => ({
        received: r.created_at, guardian: r.guardian_name, relationship: r.guardian_relationship,
        email: r.guardian_email, phone: r.guardian_phone,
        address: `${r.guardian_street}, ${r.guardian_city} ${r.guardian_postal}`,
        emergency: `${r.emergency_name} ${r.emergency_phone}`,
        child: c.child_name || '', dob: c.child_dob || '', age: c.child_dob ? ageFrom(c.child_dob) : '',
        program: c.program || '', school: c.school || '', medical: c.medical || '',
        photo_consent: c.photo_consent ? 'yes' : 'no', status: r.status
      })));
    } else {
      out = rows.map(({ _children, ...rest }) => rest);
    }

    const cols = [...new Set(out.flatMap((o) => Object.keys(o)))];
    const cell = (v) => {
      const s = Array.isArray(v) ? v.join('; ') : String(v ?? '');
      // Quote when needed; double any embedded quotes.
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [cols.join(','), ...out.map((o) => cols.map((c) => cell(o[c])).join(','))].join('\r\n');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `fsf-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(`Exported ${out.length} row${out.length === 1 ? '' : 's'}`);
  });

  boot();
})();
