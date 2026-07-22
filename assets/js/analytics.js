/* ==========================================================================
   Future Stars Foundation — pageview beacon

   Cookieless. Sets nothing, reads nothing, identifies nobody. All it sends is
   the path, the referring host, a utm_source if one is present, and the screen
   width; /api/track turns the request IP into a daily-rotating hash and throws
   the IP away.

   Deliberately NOT loaded on /admin — staff traffic would inflate the very
   numbers staff are reading.
   ========================================================================== */
(() => {
  'use strict';

  // Honoured even though nothing personal is collected. Plausible and Fathom
  // ignore DNT on exactly that reasoning; on a site aimed at minors the more
  // conservative default is the right one, and it costs a few percent of counts.
  const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  if (dnt === '1' || dnt === 'yes') return;

  // localhost and preview builds would otherwise pollute production figures.
  if (!location.protocol.startsWith('http') || /^(localhost|127\.|0\.0\.0\.0|\[?::1)/.test(location.hostname)) return;

  const send = () => {
    let utm = null;
    try { utm = new URLSearchParams(location.search).get('utm_source'); } catch (e) {}

    const payload = JSON.stringify({
      p: location.pathname,
      r: document.referrer || '',
      u: utm || '',
      w: window.innerWidth || 0
    });

    // sendBeacon survives the page being closed mid-flight, which a plain fetch
    // does not — a visitor who bounces immediately still gets counted.
    try {
      if (navigator.sendBeacon &&
          navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }))) return;
    } catch (e) {}

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => {});   // analytics must never surface an error to a visitor
  };

  // Prerendered pages shouldn't count until actually shown.
  if (document.prerendering) {
    document.addEventListener('prerenderingchange', send, { once: true });
  } else {
    send();
  }
})();
