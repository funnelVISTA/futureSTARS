/* ==========================================================================
   Future Stars Foundation — interactions
   All copy in PROGRAMS / POSTS is taken verbatim from futurestarsfoundation.com
   ========================================================================== */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------------------------------------------------------------- data */
  const PROGRAMS = [
    {
      n: '01', img: 'program1.png', accent: 'gold', icon: '⚽',
      title: 'Sports Development & Unity Programs',
      body: 'We utilize the power of sport to build discipline, teamwork, and confidence in youth. Our programs provide access to structured training, experienced coaches, essential equipment and participation in local and regional tournaments.'
    },
    {
      n: '02', img: 'program2.png', accent: 'teal', icon: '📚',
      title: 'Education & Career Support',
      body: 'We help youth excel in school and prepare them for the future through academic support, tutoring, scholarships, and school supplies. Beyond the classroom, we offer vocational training, digital skills development, career mentorship, and post-secondary guidance.'
    },
    {
      n: '03', img: 'program3.png', accent: 'coral', icon: '🎒',
      title: 'Basic Needs and Welfare Support Services',
      body: 'We ensure that the vulnerable youth have access to the essentials they need to live and learn with dignity. Our support includes food assistance, clothing, hygiene items, and temporary housing when needed.'
    },
    {
      n: '04', img: 'program4.png', accent: 'violet', icon: '🌟',
      title: 'Mentorship, Leadership & Life Skills Development',
      body: 'Youth in our programs are supported by caring mentors who offer guidance, encouragement, and consistent support. Our initiatives focus on building confidence, resilience, strong decision-making, and a sense of purpose.'
    },
    {
      n: '05', img: 'program5.png', accent: 'sky', icon: '🌍',
      title: 'Settlement & Cultural Integration',
      body: 'We provide support to newcomers and immigrant families as they adjust to life in Canada through social programs, peer connections, and cultural exchange.'
    },
    {
      n: '06', img: 'program6.png', accent: 'gold', icon: '🏡',
      title: 'Community Development',
      body: 'Our community-driven initiatives create safe, inclusive spaces where young people can grow, connect, and contribute. We organize outreach projects, local events, youth training camps, and wellness programs.'
    },
    {
      n: '07', img: 'program7.png', accent: 'teal', icon: '🏗️',
      title: 'Infrastructure & International Outreach: Home Centre & Dormitory',
      body: 'To support long-term impact, FSF is developing physical spaces that provide safety, structure, and opportunity. In Canada, our planned “Home Center” will serve as an after-school hub for sports, recreation, learning, and mentorship. In Sub-Saharan Africa, we are building a residential training facility — a dormitory-style environment where young athletes and students can live, train, and grow in a supportive setting.'
    }
  ];

  const POSTS = [
    {
      img: 'blog1.jpg', date: '2025-10-16', dateLabel: 'Oct 16, 2025',
      title: 'Coach Bobson in Action — Building Brighter Futures Through the Game We Love',
      body: 'Coach Bobson guides young players during a Future Stars Foundation training session — helping them grow in skill, discipline, and self-belief.',
      href: 'https://futurestarsfoundation.com/2025/10/16/coach-bobson-in-action-building-brighter-futures-through-the-game-we-love/'
    },
    {
      img: 'blog2.jpg', date: '2025-10-16', dateLabel: 'Oct 16, 2025',
      title: 'Highlights from the 2025 African Canadian Soccer & Cultural Association (ACSCA) event',
      body: 'Featured here is the Sierra Leonean Soccer Team, proudly sponsored by FSF Founder Coach Bobson Sesay. The team finished second place in the tournament — a strong showing of skill, teamwork, and dedication.',
      href: 'https://futurestarsfoundation.com/2025/10/16/highlights-from-the-2025-african-canadian-soccer-cultural-association-acsca-event/'
    },
    {
      img: 'blog3.jpg', date: '2025-10-07', dateLabel: 'Oct 7, 2025',
      title: 'Exciting moments from the 2023 African Canadian Soccer & Cultural Association (ACSCA) tournament!',
      body: 'The Sierra Leonean Team, proudly supported by FSF Founder Coach Bobson Sesay. The team finished first place — an incredible accomplishment and proud moment for the community.',
      href: 'https://futurestarsfoundation.com/2025/10/07/hello-world/'
    }
  ];

  const ACCENT = {
    gold:   { ring: 'ring-gold/30',   bg: 'bg-gold/12',   text: 'text-gold' },
    teal:   { ring: 'ring-teal/30',   bg: 'bg-teal/12',   text: 'text-teal' },
    coral:  { ring: 'ring-coral/30',  bg: 'bg-coral/12',  text: 'text-coral' },
    violet: { ring: 'ring-violet/30', bg: 'bg-violet/12', text: 'text-violet' },
    sky:    { ring: 'ring-sky/30',    bg: 'bg-sky/12',    text: 'text-sky' }
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ------------------------------------------------------- render: cards */
  const grid = $('#program-grid');
  if (grid) {
    grid.innerHTML = PROGRAMS.map((p, i) => {
      const a = ACCENT[p.accent];
      return `
      <article class="card group flex flex-col" data-reveal style="--d:${(i % 3) * 90}ms" data-tilt>
        <div class="relative aspect-[13/10] overflow-hidden">
          <img src="assets/img/${p.img}" alt="" loading="lazy" decoding="async" width="325" height="250"
               class="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110" />
          <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-2 via-ink-2/25 to-transparent"></div>
          <span class="absolute left-4 top-4 rounded-lg bg-ink/70 px-2.5 py-1 font-display text-xs font-extrabold tracking-widest text-gold backdrop-blur-md">${p.n}</span>
          <span class="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl ${a.bg} text-lg ring-1 ${a.ring} backdrop-blur-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" aria-hidden="true">${p.icon}</span>
        </div>

        <div class="flex flex-1 flex-col p-6">
          <h3 class="text-lg leading-snug">${esc(p.title)}</h3>
          <p class="mt-3 flex-1 text-sm leading-relaxed text-cream/60 line-clamp-3">${esc(p.body)}</p>
          <button class="mt-5 inline-flex items-center gap-2 self-start text-sm font-bold ${a.text} transition-all hover:gap-3.5"
                  data-modal-open="program" data-index="${i}">
            Learn More
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      </article>`;
    }).join('');
  }

  const bgrid = $('#blog-grid');
  if (bgrid) {
    bgrid.innerHTML = POSTS.map((p, i) => `
      <a href="${p.href}" target="_blank" rel="noopener" class="card group flex flex-col" data-reveal style="--d:${i * 110}ms" data-tilt>
        <div class="relative aspect-[16/11] overflow-hidden">
          <img src="assets/img/${p.img}" alt="" loading="lazy" decoding="async"
               class="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110" />
          <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-2 via-transparent to-transparent"></div>
        </div>
        <div class="flex flex-1 flex-col p-6">
          <time datetime="${p.date}" class="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-gold">${p.dateLabel}</time>
          <h3 class="mt-3 text-base leading-snug transition-colors group-hover:text-gold-lite">${esc(p.title)}</h3>
          <p class="mt-3 flex-1 text-sm leading-relaxed text-cream/60 line-clamp-3">${esc(p.body)}</p>
          <span class="mt-5 inline-flex items-center gap-2 text-sm font-bold text-gold transition-all group-hover:gap-3.5">
            Read post
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </span>
        </div>
      </a>`).join('');
  }

  /* ------------------------------------------------------------- reveals */
  // IntersectionObserver drives [data-reveal]; independent of GSAP so the page
  // still animates if the vendor bundles fail to load.
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  $$('[data-reveal]').forEach((el) => revealIO.observe(el));

  /* ------------------------------------------------------------ counters */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      countIO.unobserve(el);
      const target = parseInt(el.dataset.count, 10);
      if (reduced) { el.textContent = target; return; }
      const dur = 1400, t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* --------------------------------------------------------- theme toggle */
  // The stored theme is applied by an inline script in <head> before paint;
  // this only handles switching. Dark is the default when nothing is stored.
  const themeBtn = $('#theme-toggle');
  const htmlEl = document.documentElement;

  const syncThemeBtn = () => {
    const light = htmlEl.getAttribute('data-theme') === 'light';
    themeBtn?.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    // keep the browser chrome in step with the page
    $('meta[name="theme-color"]')?.setAttribute('content', light ? '#fbf9f3' : '#0b0b0f');
  };

  themeBtn?.addEventListener('click', () => {
    const next = htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    if (!reduced) {
      htmlEl.classList.add('theming');
      clearTimeout(themeBtn._t);
      themeBtn._t = setTimeout(() => htmlEl.classList.remove('theming'), 360);
    }
    htmlEl.setAttribute('data-theme', next);
    try { localStorage.setItem('fsf-theme', next); } catch (e) { /* private mode */ }
    syncThemeBtn();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  });
  syncThemeBtn();

  /* ----------------------------------------------------------------- nav */
  const nav = $('#nav'), navbar = $('#navbar'), navlogos = $$('.navlogo');
  const onScroll = () => {
    const y = window.scrollY;
    // shrink + solidify
    navbar.classList.toggle('!py-2', y > 60);
    navbar.classList.toggle('bg-ink/85', y > 60);
    navbar.classList.toggle('shadow-2xl', y > 60);
    navbar.classList.toggle('border-cream/20', y > 60);
    navlogos.forEach((el) => el.classList.toggle('!h-9', y > 60));
    nav.classList.toggle('!mt-0', y > 60);

    // progress
    const h = document.documentElement.scrollHeight - window.innerHeight;
    $('#progress').style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // scrollspy
  const navLinks = $$('[data-nav]');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = '#' + e.target.id;
      navLinks.forEach((l) => l.setAttribute('aria-current', String(l.getAttribute('href') === id)));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['home', 'about', 'programs', 'donate', 'involved', 'blogs', 'contact']
    .map((id) => document.getElementById(id)).filter(Boolean).forEach((s) => spy.observe(s));

  /* --------------------------------------------------------- mobile menu */
  const burger = $('#burger'), mob = $('#mobilemenu');
  let mobOpen = false;
  const setMob = (open) => {
    mobOpen = open;
    mob.classList.toggle('translate-y-[-100%]', !open);
    mob.classList.toggle('pointer-events-none', !open);
    mob.classList.toggle('invisible', !open);
    // aria-expanded is the single source of truth — CSS animates the burger into
    // an X off the same attribute, so there is no inline transform to keep in sync.
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger?.addEventListener('click', () => setMob(!mobOpen));
  $$('.mob-link', mob).forEach((l) => l.addEventListener('click', () => setMob(false)));
  mob?.querySelector('.btn')?.addEventListener('click', () => setMob(false));

  /* -------------------------------------------------------- card pointer */
  // feeds the radial gold bloom on .card::before
  $$('.card').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`);
      c.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // Pointer capability check — the 3D card tilt still needs it. (The custom
  // cursor was removed in favour of the native one.)
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* --------------------------------------------------------------- toast */
  let toastT;
  const toast = (msg) => {
    const t = $('#toast');
    $('#toast-text').textContent = msg;
    t.classList.remove('translate-y-24', 'opacity-0');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.add('translate-y-24', 'opacity-0'), 4200);
  };

  /* -------------------------------------------------------------- modals */
  const root = $('#modal-root'), panel = $('#modal-panel'), backdrop = $('#modal-backdrop');
  const mTitle = $('#modal-title'), mEyebrow = $('#modal-eyebrow'), mBody = $('#modal-body');
  let lastFocus = null;

  const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function openModal({ eyebrow, title, html }) {
    lastFocus = document.activeElement;
    mEyebrow.textContent = eyebrow;
    mTitle.textContent = title;
    mBody.innerHTML = html;
    root.classList.remove('hidden');
    root.classList.add('pointer-events-auto');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      backdrop.classList.remove('opacity-0');
      panel.classList.remove('opacity-0', 'translate-y-6', 'scale-[0.98]');
    });
    setTimeout(() => ($(FOCUSABLE, mBody) || $('#modal-close'))?.focus(), 60);
  }

  function closeModal() {
    backdrop.classList.add('opacity-0');
    panel.classList.add('opacity-0', 'translate-y-6', 'scale-[0.98]');
    document.body.style.overflow = '';
    setTimeout(() => {
      root.classList.add('hidden');
      root.classList.remove('pointer-events-auto');
      mBody.innerHTML = '';
      lastFocus?.focus();
    }, 320);
  }

  $('#modal-close').addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (root.classList.contains('hidden')) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;
    // focus trap
    const f = $$(FOCUSABLE, panel).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* --------------------------------------------------- modal: templates */
  const programModal = (i) => {
    const p = PROGRAMS[i];
    return {
      eyebrow: `Program ${p.n}`,
      title: p.title,
      html: `
        <img src="assets/img/${p.img}" alt="" class="mb-6 aspect-[13/6] w-full rounded-2xl object-cover" loading="lazy" />
        <p class="text-pretty leading-relaxed text-cream/75">${esc(p.body)}</p>
        <div class="mt-8 flex flex-wrap gap-3">
          <button class="btn btn-gold !py-3 !text-[0.85rem]" data-modal-open="volunteer">Volunteer for this</button>
          <a href="#donate" class="btn btn-ghost !py-3 !text-[0.85rem]" data-modal-close>Support this program</a>
        </div>`
    };
  };

  const volunteerModal = () => ({
    eyebrow: 'Get Involved',
    title: 'Volunteer Sign-Up',
    html: `
    <form data-form="volunteer" novalidate>
      <p class="mb-7 text-sm leading-relaxed text-cream/60">
        Join our team of volunteers supporting youth mentorship, community events, and sports programs.
      </p>

      <div class="grid gap-5 sm:grid-cols-2">
        <div><label class="label" for="v-name">Name <span class="req">*</span></label><input id="v-name" name="name" class="field" required autocomplete="name" /></div>
        <div><label class="label" for="v-dob">Date of birth <span class="req">*</span></label><input id="v-dob" name="dob" type="date" class="field" required /></div>
        <div><label class="label" for="v-phone">Phone <span class="req">*</span></label><input id="v-phone" name="phone" type="tel" class="field" required autocomplete="tel" /></div>
        <div><label class="label" for="v-email">Email address <span class="req">*</span></label><input id="v-email" name="email" type="email" class="field" required autocomplete="email" /></div>
      </div>

      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <div class="sm:col-span-2"><label class="label" for="v-street">Street address <span class="req">*</span></label><input id="v-street" name="street" class="field" required autocomplete="street-address" /></div>
        <div><label class="label" for="v-apt">Apartment, suite, etc</label><input id="v-apt" name="apt" class="field" /></div>
        <div><label class="label" for="v-city">City</label><input id="v-city" name="city" class="field" autocomplete="address-level2" /></div>
        <div><label class="label" for="v-prov">State/Province</label><input id="v-prov" name="province" class="field" autocomplete="address-level1" /></div>
        <div><label class="label" for="v-zip">ZIP / Postal code</label><input id="v-zip" name="zip" class="field" autocomplete="postal-code" /></div>
        <div class="sm:col-span-2"><label class="label" for="v-country">Country</label><input id="v-country" name="country" class="field" autocomplete="country-name" value="Canada" /></div>
        <div class="sm:col-span-2"><label class="label" for="v-emerg">Emergency contact name &amp; phone</label><input id="v-emerg" name="emergency" class="field" /></div>
      </div>

      <h4 class="mt-9 mb-4 text-lg">Volunteer Interests</h4>
      <fieldset data-req-group>
        <legend class="label">Which area(s) would you like to volunteer in? <span class="req">*</span></legend>
        <div class="grid gap-2 sm:grid-cols-2">
          ${['Sports & Coaching Support','Mentorship & Youth Programs','Education & Tutoring','Tournaments & Events','Community Outreach & Engagement','Administration / Fundraising','Photography / Media / Social Media','Other']
            .map((o) => `
            <label class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-cream/12 px-3 py-2.5 text-sm transition-colors hover:border-gold/50">
              <input type="checkbox" name="interests" value="${esc(o)}" class="h-4 w-4 accent-[#e3a812]" />
              <span>${esc(o)}</span>
            </label>`).join('')}
        </div>
      </fieldset>

      <div class="mt-5"><label class="label" for="v-why">Why would you like to volunteer with FSF? <span class="req">*</span></label><textarea id="v-why" name="why" rows="3" class="field resize-y" required></textarea></div>
      <div class="mt-5"><label class="label" for="v-skills">Relevant skills or experience <span class="req">*</span></label><textarea id="v-skills" name="skills" rows="3" class="field resize-y" required></textarea></div>

      <fieldset class="mt-5" data-req-group>
        <legend class="label">Availability <span class="req">*</span></legend>
        <div class="flex flex-wrap gap-2">
          ${['Weekdays','Weekends','Evenings','Occasional Events'].map((o) => `
            <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-cream/12 px-3 py-2.5 text-sm transition-colors hover:border-gold/50">
              <input type="checkbox" name="availability" value="${esc(o)}" class="h-4 w-4 accent-[#e3a812]" />
              <span>${esc(o)}</span>
            </label>`).join('')}
        </div>
      </fieldset>

      <h4 class="mt-9 mb-4 text-lg">Screening &amp; Consent</h4>
      <fieldset>
        <legend class="label">Do you have a valid Criminal Record / Vulnerable Sector Check? <span class="req">*</span></legend>
        <div class="flex gap-2">
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-cream/12 px-4 py-2.5 text-sm transition-colors hover:border-gold/50"><input type="radio" name="crc" value="Yes" class="h-4 w-4 accent-[#e3a812]" required /><span>Yes</span></label>
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-cream/12 px-4 py-2.5 text-sm transition-colors hover:border-gold/50"><input type="radio" name="crc" value="No" class="h-4 w-4 accent-[#e3a812]" /><span>No</span></label>
        </div>
      </fieldset>

      <label class="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-cream/12 p-3.5 text-sm transition-colors hover:border-gold/50">
        <input type="checkbox" name="policy" class="mt-0.5 h-4 w-4 accent-[#e3a812]" required />
        <span>Do you agree to follow FSF's Child &amp; Youth Protection Policy? <strong class="text-gold-lite">I Agree</strong> <span class="req">*</span></span>
      </label>

      <div class="mt-5"><label class="label" for="v-med">Emergency medical or accessibility needs</label><textarea id="v-med" name="medical" rows="2" class="field resize-y"></textarea></div>

      <label class="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-cream/12 p-3.5 text-sm transition-colors hover:border-gold/50">
        <input type="checkbox" name="consent" class="mt-0.5 h-4 w-4 accent-[#e3a812]" required />
        <span>I certify that the information provided is accurate and I consent to Future Stars Foundation contacting me regarding volunteer opportunities. <span class="req">*</span></span>
      </label>

      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <div><label class="label" for="v-sig">Signature <span class="req">*</span></label><input id="v-sig" name="signature" class="field" placeholder="Type your full name" required /></div>
        <div><label class="label" for="v-sigdate">Date <span class="req">*</span></label><input id="v-sigdate" name="sigdate" type="date" class="field" required /></div>
      </div>

      <button type="submit" class="btn btn-gold mt-8 w-full">Sign up</button>
      <p class="form-note mt-4 hidden text-sm" role="status" aria-live="polite"></p>
    </form>`
  });

  const partnerModal = () => ({
    eyebrow: 'Get Involved',
    title: 'Partnership Inquiry',
    html: `
    <form data-form="partner" novalidate>
      <p class="mb-7 text-sm leading-relaxed text-cream/60">
        We welcome partnerships with schools, businesses, and community organizations to expand our reach and impact.
      </p>

      <div class="grid gap-5 sm:grid-cols-2">
        <div><label class="label" for="p-org">Organization name <span class="req">*</span></label><input id="p-org" name="org" class="field" required autocomplete="organization" /></div>
        <div><label class="label" for="p-person">Contact person name <span class="req">*</span></label><input id="p-person" name="person" class="field" required autocomplete="name" /></div>
        <div><label class="label" for="p-title">Title / Role</label><input id="p-title" name="title" class="field" autocomplete="organization-title" /></div>
        <div><label class="label" for="p-email">Email address <span class="req">*</span></label><input id="p-email" name="email" type="email" class="field" required autocomplete="email" /></div>
        <div><label class="label" for="p-phone">Phone number <span class="req">*</span></label><input id="p-phone" name="phone" type="tel" class="field" required autocomplete="tel" /></div>
        <div><label class="label" for="p-web">Website / social media handle</label><input id="p-web" name="website" class="field" /></div>
        <div class="sm:col-span-2"><label class="label" for="p-addr">Organization address</label><input id="p-addr" name="address" class="field" autocomplete="street-address" /></div>
      </div>

      <h4 class="mt-9 mb-4 text-lg">Partnership Interests</h4>
      <div>
        <label class="label" for="p-type">Type of partnership you're interested in <span class="req">*</span></label>
        <select id="p-type" name="ptype" class="field" required>
          <option value="">Please select</option>
          <option>Sponsorship / Donations</option>
          <option>Program Collaboration</option>
          <option>Event Partnership</option>
          <option>In-Kind Support (equipment, supplies, etc.)</option>
          <option>Mentorship / Training Partnership</option>
          <option>Other (please specify)</option>
        </select>
      </div>

      <div class="mt-5"><label class="label" for="p-desc">Briefly describe how your organization would like to collaborate with FSF. <span class="req">*</span></label><textarea id="p-desc" name="describe" rows="3" class="field resize-y" required></textarea></div>
      <div class="mt-5"><label class="label" for="p-focus">Target group or focus area of your organization. <span class="req">*</span></label><textarea id="p-focus" name="focus" rows="2" class="field resize-y" required></textarea></div>

      <fieldset class="mt-5">
        <legend class="label">Have you partnered with youth or community organizations before? <span class="req">*</span></legend>
        <div class="flex gap-2">
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-cream/12 px-4 py-2.5 text-sm transition-colors hover:border-gold/50"><input type="radio" name="prior" value="Yes" class="h-4 w-4 accent-[#e3a812]" required /><span>Yes</span></label>
          <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-cream/12 px-4 py-2.5 text-sm transition-colors hover:border-gold/50"><input type="radio" name="prior" value="No" class="h-4 w-4 accent-[#e3a812]" /><span>No</span></label>
        </div>
      </fieldset>

      <h4 class="mt-9 mb-4 text-lg">Additional Information</h4>
      <div>
        <label class="label" for="p-file">Upload company logo or supporting document</label>
        <input id="p-file" name="file" type="file" class="field file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gold file:px-4 file:py-1.5 file:text-sm file:font-bold file:text-ink" />
      </div>

      <div class="mt-5">
        <label class="label" for="p-hear">How did you hear about FSF? <span class="req">*</span></label>
        <select id="p-hear" name="hear" class="field" required>
          <option value="">Please select</option>
          <option>Website</option><option>Social Media</option><option>Referral</option><option>Event</option><option>Other</option>
        </select>
      </div>

      <label class="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-cream/12 p-3.5 text-sm transition-colors hover:border-gold/50">
        <input type="checkbox" name="consent" class="mt-0.5 h-4 w-4 accent-[#e3a812]" required />
        <span>By submitting this form, I agree that Future Stars Foundation may contact me to explore partnership opportunities. <span class="req">*</span></span>
      </label>

      <button type="submit" class="btn btn-gold mt-8 w-full">Submit Partnership Inquiry</button>
      <p class="form-note mt-4 hidden text-sm" role="status" aria-live="polite"></p>
    </form>`
  });

  document.addEventListener('click', (e) => {
    const open = e.target.closest('[data-modal-open]');
    if (open) {
      const kind = open.dataset.modalOpen;
      if (kind === 'program')   openModal(programModal(+open.dataset.index));
      if (kind === 'volunteer') openModal(volunteerModal());
      if (kind === 'partner')   openModal(partnerModal());
      return;
    }
    if (e.target.closest('[data-modal-close]')) closeModal();
  });

  /* --------------------------------------------------------------- forms */
  // Static build: no backend. Validate, give real feedback, and be explicit
  // that nothing was transmitted rather than faking a success state.
  const validate = (form) => {
    let ok = true, firstBad = null;
    $$('[required]', form).forEach((el) => {
      const bad = el.type === 'checkbox' ? !el.checked : !String(el.value).trim() ||
        (el.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value));
      // radios: valid if any in the group is checked
      if (el.type === 'radio') {
        const grp = $$(`input[name="${el.name}"]`, form);
        if (grp.some((r) => r.checked)) { grp.forEach((r) => r.closest('label')?.classList.remove('!border-coral')); return; }
        grp.forEach((r) => r.closest('label')?.classList.add('!border-coral'));
        ok = false; firstBad = firstBad || el; return;
      }
      const box = el.type === 'checkbox' ? el.closest('label') : el;
      box?.classList.toggle('!border-coral', bad);
      if (bad) { ok = false; firstBad = firstBad || el; }
    });

    // Checkbox groups (interests, availability): the legend is marked required,
    // so at least one box must be ticked. Can't use the required attribute here —
    // it would demand that one specific box rather than any of them.
    $$('[data-req-group]', form).forEach((fs) => {
      const boxes = $$('input[type="checkbox"]', fs);
      const bad = !boxes.some((b) => b.checked);
      boxes.forEach((b) => b.closest('label')?.classList.toggle('!border-coral', bad));
      if (bad) { ok = false; firstBad = firstBad || boxes[0]; }
    });

    return { ok, firstBad };
  };

  const note = (form, msg, good) => {
    const n = $('.form-note', form);
    if (!n) return;
    n.textContent = msg;
    n.classList.remove('hidden');
    n.classList.toggle('text-gold-lite', !!good);
    n.classList.toggle('text-coral', !good);
  };

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form');
    if (!form) return;
    e.preventDefault();

    const { ok, firstBad } = validate(form);
    if (!ok) {
      note(form, 'Please complete the highlighted required fields.', false);
      firstBad?.focus();
      return;
    }

    const kind = form.dataset.form || 'contact';
    const label = kind === 'volunteer' ? 'volunteer sign-up'
                : kind === 'partner'   ? 'partnership inquiry'
                : 'message';

    note(form, `This demo build has no server connected, so your ${label} was not sent. Hook this form up to FSF's form handler (or email info@futurestarsfoundation.com) to go live.`, true);
    toast('Validated ✓ — but no backend is connected yet.');
  });

  // clear the error ring as the user fixes a field
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.matches('.field, input[type="checkbox"], input[type="radio"]')) return;
    (el.type === 'checkbox' ? el.closest('label') : el)?.classList.remove('!border-coral');
    if (el.type === 'radio') $$(`input[name="${el.name}"]`).forEach((r) => r.closest('label')?.classList.remove('!border-coral'));
    // ticking any box in a required group clears the whole group's error state
    const grp = el.closest('[data-req-group]');
    if (grp) $$('input[type="checkbox"]', grp).forEach((b) => b.closest('label')?.classList.remove('!border-coral'));
  });

  /* ---------------------------------------------------- donate selectors */
  const amtInput = $('#donate-amount');
  $$('[data-amt]').forEach((b) => {
    b.addEventListener('click', () => {
      $$('[data-amt]').forEach((o) => {
        o.classList.remove('btn-gold'); o.classList.add('btn-ghost');
        o.setAttribute('aria-pressed', 'false');
      });
      b.classList.remove('btn-ghost'); b.classList.add('btn-gold');
      b.setAttribute('aria-pressed', 'true');
      if (b.dataset.amt === 'custom') { amtInput.value = ''; amtInput.focus(); }
      else amtInput.value = b.dataset.amt;
      syncDonate();
    });
  });

  $$('[data-dtype]').forEach((b) => {
    b.addEventListener('click', () => {
      $$('[data-dtype]').forEach((o) => {
        o.classList.remove('btn-gold'); o.classList.add('btn-ghost');
        o.setAttribute('aria-pressed', 'false');
      });
      b.classList.remove('btn-ghost'); b.classList.add('btn-gold');
      b.setAttribute('aria-pressed', 'true');
      syncDonate();
    });
  });

  function syncDonate() {
    const amt = amtInput?.value;
    const recurring = $('[data-dtype][aria-pressed="true"]')?.textContent.trim() === 'Recurring';
    const t = $('#donate-go-text');
    if (!t) return;
    t.textContent = amt ? `Donate $${amt}${recurring ? ' / month' : ''}` : 'Donate Now';
  }
  amtInput?.addEventListener('input', syncDonate);

  /* --------------------------------------------------------------- GSAP */
  if (window.gsap && !reduced) {
    const gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    // hero entrance.
    // Deliberately set() + to() rather than from(): from() tweens render their
    // start values immediately and re-apply them on every ScrollTrigger.refresh()
    // (which fires when the hero image finishes decoding), which strands the nav
    // and headline at opacity 0. to() tweens have no such re-render.
    gsap.set('#hero-eyebrow', { y: 20, opacity: 0 });
    gsap.set('.hero-line',    { yPercent: 115 });
    gsap.set('#hero-sub',     { y: 24, opacity: 0 });
    gsap.set('#hero-cta > *', { y: 24, opacity: 0 });
    gsap.set('#navbar',       { y: -80, opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('#hero-eyebrow', { y: 0, opacity: 1, duration: 0.9 })
      .to('.hero-line',    { yPercent: 0, duration: 1.25, stagger: 0.12 }, '-=0.6')
      .to('#hero-sub',     { y: 0, opacity: 1, duration: 1 }, '-=0.8')
      .to('#hero-cta > *', { y: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, '-=0.75')
      .to('#navbar',       { y: 0, opacity: 1, duration: 1 }, 0.1);

    // Watchdog. gsap.from() sets opacity:0 up front, so anything that stalls the
    // ticker (throttled rAF in a background tab, a slow device) would strand the
    // headline and nav invisible. Snap to the end state instead of hiding them.
    setTimeout(() => { if (tl.progress() < 1) tl.progress(1); }, 4000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && tl.progress() < 1) tl.progress(1);
    });

    if (window.ScrollTrigger) {
      // hero photo drifts slower than the page
      gsap.to('#hero-photo', {
        yPercent: 16, ease: 'none',
        scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true }
      });

      // floating shapes parallax — data-par sets the strength
      $$('[data-par]').forEach((el) => {
        gsap.to(el, {
          yPercent: -100 * parseFloat(el.dataset.par), ease: 'none',
          scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true }
        });
      });

      // gentle image parallax inside About
      $$('[data-par-img]').forEach((el) => {
        gsap.fromTo(el, { yPercent: -4 }, {
          yPercent: 4, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    }
  }
  // Under reduced motion nothing above runs, so no inline offsets are ever set
  // and the hero simply renders in its final state.

  /* ----------------------------------------------------- 3D tilt (subtle) */
  if (fine && !reduced) {
    $$('[data-tilt]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${-py * 4}deg) rotateY(${px * 4}deg) translateY(-8px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
})();
