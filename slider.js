/* ============================================================
   ETHOS EMPIRE — SLIDER.JS  v3
   Native scroll-snap engine (no GPU-crashing transforms)
   • Uses container.scrollTo() — the CSS scroll-snap does the rest
   • Wheel / keyboard / dot-nav all call goTo()
   • Touch is handled natively by scroll-snap (zero JS needed)
   • scroll listener keeps dots / progress / in-view in sync
   ============================================================ */
(function () {
  'use strict';

  const SECTIONS_CONFIG = [
    { id: 'snap-hero',       label: 'Home'       },
    { id: 'snap-manifesto',  label: 'Mission'    },
    { id: 'snap-discipline', label: 'Discipline' },
    { id: 'snap-confidence', label: 'Confidence' },
    { id: 'snap-health',     label: 'Health'     },
    { id: 'snap-legacy',     label: 'Legacy'     },
    { id: 'snap-knowledge',  label: 'Ebooks'     },
    { id: 'snap-merch-sec',  label: 'Merch'      },
    { id: 'snap-connect',    label: 'Connect'    },
    { id: 'snap-faq',        label: 'FAQ'        },
  ];

  /* ── timing ── */
  const SLIDE_MS        = 700;   // matches smooth-scroll duration on most mobile browsers
  const WHEEL_THRESHOLD = 30;
  const TOUCH_THRESHOLD = 48;

  let container, sections, dots;
  let current   = 0;
  let animating = false;
  let statDone  = false;

  /* ──────────────────────────────────────────────
     BOOT
     ────────────────────────────────────────────── */
  function init() {
    container = document.getElementById('snapContainer');
    if (!container) return;

    document.body.classList.add('snap-ready');

    /* hide legacy window-scroll bar */
    const legacyBar = document.querySelector('.scroll-progress');
    if (legacyBar) legacyBar.style.display = 'none';

    sections = SECTIONS_CONFIG
      .map(s => document.getElementById(s.id))
      .filter(Boolean);

    /* No buildTrack() with transforms — the CSS scroll-snap
       already handles layout via overflow-y:scroll on #snapContainer */

    buildProgressLine();
    buildSideNav();
    setupWheel();
    setupTouch();
    setupKeys();
    hookAnchorLinks();
    listenToScroll();

    /* show first section */
    goTo(0, false);
  }

  /* ──────────────────────────────────────────────
     PROGRESS LINE
     ────────────────────────────────────────────── */
  function buildProgressLine() {
    const bar = document.createElement('div');
    bar.className = 'snap-progress-line';
    bar.innerHTML = '<div class="snap-progress-fill"></div>';
    document.body.appendChild(bar);
  }

  function setProgress(index) {
    const fill = document.querySelector('.snap-progress-fill');
    if (!fill || sections.length < 2) return;
    fill.style.transform = `scaleX(${(index / (sections.length - 1)).toFixed(4)})`;
  }

  /* ──────────────────────────────────────────────
     SIDE DOT NAV
     ────────────────────────────────────────────── */
  function buildSideNav() {
    const nav = document.createElement('nav');
    nav.className = 'snap-sidenav';
    nav.setAttribute('aria-label', 'Jump to section');

    dots = sections.map((section, i) => {
      /* find the matching config label (fall back to index) */
      const cfg = SECTIONS_CONFIG.find(c => c.id === section.id) || { label: String(i + 1) };

      const btn = document.createElement('button');
      btn.className     = 'snap-dot';
      btn.dataset.label = cfg.label;
      btn.setAttribute('aria-label', 'Go to ' + cfg.label);
      btn.addEventListener('click', () => goTo(i));
      nav.appendChild(btn);
      return btn;
    });

    document.body.appendChild(nav);
  }

  /* ──────────────────────────────────────────────
     UPDATE UI  (dots + progress + in-view)
     ────────────────────────────────────────────── */
  function updateUI(index) {
    sections.forEach((s, i) => s.classList.toggle('in-view', i === index));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
    setProgress(index);

    if (sections[index] && sections[index].id === 'snap-manifesto' && !statDone) {
      statDone = true;
      window.setTimeout(() => countStats(sections[index]), 380);
    }
  }

  /* ──────────────────────────────────────────────
     GO TO — core navigation
     Uses scrollTo() — NO transforms, NO GPU layers
     ────────────────────────────────────────────── */
  function goTo(index, animate) {
    if (animate === undefined) animate = true;
    if (index < 0 || index >= sections.length) return;
    if (animating && animate) return;
    if (index === current && animate) return;

    current = index;

    if (animate) {
      animating = true;
      window.setTimeout(() => { animating = false; }, SLIDE_MS + 60);
    }

    /* ── KEY FIX: scroll the container, not a CSS transform ── */
    const targetTop = index * getVh();
    container.scrollTo({
      top:      targetTop,
      behavior: animate ? 'smooth' : 'instant',
    });

    updateUI(index);
  }

  /* ──────────────────────────────────────────────
     SCROLL LISTENER
     Keeps dots/progress in sync when native scroll-snap
     finishes (e.g. after touch swipe or keyboard scroll)
     ────────────────────────────────────────────── */
  let scrollRaf = null;

  function listenToScroll() {
    container.addEventListener('scroll', () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        const vh       = getVh();
        const newIndex = Math.min(
          sections.length - 1,
          Math.round(container.scrollTop / vh)
        );
        if (newIndex !== current) {
          current = newIndex;
          updateUI(newIndex);
        }
      });
    }, { passive: true });
  }

  /* ──────────────────────────────────────────────
     WHEEL — one delta burst = one section
     Still needed to prevent native scroll from
     moving multiple sections on a fast trackpad.
     ────────────────────────────────────────────── */
  let wheelAccum    = 0;
  let wheelCooldown = false;

  function setupWheel() {
    container.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) return;   /* allow browser pinch-zoom */

      e.preventDefault();
      if (animating) return;

      wheelAccum += e.deltaY;

      if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD && !wheelCooldown) {
        const dir  = wheelAccum > 0 ? 1 : -1;
        wheelAccum = 0;
        wheelCooldown = true;
        goTo(current + dir);
        window.setTimeout(() => { wheelCooldown = false; }, SLIDE_MS + 80);
      }
    }, { passive: false });
  }

  /* ──────────────────────────────────────────────
     TOUCH SWIPE
     Native scroll-snap handles the animation;
     we only intercept when the swipe is decisive
     enough to warrant calling goTo() explicitly.
     ────────────────────────────────────────────── */
  let touchStartY = 0;
  let touchStartX = 0;

  function setupTouch() {
    container.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (animating) return;
      const dy = touchStartY - e.changedTouches[0].clientY;
      const dx = Math.abs(touchStartX - e.changedTouches[0].clientX);
      /* only intercept clearly vertical swipes */
      if (Math.abs(dy) > TOUCH_THRESHOLD && Math.abs(dy) > dx * 1.5) {
        goTo(current + (dy > 0 ? 1 : -1));
      }
    }, { passive: true });
  }

  /* ──────────────────────────────────────────────
     KEYBOARD
     ────────────────────────────────────────────── */
  function setupKeys() {
    document.addEventListener('keydown', e => {
      if (document.querySelector('.modal-overlay.open')) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault(); goTo(current + 1);
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault(); goTo(current - 1);
      }
    });
  }

  /* ──────────────────────────────────────────────
     ANCHOR LINKS  (#snap-xxx)
     ────────────────────────────────────────────── */
  function hookAnchorLinks() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id  = a.getAttribute('href').replace('#', '');
      const el  = document.getElementById(id);
      const idx = sections.indexOf(el);
      if (idx >= 0) {
        e.preventDefault();
        goTo(idx);
      }
    });
  }

  /* ──────────────────────────────────────────────
     STAT COUNT ANIMATION
     ────────────────────────────────────────────── */
  function countStats(section) {
    section.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      if (isNaN(target)) return;
      const dur = 1400;
      const t0  = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * e);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      };
      requestAnimationFrame(tick);
    });
  }

  /* ──────────────────────────────────────────────
     vh HELPER — mobile address-bar safe
     ────────────────────────────────────────────── */
  function getVh() {
    return window.innerHeight;
  }

  function syncVh() {
    const vh = window.innerHeight;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    /* re-snap to current section after resize / orientation change */
    if (container) {
      container.scrollTo({ top: current * vh, behavior: 'instant' });
    }
  }

  syncVh();
  window.addEventListener('resize', syncVh);
  window.addEventListener('orientationchange', () => window.setTimeout(syncVh, 120));

  /* ──────────────────────────────────────────────
     BOOT
     ────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();