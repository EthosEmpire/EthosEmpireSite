/* ============================================================
   ETHOS EMPIRE — SLIDER.JS
   Snap scroll engine: side nav, progress, reveals, stat count
   ============================================================ */
(function () {
  'use strict';

  const SECTIONS_CONFIG = [
    { id: 'snap-hero',         label: 'Home'       },
    { id: 'snap-manifesto',    label: 'Mission'    },
    { id: 'snap-discipline',   label: 'Discipline' },
    { id: 'snap-confidence',   label: 'Confidence' },
    { id: 'snap-health',       label: 'Health'     },
    { id: 'snap-legacy',       label: 'Legacy'     },
    { id: 'snap-knowledge',    label: 'Ebooks'     },
    { id: 'snap-merch-sec',    label: 'Merch'      },
    { id: 'snap-connect',      label: 'Connect'    },
    { id: 'snap-faq',          label: 'FAQ'        },
  ];

  let container, sections, dots;
  let current   = 0;
  let statDone  = false;

  /* ──────────────────────────────────────────────
     BOOT
     ────────────────────────────────────────────── */
  function init() {
    container = document.getElementById('snapContainer');
    if (!container) return;

    document.body.classList.add('snap-ready');

    // Suppress the old window-scroll progress bar
    const legacyBar = document.querySelector('.scroll-progress');
    if (legacyBar) legacyBar.style.display = 'none';

    sections = SECTIONS_CONFIG
      .map(s => document.getElementById(s.id))
      .filter(Boolean);

    buildProgressLine();
    buildSideNav();
    observeSections();
    setupKeys();
    hookAnchorLinks();
  }

  /* ──────────────────────────────────────────────
     PROGRESS LINE (fixed top bar)
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
     SIDE NAV DOTS
     ────────────────────────────────────────────── */
  function buildSideNav() {
    const nav = document.createElement('nav');
    nav.className = 'snap-sidenav';
    nav.setAttribute('aria-label', 'Jump to section');

    dots = SECTIONS_CONFIG.map((s, i) => {
      const btn = document.createElement('button');
      btn.className  = 'snap-dot' + (i === 0 ? ' is-active' : '');
      btn.dataset.label = s.label;
      btn.setAttribute('aria-label', 'Go to ' + s.label);
      btn.addEventListener('click', () => goTo(i));
      nav.appendChild(btn);
      return btn;
    });

    document.body.appendChild(nav);
  }

  function setActive(index) {
    if (index === current && dots[index]?.classList.contains('is-active')) return;
    current = index;
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
    setProgress(index);
  }

  /* ──────────────────────────────────────────────
     INTERSECTION OBSERVER
     Triggers .in-view → CSS staggered reveals
     ────────────────────────────────────────────── */
  function observeSections() {
    const obs = new IntersectionObserver(onIntersect, {
      root: container,
      threshold: [0.1, 0.55]
    });
    sections.forEach(s => obs.observe(s));
  }

  function onIntersect(entries) {
    entries.forEach(entry => {
      const sec = entry.target;
      const idx = sections.indexOf(sec);

      if (entry.intersectionRatio >= 0.55) {
        sec.classList.add('in-view');
        if (idx >= 0) setActive(idx);

        // Trigger stat animation exactly once
        if (sec.id === 'snap-manifesto' && !statDone) {
          statDone = true;
          window.setTimeout(() => countStats(sec), 300);
        }
      } else if (entry.intersectionRatio < 0.1) {
        // Reset so animation replays on re-entry
        sec.classList.remove('in-view');
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

      const dur = 1300;
      const t0  = performance.now();

      const tick = now => {
        const progress = Math.min(1, (now - t0) / dur);
        const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      };

      requestAnimationFrame(tick);
    });
  }

  /* ──────────────────────────────────────────────
     NAVIGATION
     ────────────────────────────────────────────── */
  function goTo(index) {
    if (!sections[index] || !container) return;
    container.scrollTo({
      top: sections[index].offsetTop,
      behavior: 'smooth'
    });
  }

  /* Arrow & PageUp/PageDown keyboard nav */
  function setupKeys() {
    document.addEventListener('keydown', e => {
      // Don't steal keys when a modal is open
      if (document.querySelector('.modal-overlay.open')) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goTo(Math.min(current + 1, sections.length - 1));
      }
      if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(Math.max(current - 1, 0));
      }
    });
  }

  /* Make any anchor link that targets a snap section
     scroll within the container instead of the window */
  function hookAnchorLinks() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#snap-"], a[href^="#"]');
      if (!a) return;

      const targetId  = a.getAttribute('href').replace('#', '');
      const targetEl  = document.getElementById(targetId);
      const sectionIdx = sections.indexOf(targetEl);

      if (sectionIdx >= 0 && container) {
        e.preventDefault();
        goTo(sectionIdx);
      }
    });
  }

  /* ──────────────────────────────────────────────
     BOOT ENTRY POINT
     ────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();