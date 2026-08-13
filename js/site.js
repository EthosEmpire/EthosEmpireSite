const $ = (id) => document.getElementById(id);

let currentMerchIndex = 0;
let activeModal = null;

/* The control that opened the current modal. Focus goes back here on close
   so keyboard and screen-reader users land where they left off instead of
   at the top of the document. */
let modalReturnFocus = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function ensureScrollProgress() {
  let bar = document.querySelector(".scroll-progress");

  if (!bar) {
    bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);
  }

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max <= 0 ? 0 : window.scrollY / max;
    bar.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

/* Selectors that participate in the reveal system. Must stay in sync with
   the hiding rules in css/animations.css.

   .reveal-block is for wrappers whose contents are rendered by JavaScript
   (the bookstore shelf). The wrapper itself is in the HTML, so the observer
   can see it no matter which script finishes first. */
const REVEAL_SELECTOR =
  ".soft-card, .section-head, .partnership-card, .reveal-block";

/* One IntersectionObserver for the whole page — no scroll listeners, no
   polling. Each element is unobserved once it has been revealed.

   The html.js-reveal guard is set in <head> before first paint, so elements
   are never briefly visible before being hidden. If that guard is absent
   (no JS, no IntersectionObserver) the CSS leaves everything visible. */
function setupRevealAnimations() {
  if (!document.documentElement.classList.contains("js-reveal")) return;

  const targets = document.querySelectorAll(REVEAL_SELECTOR);
  if (targets.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  targets.forEach((el) => {
    /* Anything already on screen at load settles immediately and without a
       transition, so a mid-page refresh never replays the animation. */
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) {
      el.classList.add("no-anim", "is-visible");
      return;
    }
    observer.observe(el);
  });
}

function setupPointerGlow(selector) {
  const cards = document.querySelectorAll(selector);

  cards.forEach((card) => {
    let glowRaf = 0;
    card.addEventListener("pointermove", (event) => {
      if (glowRaf) return;
      glowRaf = requestAnimationFrame(() => {
        glowRaf = 0;
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--card-glow-x", `${x}%`);
        card.style.setProperty("--card-glow-y", `${y}%`);
      });
    });
  });
}

function setupTilt(selector) {
  const cards = document.querySelectorAll(selector);

  cards.forEach((card) => {
    let tiltRaf = 0;

    const reset = () => {
      if (tiltRaf) { cancelAnimationFrame(tiltRaf); tiltRaf = 0; }
      card.style.transform = "";
      card.classList.remove("is-tilting");
    };

    card.addEventListener("pointermove", (event) => {
      if (window.innerWidth < 768) return;
      if (tiltRaf) return;

      tiltRaf = requestAnimationFrame(() => {
        tiltRaf = 0;
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const rx = (0.5 - py) * 6;
        const ry = (px - 0.5) * 8;

        card.classList.add("is-tilting");
        card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      });
    });

    card.addEventListener("pointerleave", reset);
    card.addEventListener("pointercancel", reset);
  });
}

function animateModalCopy(id) {
  const modal = $(id);
  const panel = modal?.querySelector(".modal-panel");
  if (!panel) return;

  panel.classList.remove("modal-animate");
  void panel.offsetWidth;
  panel.classList.add("modal-animate");
}

function openModal(id) {
  const modal = $(id);
  if (!modal) return;

  /* Only capture the trigger when nothing is open yet. Stepping between
     items inside a modal calls this again, and overwriting the return
     target with a control that is about to be hidden would strand focus. */
  if (!activeModal) {
    modalReturnFocus = document.activeElement;
  }

  activeModal = id;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  requestAnimationFrame(() => {
    animateModalCopy(id);
  });

  const firstFocusable = modal.querySelector(
    'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
  );

  /* Focus on the next frame, once the .open class has been applied and
     styles are resolved. This used to be a 40ms timeout, which was a guess
     that happened to be shorter than the overlay's visibility transition —
     the call landed while the modal was still hidden and did nothing.
     The CSS now flips visibility as a step, and this no longer races it. */
  requestAnimationFrame(() => firstFocusable?.focus());
}

