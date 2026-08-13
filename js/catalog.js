const merchData = [
  {
    title: "Black Hoodie",
    image: "images/ethos-empire-hoodie-black-gold-logo-400.webp",
    imageLarge: "images/ethos-empire-hoodie-black-gold-logo-1200.webp",
    alt: "Ethos Empire black hoodie with gold logo minimalist streetwear",
    link: "https://ethosempireo.printful.me/product/ethos-unisex-hoodie",
    preview: "Minimal look • gold emblem • daily wear"
  },
  {
    title: "Bone Hoodie",
    image: "images/ethos-empire-hoodie-bone-gold-logo-400.webp",
    imageLarge: "images/ethos-empire-hoodie-bone-gold-logo-1200.webp",
    alt: "Ethos Empire bone hoodie with gold logo minimalist streetwear",
    link: "https://ethosempireo.printful.me/product/ethos-unisex-hoodie",
    preview: "Soft tone • clean fit • legacy style"
  },
  {
    title: "Latte Hoodie",
    image: "images/ethos-empire-hoodie-latte-gold-logo-400.webp",
    imageLarge: "images/ethos-empire-hoodie-latte-gold-logo-1200.webp",
    alt: "Ethos Empire latte hoodie with gold logo minimalist streetwear",
    link: "https://ethosempireo.printful.me/product/ethos-unisex-hoodie",
    preview: "Warm neutral • premium feel • clean finish"
  },
  {
    title: "Lavender Hoodie",
    image: "images/ethos-empire-hoodie-lavender-gold-logo-400.webp",
    imageLarge: "images/ethos-empire-hoodie-lavender-gold-logo-1200.webp",
    alt: "Ethos Empire lavender hoodie with gold logo minimalist streetwear",
    link: "https://ethosempireo.printful.me/product/ethos-unisex-hoodie",
    preview: "Bold color • soft edge • standout piece"
  },
  {
    title: "Navy Hoodie",
    image: "images/ethos-empire-hoodie-navy-gold-logo-400.webp",
    imageLarge: "images/ethos-empire-hoodie-navy-gold-logo-1200.webp",
    alt: "Ethos Empire navy hoodie with gold logo minimalist streetwear",
    link: "https://ethosempireo.printful.me/product/ethos-unisex-hoodie",
    preview: "Dark tone • sharp contrast • versatile"
  },
  {
    title: "Oatmeal Hoodie",
    image: "images/ethos-empire-hoodie-oatmeal-gold-logo-400.webp",
    imageLarge: "images/ethos-empire-hoodie-oatmeal-gold-logo-1200.webp",
    alt: "Ethos Empire oatmeal hoodie with gold logo minimalist streetwear",
    link: "https://ethosempireo.printful.me/product/ethos-unisex-hoodie",
    preview: "Neutral color • easy fit • everyday piece"
  },
  {
    title: "Vintage Hoodie",
    image: "images/ethos-empire-hoodie-vintage-gold-logo-400.webp",
    imageLarge: "images/ethos-empire-hoodie-vintage-gold-logo-1200.webp",
    alt: "Ethos Empire vintage hoodie with gold logo minimalist streetwear",
    link: "https://ethosempireo.printful.me/product/ethos-unisex-hoodie",
    preview: "Classic tone • old-school feel • clean logo"
  },
  {
    title: "White Hoodie",
    image: "images/ethos-empire-hoodie-white-gold-logo-400.webp",
    imageLarge: "images/ethos-empire-hoodie-white-gold-logo-1200.webp",
    alt: "Ethos Empire white hoodie with gold logo minimalist streetwear",
    link: "https://ethosempireo.printful.me/product/ethos-unisex-hoodie",
    preview: "Bright color • crisp look • gold detail"
  },
  {
    title: "Pink Hoodie",
    image: "images/ethos-empire-hoodie-pink-gold-logo-400.webp",
    imageLarge: "images/ethos-empire-hoodie-pink-gold-logo-1200.webp",
    alt: "Ethos Empire pink hoodie with gold logo minimalist streetwear",
    link: "https://ethosempireo.printful.me/product/ethos-unisex-hoodie",
    preview: "Soft color • bold contrast • fresh style"
  }
];

const carouselControllers = new Map();

