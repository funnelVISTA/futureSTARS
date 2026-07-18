/* ==========================================================================
   Cloudflare Turnstile — client half of the spam check.

   The server (api/submit.js) verifies a token on every submission. Without
   this file nothing produces one, so setting TURNSTILE_SECRET_KEY server-side
   would reject every form with "Spam check failed".

   Both halves must be configured together:
     • SITE_KEY below        — public, safe to commit
     • TURNSTILE_SECRET_KEY  — Vercel env var, server-only

   Until SITE_KEY is filled in this no-ops completely: no script is loaded, no
   widget renders, forms behave exactly as they do today. That matches the
   server, which skips the check when no secret is set.
   ========================================================================== */
(() => {
  'use strict';

  // ↓↓↓ Paste the Turnstile SITE key here (Cloudflare → Turnstile → your widget).
  //     This one is public by design — it is safe in client code and in git.
  const SITE_KEY = '';

  const widgets = new WeakMap();   // form -> widget id
  let scriptPromise = null;

  const api = {
    get enabled() { return !!SITE_KEY; },

    /** Render a widget into `form`'s [data-turnstile] slot. Safe to call twice. */
    async mount(form) {
      if (!SITE_KEY || !form || widgets.has(form)) return;
      const slot = form.querySelector('[data-turnstile]');
      if (!slot) return;
      try {
        await loadScript();
        const id = window.turnstile.render(slot, {
          sitekey: SITE_KEY,
          theme: 'auto',
          size: 'flexible'
        });
        widgets.set(form, id);
      } catch (e) {
        // A blocked/failed widget shouldn't strand the visitor with a dead
        // form — the server still decides whether to accept the submission.
        console.warn('Turnstile failed to load:', e);
      }
    },

    /** Current token for this form, or '' when not configured. */
    token(form) {
      if (!SITE_KEY || !window.turnstile) return '';
      const id = widgets.get(form);
      try { return id ? window.turnstile.getResponse(id) || '' : ''; }
      catch { return ''; }
    },

    /** Tokens are single-use — reset after every submit, success or failure. */
    reset(form) {
      if (!SITE_KEY || !window.turnstile) return;
      const id = widgets.get(form);
      try { if (id) window.turnstile.reset(id); } catch { /* already gone */ }
    }
  };

  function loadScript() {
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
      if (window.turnstile) return resolve();
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('script blocked'));
      document.head.appendChild(s);
    });
    return scriptPromise;
  }

  window.FSFTurnstile = api;
})();
