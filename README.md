# Future Stars Foundation — website redesign

A premium, single-page, highly interactive rebuild of
[futurestarsfoundation.com](https://futurestarsfoundation.com/).

Built with **HTML + Tailwind CSS v4 + vanilla JS**, with **GSAP + ScrollTrigger** for
scroll-driven motion. No framework, no build step required to view it.

---

## Run it

The site is fully static and the CSS is already compiled — so the fastest path is:

```bash
# from this folder
python3 -m http.server 4173
# then open http://localhost:4173
```

Or just double-click `index.html`. (A server is recommended — opening via `file://`
works, but some browsers restrict web fonts over that protocol.)

## Rebuild the CSS

Only needed if you edit `src/input.css`, `index.html`, or `assets/js/main.js`.

```bash
npm install
npm run build     # one-off, minified
npm run dev       # watch mode
```

## Deploy

**Live:** https://futurestarsfoundation.vercel.app

Vercel builds straight from this repo — pushing *is* deploying, there is no separate
deploy step:

```bash
git push                      # main    → builds and updates production
git push origin some-branch   # branch  → throwaway preview URL, production untouched
```

Vercel runs `npm run build` (recompiling Tailwind) and serves the repo root, per
[`vercel.json`](vercel.json). `node_modules/` is excluded via `.vercelignore`; `src/`
ships but is never served.

Nothing needs building locally to deploy — `assets/css/styles.css` is committed, so the
site also works opened straight from disk.

---

## Structure

```
fsf-site/
├─ index.html              # the whole page — all sections
├─ src/input.css           # Tailwind source + design tokens + components
├─ assets/
│  ├─ css/styles.css       # compiled output (committed — no build needed to run)
│  ├─ js/main.js           # all interactions + program/blog content
│  ├─ js/vendor/           # gsap.min.js, ScrollTrigger.min.js (vendored, offline-safe)
│  └─ img/                 # images pulled from the live site
└─ package.json
```

Program and blog copy lives in the `PROGRAMS` and `POSTS` arrays at the top of
`assets/js/main.js` — that's the single place to edit them; the cards and modals both
render from there.

---

## Design

**Colours are the real brand colours**, sampled pixel-wise from the FSF logo:

| Token | Hex | Notes |
|---|---|---|
| `gold` | `#E3A812` | brand `#BF9412`, brightened for contrast on dark |
| `gold-deep` | `#BF9412` | exact logo gold |
| `cream` | `#F9F5E9` | exact logo cream |
| `ink` | `#0B0B0F` | near-black ground |
| `coral` / `teal` / `violet` / `sky` | | energetic accents built around the gold |

**Type:** Bricolage Grotesque (expressive display) + Plus Jakarta Sans (body).

**Motifs:** the star is FSF's own brand mark, so it leads — plus soccer/basketballs,
scribbles, and playground shapes drawn as original inline SVG.

## Interactions

- Staggered hero reveal, scroll-scrubbed parallax on the hero photo and floating shapes
- Sticky nav that shrinks and solidifies on scroll, with scrollspy + smooth anchors
- Scroll progress bar, custom cursor with hover states (desktop, fine-pointer only)
- Card hover: lift, gold radial bloom that tracks the pointer, subtle 3D tilt
- Animated counters, marquee band, accessible modals with focus trap + `Esc`

---

## Accessibility & performance

- `prefers-reduced-motion` is honoured throughout — all animation, the custom cursor,
  and the reveal system fall back to static.
- Reveals use `IntersectionObserver`, independent of GSAP, so content still appears if
  the vendor scripts fail. `.no-js` keeps everything visible with JS off.
- Modals trap focus, restore it on close, and close on `Esc` / backdrop click.
- Skip link, visible focus rings, labelled fields, `aria-current` on the active nav item.
- Images are `loading="lazy"` (except the hero, `fetchpriority="high"`) and dimensioned
  to avoid layout shift.

---

## Notes for the FSF team

Three things worth a decision before this goes live:

1. **The forms don't submit anywhere.** This is a static build with no backend, so the
   contact, volunteer, and partnership forms validate fully and then say plainly that
   nothing was sent. Point them at your form handler (Formspree, Netlify Forms, or the
   existing WordPress endpoint) to go live.

2. **No impact statistics are shown.** The live site doesn't publish any, and inventing
   numbers for a donor-facing non-profit page isn't something to do casually. The three
   counters in the About section only animate figures your own content already supports
   (7 programs, 2 regions). Real numbers — youth served, tournaments run, meals provided
   — would be the single highest-impact addition to this page for donor trust.

3. **`home-about.png` from the live site is not used here.** It's the logo figure masked
   over a stock photo, and faint repeating marks are visible through the mask that look
   like an unlicensed stock watermark. Worth checking the licence on the original. This
   build uses FSF's own authentic photography instead, which is higher resolution and
   frankly much stronger.

Program card images are the 325×250 versions the live site serves — that's the largest
available. Higher-resolution originals would noticeably sharpen the Programs grid.