function updateCenteredCard(wrapper, itemSelector) {
  if (!wrapper) return;

  const cards = Array.from(wrapper.querySelectorAll(itemSelector));
  if (cards.length === 0) return;

  const wrapperRect = wrapper.getBoundingClientRect();
  const center = wrapperRect.left + wrapperRect.width / 2;

  let closestCard = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    const distance = Math.abs(center - cardCenter);

    card.classList.toggle("is-near", distance < rect.width * 1.1);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestCard = card;
    }
  });

  cards.forEach((card) => {
    card.classList.toggle("is-centered", card === closestCard);
  });
}

function buildLoopedCarouselMarkup(items, mode) {
  const copies = 3;

  return Array.from({ length: copies }, (_, copy) =>
    items.map((item, index) => {
      return `
        <article class="ebook-card" data-loop-index="${index}" data-loop-copy="${copy}" data-merch-index="${index}" role="button" tabindex="0" aria-label="Open ${item.title} details">
          <span class="card-eyebrow">Wear</span>
          <span class="card-preview is-merch">${item.preview}</span>
          <img
            src="${item.image}"
            srcset="${item.image} 400w, ${item.imageLarge} 1200w"
            sizes="(max-width: 767px) 140px, 160px"
            alt="${item.alt}"
            width="160"
            height="226"
            loading="lazy"
            decoding="async"
            draggable="false"
          >
          <a href="${item.link}" target="_blank" rel="noopener noreferrer bookmark" class="ebook-card-title">
            ${item.title}
          </a>
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="buy-btn">Buy</a>
        </article>
      `;
    }).join("")
  ).join("");
}