function closeModal(id) {
  const modal = $(id);
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  const panel = modal.querySelector(".modal-panel");
  panel?.classList.remove("modal-animate");

  document.body.style.overflow = "";

  if (activeModal !== id) return;

  activeModal = null;

  const target = modalReturnFocus;
  modalReturnFocus = null;

  /* The opener can be gone if the grid re-rendered while the modal was
     open, so check it is still in the document before focusing it. */
  if (target && document.contains(target) && typeof target.focus === "function") {
    target.focus();
  }
}

/* The ebook detail view lives in js/bookstore.js now — it renders from
   js/ebook-data.js and drives itself through openModal/closeModal below.
   What used to be here was the carousel's own modal, and it went with the
   carousel. */

function openMerchModal(index) {
  const item = window.merchData?.[index];
  if (!item) return;

  currentMerchIndex = index;

  const modalCover = $("merchModalCover");
  if (modalCover) {
    modalCover.src = item.imageLarge || item.image;
    modalCover.srcset = `${item.image} 400w, ${item.imageLarge} 1200w`;
    modalCover.sizes = "(max-width: 767px) 90vw, 280px";
    modalCover.alt = item.alt;
    modalCover.width = 420;
    modalCover.height = 594;
  }

  const title = $("merchModalTitle");
  const buy = $("merchModalBuy");
  const social = $("merchModal")?.querySelector(".modal-social");
  const socialText = $("merchModal")?.querySelector(".modal-social-text");
  const socialRow = $("merchModal")?.querySelector(".modal-social-row");

  if (title) title.textContent = item.title;
  if (buy) buy.href = item.link;
  if (social) social.style.display = "block";
  if (socialText) socialText.style.display = "block";
  if (socialRow) socialRow.style.display = "flex";

  openModal("merchModal");
}

function closeMerchModal() {
  closeModal("merchModal");
}

function nextMerch(delta) {
  const total = window.merchData?.length || 0;
  if (!total) return;

  currentMerchIndex = (currentMerchIndex + delta + total) % total;
  openMerchModal(currentMerchIndex);
}

function trapModalFocus(event) {
  if (!activeModal || event.key !== "Tab") return;

  const modal = $(activeModal);
  if (!modal) return;

  const focusable = modal.querySelectorAll(
    'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
  );

  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function setupModalControls() {
  $("merchModalClose")?.addEventListener("click", closeMerchModal);
  $("merchPrevBtn")?.addEventListener("click", () => nextMerch(-1));
  $("merchNextBtn")?.addEventListener("click", () => nextMerch(1));

  const merchOverlay = $("merchModal");
  merchOverlay?.addEventListener("click", (e) => {
    if (e.target === merchOverlay) closeMerchModal();
  });

  /* Escape and the Tab trap are handled for whichever modal is open, so a
     modal added later — the book detail view, for instance — gets both
     without touching this function. */
  document.addEventListener("keydown", (e) => {
    if (!activeModal) return;

    if (e.key === "Escape") {
      closeModal(activeModal);
      return;
    }

    if (activeModal === "merchModal") {
      if (e.key === "ArrowLeft") nextMerch(-1);
      if (e.key === "ArrowRight") nextMerch(1);
    }

    trapModalFocus(e);
  });
}

function setupFaqAccordion() {
  const details = document.querySelectorAll("details.soft-card");
  details.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      details.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
}

window.openMerchModal = openMerchModal;

/* Shared modal primitives. js/bookstore.js drives the book detail view
   through these, so the scroll lock, focus trap, Escape handling and focus
   restore all have one implementation. */
window.openModal = openModal;
window.closeModal = closeModal;

/* Exposed so scripts that render cards after this file has run can apply
   the same hover treatment to them. */
window.setupPointerGlow = setupPointerGlow;

document.addEventListener("DOMContentLoaded", () => {
  ensureScrollProgress();
  setupModalControls();
  setupRevealAnimations();
  setupPointerGlow(".soft-card, .ebook-card");
  setupTilt(".soft-card");
  setupFaqAccordion();
});