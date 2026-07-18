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
      n: '01', img: 'program1.png', accent: 'gold', icon: 'ball',
      title: 'Sports Development & Unity Programs',
      body: 'We utilize the power of sport to build discipline, teamwork, and confidence in youth. Our programs provide access to structured training, experienced coaches, essential equipment and participation in local and regional tournaments.'
    },
    {
      n: '02', img: 'program2.png', accent: 'teal', icon: 'book',
      title: 'Education & Career Support',
      body: 'We help youth excel in school and prepare them for the future through academic support, tutoring, scholarships, and school supplies. Beyond the classroom, we offer vocational training, digital skills development, career mentorship, and post-secondary guidance.'
    },
    {
      n: '03', img: 'program3.png', accent: 'coral', icon: 'backpack',
      title: 'Basic Needs and Welfare Support Services',
      body: 'We ensure that the vulnerable youth have access to the essentials they need to live and learn with dignity. Our support includes food assistance, clothing, hygiene items, and temporary housing when needed.'
    },
    {
      n: '04', img: 'program4.png', accent: 'violet', icon: 'star',
      title: 'Mentorship, Leadership & Life Skills Development',
      body: 'Youth in our programs are supported by caring mentors who offer guidance, encouragement, and consistent support. Our initiatives focus on building confidence, resilience, strong decision-making, and a sense of purpose.'
    },
    {
      n: '05', img: 'program5.png', accent: 'sky', icon: 'globe',
      title: 'Settlement & Cultural Integration',
      body: 'We provide support to newcomers and immigrant families as they adjust to life in Canada through social programs, peer connections, and cultural exchange.'
    },
    {
      n: '06', img: 'program6.png', accent: 'gold', icon: 'home',
      title: 'Community Development',
      body: 'Our community-driven initiatives create safe, inclusive spaces where young people can grow, connect, and contribute. We organize outreach projects, local events, youth training camps, and wellness programs.'
    },
    {
      n: '07', img: 'program7.png', accent: 'teal', icon: 'build',
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


  /* --------------------------------------------------------------- icons */
  // Duotone SVG, replacing emoji: emoji render as a different illustration on
  // every OS, so the look wasn't ours to control, and they clashed with the
  // line icons already in the nav/contact. A tinted mass + a solid detail layer,
  // all currentColor — so each icon inherits its card's accent and both themes.
  const ICONS = {
    ball: `<circle cx="12" cy="12" r="9.5" fill="currentColor" opacity=".25"/><circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M12 7.1l3.15 2.3-1.2 3.7h-3.9l-1.2-3.7z" fill="currentColor"/><path d="M12 2.6v4.4M4.4 8.9l4.4 1.4M19.6 8.9l-4.4 1.4M7.6 19.2l2.3-3.1M16.4 19.2l-2.3-3.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>`,
    book: `<path d="M4 4.5h6.2c1 0 1.8.8 1.8 1.8V20c0-.9-.7-1.6-1.6-1.6H4z" fill="currentColor" opacity=".3"/><path d="M20 4.5h-6.2c-1 0-1.8.8-1.8 1.8V20c0-.9.7-1.6 1.6-1.6H20z" fill="currentColor"/><path d="M4 4.5v13.9M20 4.5v13.9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
    backpack: `<path d="M5 11.5A5 5 0 0110 6.5h4a5 5 0 015 5v7A2.5 2.5 0 0116.5 21h-9A2.5 2.5 0 015 18.5z" fill="currentColor" opacity=".3"/><path d="M5 11.5A5 5 0 0110 6.5h4a5 5 0 015 5v7A2.5 2.5 0 0116.5 21h-9A2.5 2.5 0 015 18.5z" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M10 6.5V5.6A2 2 0 0112 3.6a2 2 0 012 2v.9" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M8.6 14h6.8a1 1 0 011 1v3.6H7.6V15a1 1 0 011-1z" fill="currentColor"/>`,
    star: `<circle cx="12" cy="12" r="9.5" fill="currentColor" opacity=".25"/><path d="M12 5.6l1.85 4.1 4.45.45-3.33 3 .95 4.4L12 15.35 8.08 17.55l.95-4.4-3.33-3 4.45-.45z" fill="currentColor"/>`,
    globe: `<circle cx="12" cy="12" r="9.5" fill="currentColor" opacity=".25"/><path d="M2.6 12h18.8M12 2.6c2.6 2.7 2.6 16.1 0 18.8M12 2.6c-2.6 2.7-2.6 16.1 0 18.8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.6" fill="none"/>`,
    home: `<path d="M4 10.4l8-6 8 6V19a1.6 1.6 0 01-1.6 1.6H5.6A1.6 1.6 0 014 19z" fill="currentColor" opacity=".3"/><path d="M2.5 11.2L12 4l9.5 7.2" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.6 20.6v-5.3h4.8v5.3z" fill="currentColor"/>`,
    build: `<path d="M3.6 20.6V9.2a1 1 0 01.62-.93l4.9-1.96a1 1 0 011.38.93V20.6z" fill="currentColor" opacity=".3"/><path d="M10.5 20.6v-9.1a1 1 0 011.32-.95l7 2.33a1 1 0 01.68.95V20.6z" fill="currentColor"/><path d="M5.9 11.4v1.6M5.9 15.4v1.6M8.2 11.4v1.6M8.2 15.4v1.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".55"/><path d="M2.4 20.6h19.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" fill="none"/>`,
    hands: `<circle cx="11.2" cy="5.4" r="2.5" fill="currentColor"/><path d="M11.2 9.1c-2.4 0-4 1.5-4.4 3.7l-1 5.4a1.5 1.5 0 002.95.55l.7-3.75V21a1.6 1.6 0 003.2 0v-4h.2v4a1.6 1.6 0 003.2 0v-8.2l2.4-3.5a1.4 1.4 0 00-2.3-1.6l-2.2 3.2z" fill="currentColor" opacity=".35"/><path d="M11.2 9.1c-2.4 0-4 1.5-4.4 3.7l-1 5.4a1.5 1.5 0 002.95.55l.7-3.75V21a1.6 1.6 0 003.2 0v-4h.2v4a1.6 1.6 0 003.2 0v-8.2l2.4-3.5a1.4 1.4 0 00-2.3-1.6l-2.2 3.2" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M19.4 3.6l.5 1.15 1.25.12-.94.84.27 1.23-1.08-.64-1.08.64.27-1.23-.94-.84 1.25-.12z" fill="currentColor"/>`,
    rings: `<circle cx="8.6" cy="12" r="5.6" fill="currentColor" opacity=".3"/><circle cx="8.6" cy="12" r="5.6" stroke="currentColor" stroke-width="1.7" fill="none"/><circle cx="15.4" cy="12" r="5.6" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M12 7.35a5.6 5.6 0 000 9.3 5.6 5.6 0 000-9.3z" fill="currentColor"/>`,
    heart: `<path d="M12 20.8S3.6 15.4 3.6 9.9C3.6 6.6 5.9 4.2 8.9 4.2c1.8 0 3.1.9 3.1 2 0-1.1 1.3-2 3.1-2 3 0 5.3 2.4 5.3 5.7 0 5.5-8.4 10.9-8.4 10.9z" fill="currentColor" opacity=".3"/><path d="M12 20.8S3.6 15.4 3.6 9.9C3.6 6.6 5.9 4.2 8.9 4.2c1.8 0 3.1.9 3.1 2 0-1.1 1.3-2 3.1-2 3 0 5.3 2.4 5.3 5.7 0 5.5-8.4 10.9-8.4 10.9z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`,
    calendar: `<rect x="3.4" y="5.6" width="17.2" height="15" rx="2.4" fill="currentColor" opacity=".3"/><rect x="3.4" y="5.6" width="17.2" height="15" rx="2.4" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M3.4 10.2h17.2" stroke="currentColor" stroke-width="1.7" fill="none"/><path d="M8 3.4v3.6M16 3.4v3.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M10.4 13.2h3.2v3.2h-3.2z" fill="currentColor"/>`
  };
  const icon = (name, cls = 'h-full w-full') =>
    `<svg viewBox="0 0 24 24" class="${cls}" fill="none" aria-hidden="true">${ICONS[name] || ''}</svg>`;

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
          <span class="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl ${a.bg} ${a.text} ring-1 ${a.ring} backdrop-blur-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" aria-hidden="true">${icon(p.icon, 'h-5 w-5')}</span>
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

  /* ------------------------------------------------------ donate signpost */
  // Swings in past the hero, and retracts while #donate is on screen — nagging
  // someone to donate while they're reading the donate section is just noise.
  const sign = $('#donate-sign');
  let pastHero = false, atDonate = false;
  const syncSign = () => sign?.classList.toggle('show', pastHero && !atDonate);

  if (sign) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => { atDonate = e.isIntersecting; syncSign(); });
    }, { threshold: 0.12 }).observe($('#donate'));
  }

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

    const past = y > window.innerHeight * 0.55;
    if (past !== pastHero) { pastHero = past; syncSign(); }
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
    // Must REMOVE pointer-events-none, not add pointer-events-auto: both would
    // then be in the class list and CSS source order decides the winner —
    // .pointer-events-none is emitted later by Tailwind, so it won and the whole
    // modal stayed click-through (X and its buttons did nothing).
    root.classList.remove('hidden', 'pointer-events-none');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      backdrop.classList.remove('opacity-0');
      panel.classList.remove('opacity-0', 'translate-y-6', 'scale-[0.98]');
    });
    const injected = $('form', mBody);
    if (injected) window.FSFTurnstile?.mount(injected);
    setTimeout(() => ($(FOCUSABLE, mBody) || $('#modal-close'))?.focus(), 60);
  }

  function closeModal() {
    backdrop.classList.add('opacity-0');
    panel.classList.add('opacity-0', 'translate-y-6', 'scale-[0.98]');
    document.body.style.overflow = '';
    setTimeout(() => {
      root.classList.add('hidden', 'pointer-events-none');
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

      <div data-turnstile class="mt-6 empty:mt-0"></div>
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

      <div data-turnstile class="mt-6 empty:mt-0"></div>
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

    // Collect every named control, including multi-value checkbox groups.
    const fd = new FormData(form);
    const payload = {
      type: kind === 'partner' ? 'partnership' : kind,
      turnstile_token: window.FSFTurnstile?.token(form) || ''
    };
    for (const [k, v] of fd.entries()) {
      if (v instanceof File) continue;                 // uploads aren't wired yet
      if (payload[k] === undefined) payload[k] = v;
      else payload[k] = [].concat(payload[k], v);      // interests, availability
    }
    ['interests', 'availability'].forEach((k) => {
      if (payload[k] !== undefined) payload[k] = [].concat(payload[k]);
    });

    const btn = $('button[type="submit"]', form);
    const original = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.classList.add('opacity-70'); btn.textContent = 'Sending…'; }
    note(form, 'Sending…', true);

    fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.ok) throw new Error(data.error || 'Something went wrong.');
        form.reset();
        note(form, `Thank you — your ${label} has been received. We'll be in touch soon.`, true);
        toast('Received — thank you!');
      })
      .catch((err) => {
        note(form, err.message || "Sorry — we couldn't send that. Please try again.", false);
        toast('Could not send — please try again.');
      })
      .finally(() => {
        window.FSFTurnstile?.reset(form);   // tokens are single-use
        if (btn) { btn.disabled = false; btn.classList.remove('opacity-70'); btn.innerHTML = original; }
      });
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

  // Contact form is present at load; the modal forms mount when opened.
  window.FSFTurnstile?.mount($('#contact-form'));

  /* ---------------------------------------------------- donate selectors */
  // Interim behaviour: no checkout exists yet, so the amount is a suggestion
  // for an e-Transfer rather than a charge. Phase 2 replaces this with Stripe.
  const amtInput = $('#donate-amount');
  const summary = $('#donate-summary');

  const syncDonate = () => {
    if (!summary) return;
    const amt = amtInput?.value;
    summary.textContent = amt
      ? `Send $${amt} from your banking app to the address above.`
      : 'Add any amount in your banking app.';
  };

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
  amtInput?.addEventListener('input', syncDonate);

  const copyBtn = $('#donate-copy');
  copyBtn?.addEventListener('click', async () => {
    const address = $('#etransfer-address')?.textContent.trim();
    const label = $('#donate-copy-text');
    try {
      await navigator.clipboard.writeText(address);
      label.textContent = 'Copied ✓';
      toast(`${address} copied — send your e-Transfer from your banking app.`);
    } catch (e) {
      // clipboard needs a secure context and permission; fall back to selecting
      // the text so the donor can still copy it by hand rather than hitting a
      // dead button.
      const r = document.createRange();
      r.selectNodeContents($('#etransfer-address'));
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(r);
      label.textContent = 'Select and copy';
      toast('Copy blocked by your browser — the address is selected above.');
    }
    setTimeout(() => { label.textContent = 'Copy e-Transfer address'; }, 2600);
  });

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
