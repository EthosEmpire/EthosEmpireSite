/* ============================================================
   ETHOS EMPIRE — SLIDER.JS  v2
   Cinematic 1-scroll-1-page engine
   • Wheel / touch / keyboard all fire one section at a time
   • Locked during animation — no skipping, no stuttering
   • .snap-track transform drives layout (no browser scroll-snap)
   • In-view class fires immediately → content reveals alongside slide
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
  const SLIDE_MS   = 1000;
  const SLIDE_EASE = 'cubic-bezier(0.77, 0, 0.175, 1)';
  const WHEEL_THRESHOLD = 30;
  const TOUCH_THRESHOLD = 48;

  let container, track, sections, dots, counter;
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

    buildTrack();
    buildProgressLine();
    buildSideNav();
    buildCounter();
    setupWheel();
    setupTouch();
    setupKeys();
    hookAnchorLinks();

    /* show first section */
    goTo(0, false);
  }

  /* ──────────────────────────────────────────────
     TRACK WRAPPER
     All sections live inside .snap-track.
     JS moves it with transform: translateY(-N*100vh)
     ────────────────────────────────────────────── */
  function buildTrack() {
    track = document.createElement('div');
    track.className = 'snap-track';

    /* move all children into track */
    while (container.firstChild) {
      track.appendChild(container.firstChild);
    }
    container.appendChild(track);
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

    dots = SECTIONS_CONFIG.map((s, i) => {
      const btn = document.createElement('button');
      btn.className  = 'snap-dot';
      btn.dataset.label = s.label;
      btn.setAttribute('aria-label', 'Go to ' + s.label);
      btn.addEventListener('click', () => goTo(i));
      nav.appendChild(btn);
      return btn;
    });

    document.body.appendChild(nav);
  }

  /* ──────────────────────────────────────────────
     SECTION COUNTER  e.g. "03 / 10"
     ────────────────────────────────────────────── */
  function buildCounter() {
    counter = document.createElement('div');
    counter.className = 'snap-counter';
    document.body.appendChild(counter);
  }

  function updateCounter(index) {
    if (!counter) return;
    const n   = String(index + 1).padStart(2, '0');
    const tot = String(sections.length).padStart(2, '0');
    counter.innerHTML = `<span class="snap-counter-cur">${n}</span><span class="snap-counter-sep"> / </span><span class="snap-counter-tot">${tot}</span>`;
  }

  /* ──────────────────────────────────────────────
     GO TO — core navigation
     ────────────────────────────────────────────── */
  function goTo(index, animate) {
    if (animate === undefined) animate = true;
    if (index < 0 || index >= sections.length) return;
    if (animating && animate) return;
    if (index === current && animate) return;

    const prev = current;
    current = index;

    if (animate) {
      animating = true;
    }

    /* move track */
    track.style.transition = animate
      ? `transform ${SLIDE_MS}ms ${SLIDE_EASE}`
      : 'none';
    track.style.transform = `translateY(calc(-${index} * var(--vh, 100vh)))`;

    /* update in-view immediately so reveals fire alongside slide */
    sections.forEach((s, i) => {
      s.classList.toggle('in-view', i === index);
    });

    /* stat count on manifesto section */
    if (sections[index].id === 'snap-manifesto' && !statDone) {
      statDone = true;
      window.setTimeout(() => countStats(sections[index]), 380);
    }

    /* ui */
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
    setProgress(index);
    updateCounter(index);

    /* unlock */
    if (animate) {
      window.setTimeout(() => { animating = false; }, SLIDE_MS + 60);
    }
  }

  /* ──────────────────────────────────────────────
     WHEEL — one delta burst = one section
     Handles both mouse wheel (large delta) and
     trackpad (many small deltas → accumulate)
     ────────────────────────────────────────────── */
  let wheelAccum = 0;
  let wheelCooldown = false;

  function setupWheel() {
    container.addEventListener('wheel', (e) => {
      /* let Ctrl+scroll / Cmd+scroll pass through for browser zoom */
      if (e.ctrlKey || e.metaKey) return;

      e.preventDefault();
      if (animating) return;

      wheelAccum += e.deltaY;

      if (Math.abs(wheelAccum) >= WHEEL_THRESHOLD && !wheelCooldown) {
        const dir = wheelAccum > 0 ? 1 : -1;
        wheelAccum = 0;
        wheelCooldown = true;
        goTo(current + dir);
        window.setTimeout(() => { wheelCooldown = false; }, SLIDE_MS + 80);
      }
    }, { passive: false });
  }

  /* ──────────────────────────────────────────────
     TOUCH SWIPE
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
        e.preventDefault();
        goTo(current + 1);
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(current - 1);
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
     vh UNIT  — handles mobile address-bar resize
     ────────────────────────────────────────────── */
  function syncVh() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight}px`);
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