function bindCarouselCardEvents(track, selector, openerName) {
  track.querySelectorAll(selector).forEach((card) => {
    const open = () => {
      const fn = window[openerName];
      if (typeof fn === "function") {
        fn(Number(card.dataset.loopIndex));
      }
    };

    card.addEventListener("click", (e) => {
      const wrapper = card.closest(".ebook-wrapper");
      const suppressUntil = Number(wrapper?.dataset.suppressClickUntil || 0);

      if (performance.now() < suppressUntil) {
        e.preventDefault();
        return;
      }

      if (e.target.closest("a")) return;
      open();
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
}

function refreshCarouselMetrics(controller) {
  if (!controller?.wrapper || !controller.track) return;

  const cards = controller.track.querySelectorAll(".ebook-card");
  if (cards.length === 0) return;

  const firstCard = cards[0];
  const secondCard = cards[1];
  const firstRect = firstCard.getBoundingClientRect();
  const step = secondCard
    ? secondCard.getBoundingClientRect().left - firstRect.left
    : firstRect.width;

  controller.cardStep = step;
  controller.setWidth = Math.max(step * controller.count, 0);

  if (!controller.initialized && controller.setWidth > 0) {
    controller.scrollPos = controller.setWidth;
    controller.wrapper.scrollLeft = controller.scrollPos;
    controller.initialized = true;
  }
}

function normalizePosition(controller) {
  if (!controller || !controller.setWidth) return;

  const min = controller.setWidth * 0.4;
  const max = controller.setWidth * 1.6;

  if (controller.scrollPos < min) {
    controller.scrollPos += controller.setWidth;
  } else if (controller.scrollPos > max) {
    controller.scrollPos -= controller.setWidth;
  }
}

function applyScroll(controller) {
  if (!controller?.wrapper) return;
  controller.wrapper.scrollLeft = Math.round(controller.scrollPos);
}

function scheduleCarouselResume(controller, delay = 1200) {
  if (!controller) return;
  controller.isPaused = false;
  controller.resumeAt = performance.now() + delay;
}

function setupInfiniteCarousel(config) {
  const wrapper = document.getElementById(config.wrapperId);
  const track = document.getElementById(config.trackId);
  if (!wrapper || !track || config.items.length < 2) return null;

  const controller = {
    wrapper,
    track,
    count: config.items.length,
    speed: config.speed,
    direction: config.direction,
    rafId: 0,
    setWidth: 0,
    initialized: false,
    focusRaf: 0,
    isPaused: false,
    resumeAt: 0,
    isInteracting: false,
    scrollPos: 0
  };

  let restartTimer = 0;

  const clearMotion = () => {
    if (controller.rafId) {
      cancelAnimationFrame(controller.rafId);
      controller.rafId = 0;
    }
  };

  const updateFocus = () => {
    cancelAnimationFrame(controller.focusRaf);
    controller.focusRaf = requestAnimationFrame(() => {
      updateCenteredCard(wrapper, ".ebook-card");
    });
  };

  const refreshAndNormalize = () => {
    refreshCarouselMetrics(controller);
    normalizePosition(controller);
    applyScroll(controller);
    updateFocus();
  };

  const step = () => {
    if (document.hidden) {
      controller.rafId = requestAnimationFrame(step);
      return;
    }

    if (!controller.setWidth) {
      refreshCarouselMetrics(controller);
    }

    if (controller.setWidth && !controller.isInteracting && !controller.isPaused && performance.now() >= controller.resumeAt) {
      controller.scrollPos += controller.speed * controller.direction;
      normalizePosition(controller);
      applyScroll(controller);
    }

    controller.rafId = requestAnimationFrame(step);
  };

  const restartLoop = () => {
    refreshAndNormalize();
    clearMotion();
    controller.rafId = requestAnimationFrame(step);
  };

  const requestRestart = (delay = 80) => {
    clearTimeout(restartTimer);
    restartTimer = setTimeout(restartLoop, delay);
  };

  controller.updateFocus = updateFocus;
  controller.restartLoop = restartLoop;
  carouselControllers.set(wrapper, controller);

  refreshAndNormalize();
  restartLoop();

  let scrollSyncRaf = 0;
  wrapper.addEventListener("scroll", () => {
    cancelAnimationFrame(scrollSyncRaf);
    scrollSyncRaf = requestAnimationFrame(() => {
      if (!controller.isInteracting) {
        updateFocus();
      }
    });
  }, { passive: true });

  window.addEventListener("resize", () => requestRestart(90));
  window.addEventListener("orientationchange", () => requestRestart(120));
  window.addEventListener("load", () => requestRestart(120));
  window.addEventListener("pageshow", () => requestRestart(80));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearMotion();
    } else {
      requestRestart(80);
    }
  });

  track.querySelectorAll("img").forEach((img) => {
    if (!img.complete) {
      img.addEventListener("load", () => requestRestart(40), { once: true });
      img.addEventListener("error", () => requestRestart(40), { once: true });
    }
  });

  wrapper.querySelectorAll(".ebook-card").forEach((card) => {
    card.addEventListener("focusin", updateFocus);
    card.addEventListener("pointerenter", updateFocus);
  });

  return controller;
}

function setupDragScroll(el) {
  if (!el) return;

  const controller = carouselControllers.get(el);

  let isDown = false;
  let lastClientX = 0;
  let startClientX = 0;
  let startClientY = 0;
  let moved = false;
  let dragIntent = null;
  let suppressClickUntil = 0;
  let dragPos = 0;

  const beginInteraction = () => {
    if (!controller) return;
    // Stop the animation loop completely during drag
    if (controller.rafId) {
      cancelAnimationFrame(controller.rafId);
      controller.rafId = 0;
    }
    controller.isInteracting = true;
    controller.isPaused = true;
    // Capture position once, never read scrollLeft again during drag
    dragPos = el.scrollLeft;
  };

  const finishInteraction = (delay = 1200) => {
    if (!controller) return;
    controller.isInteracting = false;
    // Sync our tracked position back
    controller.scrollPos = dragPos;
    normalizePosition(controller);
    applyScroll(controller);
    controller.updateFocus?.();
    scheduleCarouselResume(controller, delay);

    // Restart the animation loop
    const restartAfterRelease = () => {
      controller.isPaused = false;
      controller.resumeAt = 0;
      controller.scrollPos = controller.wrapper.scrollLeft;
      controller.restartLoop?.();
    };

    if (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768) {
      setTimeout(restartAfterRelease, Math.min(delay, 220));
      setTimeout(restartAfterRelease, 600);
    }
  };

  const start = (clientX, clientY = 0, kind = "mouse") => {
    isDown = true;
    moved = false;
    lastClientX = clientX;
    startClientX = clientX;
    startClientY = clientY;
    dragIntent = kind === "touch" ? null : "horizontal";
    el.classList.add("dragging");
    el.dataset.suppressClickUntil = "0";
    beginInteraction();
  };

  const move = (clientX, clientY = 0, originalEvent = null, kind = "mouse") => {
    if (!isDown) return;

    const totalDeltaX = clientX - startClientX;
    const totalDeltaY = clientY - startClientY;

    if (kind === "touch" && dragIntent === null) {
      if (Math.abs(totalDeltaX) < 5 && Math.abs(totalDeltaY) < 5) return;
      dragIntent = Math.abs(totalDeltaX) >= Math.abs(totalDeltaY)
        ? "horizontal"
        : "vertical";
    }

    if (dragIntent === "vertical") return;

    if (kind === "touch" && originalEvent?.cancelable) {
      originalEvent.preventDefault();
    }

    const deltaX = clientX - lastClientX;
    lastClientX = clientX;

    if (Math.abs(deltaX) > 1) {
      moved = true;
    }

    // Track position locally — write only, never read back
    dragPos -= deltaX;

    // Keep in loop range so infinite scroll is seamless during fast swipes
    if (controller && controller.setWidth > 0) {
      if (dragPos < controller.setWidth * 0.3) dragPos += controller.setWidth;
      if (dragPos > controller.setWidth * 1.7) dragPos -= controller.setWidth;
    }

    el.scrollLeft = dragPos;
  };

  const end = () => {
    if (!isDown) return;

    const wasHorizontalDrag = dragIntent !== "vertical" && moved;

    isDown = false;
    dragIntent = null;
    el.classList.remove("dragging");

    if (wasHorizontalDrag) {
      suppressClickUntil = performance.now() + 280;
      el.dataset.suppressClickUntil = String(suppressClickUntil);
    } else {
      suppressClickUntil = 0;
      el.dataset.suppressClickUntil = "0";
    }

    moved = false;

    if (controller) {
      finishInteraction(wasHorizontalDrag ? 900 : 260);
    }
  };

  el.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    start(e.clientX, e.clientY, "mouse");
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => move(e.clientX, e.clientY, e, "mouse"));
  window.addEventListener("mouseup", end);
  window.addEventListener("blur", end);

  el.addEventListener("touchstart", (e) => {
    if (!e.touches[0]) return;
    start(e.touches[0].clientX, e.touches[0].clientY, "touch");
  }, { passive: true });

  el.addEventListener("touchmove", (e) => {
    if (!e.touches[0]) return;
    move(e.touches[0].clientX, e.touches[0].clientY, e, "touch");
  }, { passive: false });

  el.addEventListener("touchend", end, { passive: true });
  el.addEventListener("touchcancel", end, { passive: true });

  el.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (performance.now() < suppressClickUntil) {
        e.preventDefault();
      }
    });
  });
}

