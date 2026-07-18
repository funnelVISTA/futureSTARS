/* ==========================================================================
   Future Stars Foundation — /register
   Standalone from main.js: that file drives the homepage (program grid,
   modals, donate signpost) and would throw on a page without those elements.
   ========================================================================== */
(() => {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- config */
  // Single source of truth — FSF may widen this later (they said they'd tell
  // us). Changing these two numbers updates the copy, the date bounds and the
  // validation message together.
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

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // keep the "ages 3–19" line in the intro in step with the constants
  $$('[data-age-range]').forEach((el) => { el.textContent = `${MIN_AGE}–${MAX_AGE}`; });

  /* ----------------------------------------------------------- reveals */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  $$('[data-reveal]').forEach((el) => revealIO.observe(el));

  /* --------------------------------------------------------- theme toggle */
  const themeBtn = $('#theme-toggle');
  const htmlEl = document.documentElement;

  const syncThemeBtn = () => {
    const light = htmlEl.getAttribute('data-theme') === 'light';
    themeBtn?.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
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
  });
  syncThemeBtn();

  /* ------------------------------------------------------------- nav */
  const nav = $('#nav'), navbar = $('#navbar'), navlogos = $$('.navlogo');
  const onScroll = () => {
    const y = window.scrollY;
    navbar.classList.toggle('!py-2', y > 60);
    navbar.classList.toggle('bg-ink/85', y > 60);
    navbar.classList.toggle('shadow-2xl', y > 60);
    navbar.classList.toggle('border-cream/20', y > 60);
    navlogos.forEach((el) => el.classList.toggle('!h-9', y > 60));
    nav.classList.toggle('!mt-0', y > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --------------------------------------------------------- mobile menu */
  const burger = $('#burger'), mob = $('#mobilemenu');
  let mobOpen = false;
  const setMob = (open) => {
    mobOpen = open;
    mob.classList.toggle('translate-y-[-100%]', !open);
    mob.classList.toggle('pointer-events-none', !open);
    mob.classList.toggle('invisible', !open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger?.addEventListener('click', () => setMob(!mobOpen));
  $$('.mob-link', mob).forEach((l) => l.addEventListener('click', () => setMob(false)));

  /* --------------------------------------------------------------- toast */
  let toastT;
  const toast = (msg) => {
    const t = $('#toast');
    $('#toast-text').textContent = msg;
    t.classList.remove('translate-y-24', 'opacity-0');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.add('translate-y-24', 'opacity-0'), 5000);
  };

  /* ------------------------------------------------------ child blocks */
  const wrap = $('#children');
  let seq = 0;

  // DOB bounds: someone turning MAX_AGE today is still eligible, so the oldest
  // allowed birth date is exactly MAX_AGE years ago.
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const dobMin = iso(new Date(today.getFullYear() - MAX_AGE - 1, today.getMonth(), today.getDate() + 1));
  const dobMax = iso(new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate()));

  const ageFrom = (dobStr) => {
    const d = new Date(dobStr);
    if (isNaN(d)) return null;
    let a = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) a--;
    return a;
  };

  const childBlock = (n) => {
    const id = `c${n}`;
    return `
    <fieldset class="child mt-6 rounded-2xl border border-cream/12 bg-ink/40 p-5 md:p-6" data-child>
      <div class="mb-5 flex items-center justify-between gap-3">
        <legend class="label !mb-0">Child <span data-child-num>${n}</span></legend>
        <button type="button" class="remove-child hidden items-center gap-1.5 text-xs font-bold text-cream/60 transition-colors hover:text-coral">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
          Remove
        </button>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <div>
          <label class="label" for="${id}-name">Child's full name <span class="req">*</span></label>
          <input id="${id}-name" name="child_name" class="field" required />
        </div>
        <div>
          <label class="label" for="${id}-dob">Date of birth <span class="req">*</span></label>
          <input id="${id}-dob" name="child_dob" type="date" class="field" required
                 min="${dobMin}" max="${dobMax}" data-dob />
          <p class="age-note mt-1.5 hidden text-xs"></p>
        </div>
        <div class="sm:col-span-2">
          <label class="label" for="${id}-prog">Program <span class="req">*</span></label>
          <select id="${id}-prog" name="child_program" class="field" required>
            <option value="">Select a program</option>
            ${PROGRAMS.map((p) => `<option>${esc(p)}</option>`).join('')}
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="label" for="${id}-school">School (optional)</label>
          <input id="${id}-school" name="child_school" class="field" />
        </div>
        <div class="sm:col-span-2">
          <label class="label" for="${id}-med">Allergies, medical or accessibility needs</label>
          <textarea id="${id}-med" name="child_medical" rows="2" class="field resize-y"
                    placeholder="Anything our coaches and staff should know — leave blank if none."></textarea>
        </div>
      </div>

      <label class="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-cream/12 p-3.5 text-sm leading-relaxed transition-colors hover:border-gold/50">
        <input type="checkbox" name="child_photo_consent" class="mt-0.5 h-4 w-4 shrink-0 accent-[#e3a812]" />
        <span>I give permission for photos or video of this child to be used in FSF materials.
          <span class="text-cream/50">(Optional — programs are open either way.)</span></span>
      </label>
    </fieldset>`;
  };

  const renumber = () => {
    const blocks = $$('[data-child]', wrap);
    blocks.forEach((b, i) => {
      $('[data-child-num]', b).textContent = i + 1;
      // only offer Remove when there's more than one child
      $('.remove-child', b).classList.toggle('hidden', blocks.length < 2);
      $('.remove-child', b).classList.toggle('flex', blocks.length > 1);
    });
  };

  const addChild = (focus = false) => {
    seq += 1;
    wrap.insertAdjacentHTML('beforeend', childBlock(seq));
    renumber();
    const last = wrap.lastElementChild;
    if (focus) {
      last.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      $('input', last)?.focus({ preventScroll: true });
    }
    return last;
  };

  addChild();                                  // start with one
  $('#add-child').addEventListener('click', () => addChild(true));

  wrap.addEventListener('click', (e) => {
    if (!e.target.closest('.remove-child')) return;
    if ($$('[data-child]', wrap).length < 2) return;
    e.target.closest('[data-child]').remove();
    renumber();
  });

  /* ------------------------------------------------------- age feedback */
  // Inline, as soon as a date is entered — better than failing on submit.
  const checkDob = (input) => {
    const note = $('.age-note', input.closest('[data-child]'));
    if (!input.value) { note.classList.add('hidden'); input.classList.remove('!border-coral'); return true; }
    const age = ageFrom(input.value);
    const ok = age !== null && age >= MIN_AGE && age <= MAX_AGE;
    note.classList.remove('hidden');
    note.textContent = ok
      ? `Age ${age} — eligible.`
      : `Age ${age} — our programs are for ages ${MIN_AGE}–${MAX_AGE}. Please check the date.`;
    note.classList.toggle('text-gold-lite', ok);
    note.classList.toggle('text-coral', !ok);
    input.classList.toggle('!border-coral', !ok);
    return ok;
  };

  wrap.addEventListener('change', (e) => {
    if (e.target.matches('[data-dob]')) checkDob(e.target);
  });

  /* ---------------------------------------------------------- validation */
  const form = $('#register-form');

  const validate = () => {
    let ok = true, firstBad = null;

    $$('[required]', form).forEach((el) => {
      let bad;
      if (el.type === 'checkbox') bad = !el.checked;
      else if (el.type === 'email') bad = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim());
      else bad = !el.value.trim();

      const box = el.type === 'checkbox' ? el.closest('label') : el;
      box?.classList.toggle('!border-coral', bad);
      if (bad) { ok = false; firstBad = firstBad || el; }
    });

    // every child's DOB must also land inside the age window
    $$('[data-dob]', form).forEach((el) => {
      if (el.value && !checkDob(el)) { ok = false; firstBad = firstBad || el; }
    });

    return { ok, firstBad };
  };

  const note = (msg, good) => {
    const n = $('.form-note', form);
    n.textContent = msg;
    n.classList.remove('hidden');
    n.classList.toggle('text-gold-lite', !!good);
    n.classList.toggle('text-coral', !good);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { ok, firstBad } = validate();

    if (!ok) {
      note('Please complete the highlighted fields before submitting.', false);
      firstBad?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      firstBad?.focus({ preventScroll: true });
      return;
    }

    // No backend yet — the database and /api/submit land in Phase 1. Say so
    // plainly rather than showing a success state that didn't happen.
    const kids = $$('[data-child]', form).length;
    note(`Validated ✓ — but this form isn't connected to a database yet, so nothing was sent. ` +
         `Once FSF's Supabase project is set up, this will save the registration and email the team.`, true);
    toast(`${kids} ${kids === 1 ? 'child' : 'children'} validated — no backend connected yet.`);
  });

  // clear the error ring as the user fixes a field
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.matches('.field, input[type="checkbox"]')) return;
    (el.type === 'checkbox' ? el.closest('label') : el)?.classList.remove('!border-coral');
  });
})();
