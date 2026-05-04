const $ = (id) => document.getElementById(id);

let currentEbookIndex = 0;
let currentMerchIndex = 0;
let activeModal = null;

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

function setupRevealAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.16 }
  );

  document.querySelectorAll(".fade-up, .soft-card, .section-title").forEach((el) => {
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
    if (card.classList.contains("ethos-bubble-card")) return;

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

  window.setTimeout(() => firstFocusable?.focus(), 40);
}

function closeModal(id) {
  const modal = $(id);
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  const panel = modal.querySelector(".modal-panel");
  panel?.classList.remove("modal-animate");

  document.body.style.overflow = "";

  if (activeModal === id) {
    activeModal = null;
  }
}

function openEbookModal(index) {
  const item = window.ebookData?.[index];
  if (!item) return;

  currentEbookIndex = index;

  const modalCover = $("ebookModalCover");
  if (modalCover) {
    modalCover.src = item.image1200 || item.image320;
    modalCover.srcset = `${item.image320} 320w, ${item.image1200} 1200w`;
    modalCover.sizes = "(max-width: 767px) 90vw, 280px";
    modalCover.alt = item.alt;
    modalCover.width = 420;
    modalCover.height = 594;
  }

  const title = $("ebookModalTitle");
  const desc = $("ebookModalDesc");
  const page = $("ebookModalPage");
  const buy = $("ebookModalBuy");

  if (title) title.textContent = item.title;
  if (desc) desc.textContent = item.desc;
  if (page) page.href = item.page || item.link;
  if (buy) buy.href = item.link;

  openModal("ebookModal");
}

function closeEbookModal() {
  closeModal("ebookModal");
}

function nextEbook(delta) {
  const total = window.ebookData?.length || 0;
  if (!total) return;

  currentEbookIndex = (currentEbookIndex + delta + total) % total;
  openEbookModal(currentEbookIndex);
}

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
  $("ebookModalClose")?.addEventListener("click", closeEbookModal);
  $("ebookPrevBtn")?.addEventListener("click", () => nextEbook(-1));
  $("ebookNextBtn")?.addEventListener("click", () => nextEbook(1));

  $("merchModalClose")?.addEventListener("click", closeMerchModal);
  $("merchPrevBtn")?.addEventListener("click", () => nextMerch(-1));
  $("merchNextBtn")?.addEventListener("click", () => nextMerch(1));

  ["ebookModal", "merchModal"].forEach((id) => {
    const overlay = $(id);
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) {
        if (id === "ebookModal") closeEbookModal();
        if (id === "merchModal") closeMerchModal();
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeEbookModal();
      closeMerchModal();
    }

    if ($("ebookModal")?.classList.contains("open")) {
      if (e.key === "ArrowLeft") nextEbook(-1);
      if (e.key === "ArrowRight") nextEbook(1);
    }

    if ($("merchModal")?.classList.contains("open")) {
      if (e.key === "ArrowLeft") nextMerch(-1);
      if (e.key === "ArrowRight") nextMerch(1);
    }

    trapModalFocus(e);
  });
}

function updateActiveBubbleCard() {
  const cards = Array.from(document.querySelectorAll(".ethos-bubble-card"));
  if (cards.length === 0) return;

  const viewportCenter = window.innerWidth < 768 ? window.innerWidth / 2 : window.innerHeight / 2;
  let closest = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const center = window.innerWidth < 768
      ? rect.left + rect.width / 2
      : rect.top + rect.height / 2;
    const distance = Math.abs(viewportCenter - center);

    if (distance < closestDistance) {
      closestDistance = distance;
      closest = card;
    }
  });

  cards.forEach((card) => {
    const isActive = card === closest;
    card.classList.toggle("is-active", isActive);
    card.classList.toggle("is-dim", !isActive && cards.length > 1);
  });
}

function setupBubbleCards() {
  const cards = document.querySelectorAll(".ethos-bubble-card");
  if (cards.length === 0) return;

  const isMobileTouch = () =>
    window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;

  const resetMobileState = () => {
    cards.forEach((card) => {
      card.classList.remove("is-active", "is-dim");
    });
  };

  if (isMobileTouch()) {
    resetMobileState();
    window.addEventListener("resize", () => {
      if (isMobileTouch()) {
        resetMobileState();
      } else {
        updateActiveBubbleCard();
      }
    });
    return;
  }

  cards.forEach((card) => {
    card.addEventListener("pointerenter", () => {
      if (isMobileTouch()) return;
      cards.forEach((item) => item.classList.toggle("is-dim", item !== card));
      card.classList.add("is-active");
    });

    card.addEventListener("pointerleave", () => {
      if (isMobileTouch()) {
        resetMobileState();
        return;
      }
      updateActiveBubbleCard();
    });
  });

  const bubbleGrid = document.querySelector(".ethos-bubble-grid");
  bubbleGrid?.addEventListener("scroll", () => {
    if (!isMobileTouch()) {
      requestAnimationFrame(updateActiveBubbleCard);
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (isMobileTouch()) {
      resetMobileState();
    } else {
      updateActiveBubbleCard();
    }
  });

  window.addEventListener("scroll", () => {
    if (!isMobileTouch()) {
      requestAnimationFrame(updateActiveBubbleCard);
    }
  }, { passive: true });

  updateActiveBubbleCard();
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

function setupStatCount() {
  const statNumbers = document.querySelectorAll(".stat p:first-child");
  if (statNumbers.length === 0) return;

  const parseTarget = (text) => {
    const number = Number.parseFloat(text.replace(/[^\d.]/g, ""));
    return Number.isNaN(number) ? 0 : number;
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        if (el.dataset.counted === "true") return;

        const original = el.textContent.trim();
        const suffix = original.replace(/[\d.]/g, "");
        const target = parseTarget(original);
        const duration = 1100;
        const start = performance.now();

        const tick = (now) => {
          const progress = clamp((now - start) / duration, 0, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = target >= 10
            ? Math.round(target * eased)
            : Math.max(1, Math.round(target * eased));

          el.textContent = `${value}${suffix}`;

          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            el.textContent = original;
            el.dataset.counted = "true";
          }
        };

        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    },
    { threshold: 0.55 }
  );

  statNumbers.forEach((item) => observer.observe(item));
}

window.openEbookModal = openEbookModal;
window.openMerchModal = openMerchModal;

document.addEventListener("DOMContentLoaded", () => {
  ensureScrollProgress();
  setupModalControls();
  setupRevealAnimations();
  setupPointerGlow(".soft-card, .ebook-card, .ethos-bubble-card");
  setupTilt(".soft-card");
  setupBubbleCards();
  setupFaqAccordion();
  setupStatCount();
});