function renderMerchCards() {
  const track = document.getElementById("merchTrack");
  if (!track) return;

  track.innerHTML = buildLoopedCarouselMarkup(merchData, "merch");
  bindCarouselCardEvents(track, "[data-merch-index]", "openMerchModal");
}

function initCarousels() {
  renderMerchCards();

  const isPhoneLike =
    window.matchMedia("(max-width: 767px)").matches ||
    window.matchMedia("(pointer: coarse)").matches;

  const merchCarousel = setupInfiniteCarousel({
    wrapperId: "merchWrapper",
    trackId: "merchTrack",
    items: merchData,
    speed: isPhoneLike ? 0.58 : 0.55,
    direction: -1
  });

  const nudge = (controller) => {
    if (!controller) return;
    controller.isPaused = false;
    controller.resumeAt = 0;
    controller.isInteracting = false;
    controller.restartLoop?.();
  };

  [200, 800, 1600].forEach((delay) => {
    setTimeout(() => nudge(merchCarousel), delay);
  });

  window.addEventListener("pageshow", () => {
    setTimeout(() => nudge(merchCarousel), 100);
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      setTimeout(() => nudge(merchCarousel), 100);
    }
  });

  setupDragScroll(document.getElementById("merchWrapper"));
}

window.merchData = merchData;
window.initCarousels = initCarousels;

document.addEventListener("DOMContentLoaded", initCarousels);