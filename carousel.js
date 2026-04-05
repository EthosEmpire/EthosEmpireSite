const ebookData = [
  {
    title: "Built by Money",
    page: "https://ethosempire.gumroad.com/l/builtbymoney?layout=profile",
    link: "https://ethosempire.gumroad.com/l/builtbymoney?layout=profile",
    desc: "Learn how to build financial discipline, control your spending, and develop a long-term wealth mindset that helps you stay focused on growth.",
    preview: "Money habits • long game • self-control",
    image320: "images/ethos-empire-built-by-money-ebook-cover-320.webp",
    image1200: "images/ethos-empire-built-by-money-ebook-cover-1200.webp",
    alt: "Built by Money ebook cover financial discipline wealth mindset for men"
  },
  {
    title: "Command the Room",
    page: "https://ethosempire.gumroad.com/l/commandtheroom?layout=profile",
    link: "https://ethosempire.gumroad.com/l/commandtheroom?layout=profile",
    desc: "Build confidence, presence, and social strength so you can carry yourself with more authority in any room you walk into.",
    preview: "Presence • charisma • social strength",
    image320: "images/ethos-empire-command-the-room-ebook-cover-320.webp",
    image1200: "images/ethos-empire-command-the-room-ebook-cover-1200.webp",
    alt: "Command the Room ebook cover confidence presence social strength"
  },
  {
    title: "Confidence Guide",
    page: "https://ethosempire.gumroad.com/l/howtobeconfidence?layout=profile",
    link: "https://ethosempire.gumroad.com/l/howtobeconfidence?layout=profile",
    desc: "Develop real confidence through better habits, stronger self-belief, and a sharper mindset that carries into everyday life.",
    preview: "Habits • self-belief • sharp mindset",
    image320: "images/ethos-empire-confidence-guide-ebook-cover-320.webp",
    image1200: "images/ethos-empire-confidence-guide-ebook-cover-1200.webp",
    alt: "Confidence Guide ebook cover self belief mindset personal growth"
  },
  {
    title: "The Philosophy of Becoming",
    page: "https://ethosempire.gumroad.com/l/thephilosophyofbecoming?layout=profile",
    link: "https://ethosempire.gumroad.com/l/thephilosophyofbecoming?layout=profile",
    desc: "Explore the mindset, discipline, and personal standards needed to become stronger, sharper, and more intentional in how you live.",
    preview: "Mindset • discipline • becoming",
    image320: "images/ethos-empire-philosophy-of-becoming-ebook-cover-320.webp",
    image1200: "images/ethos-empire-philosophy-of-becoming-ebook-cover-1200.webp",
    alt: "The Philosophy of Becoming ebook cover mindset discipline personal growth"
  },
  {
    title: "Life Lessons in Faith",
    page: "https://ethosempire.gumroad.com/l/lifelessonsinfaith?layout=profile",
    link: "https://ethosempire.gumroad.com/l/lifelessonsinfaith?layout=profile",
    desc: "Explore purpose, discipline, and belief with a guide that connects inner strength to a more grounded way of living.",
    preview: "Faith • purpose • inner strength",
    image320: "images/ethos-empire-life-lessons-in-faith-ebook-cover-320.webp",
    image1200: "images/ethos-empire-life-lessons-in-faith-ebook-cover-1200.webp",
    alt: "Life Lessons in Faith ebook cover purpose discipline belief"
  },
  {
    title: "The Relationship Code",
    page: "https://ethosempire.gumroad.com/l/therelationshipcode?layout=profile",
    link: "https://ethosempire.gumroad.com/l/therelationshipcode?layout=profile",
    desc: "Learn how to communicate better, build attraction, and approach relationships with more clarity and confidence.",
    preview: "Communication • attraction • clarity",
    image320: "images/ethos-empire-relationship-code-ebook-cover-320.webp",
    image1200: "images/ethos-empire-relationship-code-ebook-cover-1200.webp",
    alt: "The Relationship Code ebook cover communication attraction confidence"
  },
  {
    title: "The Architecture of Health",
    page: "https://ethosempire.gumroad.com/l/thearchitechtureofhealth?layout=profile",
    link: "https://ethosempire.gumroad.com/l/thearchitechtureofhealth?layout=profile",
    desc: "Build a better body and clearer mind through habits that support energy, training, nutrition, and long-term health.",
    preview: "Training • nutrition • energy",
    image320: "images/ethos-empire-architecture-of-health-ebook-cover-320.webp",
    image1200: "images/ethos-empire-architecture-of-health-ebook-cover-1200.webp",
    alt: "The Architecture of Health ebook cover fitness nutrition wellness habits"
  },
  {
    title: "The Gym Mindset",
    page: "https://ethosempire.gumroad.com/l/thegymmindset?layout=profile",
    link: "https://ethosempire.gumroad.com/l/thegymmindset?layout=profile",
    desc: "Train with more consistency, discipline, and purpose so your gym routine turns into real progress over time.",
    preview: "Discipline • progress • consistency",
    image320: "images/ethos-empire-gym-mindset-ebook-cover-320.webp",
    image1200: "images/ethos-empire-gym-mindset-ebook-cover-1200.webp",
    alt: "The Gym Mindset ebook cover training discipline consistency progress"
  },
  {
    title: "The Clear Skin Guide",
    page: "https://ethosempire.gumroad.com/l/theclearskinguide?layout=profile",
    link: "https://ethosempire.gumroad.com/l/theclearskinguide?layout=profile",
    desc: "Improve your skincare routine with practical steps that help you build healthier skin and better daily habits.",
    preview: "Routine • healthy skin • consistency",
    image320: "images/ethos-empire-clear-skin-guide-ebook-cover-320.webp",
    image1200: "images/ethos-empire-clear-skin-guide-ebook-cover-1200.webp",
    alt: "The Clear Skin Guide ebook cover skincare routine healthy skin habits"
  },
  {
    title: "Looksmaxxing Guide",
    page: "https://ethosempire.gumroad.com/l/thelooksmaxxingguide?layout=profile",
    link: "https://ethosempire.gumroad.com/l/thelooksmaxxingguide?layout=profile",
    desc: "Level up your appearance with a sharper approach to style, grooming, confidence, and self-presentation.",
    preview: "Style • grooming • confidence",
    image320: "images/ethos-empire-looksmaxxing-guide-ebook-cover-320.webp",
    image1200: "images/ethos-empire-looksmaxxing-guide-ebook-cover-1200.webp",
    alt: "Looksmaxxing Guide ebook cover style grooming attraction appearance"
  },
  {
    title: "The Hair Care Blueprint",
    page: "https://ethosempire.gumroad.com/l/thehaircareblueprint?layout=profile",
    link: "https://ethosempire.gumroad.com/l/thehaircareblueprint?layout=profile",
    desc: "Take better care of your hair with a simple approach to grooming, maintenance, and a cleaner overall look.",
    preview: "Grooming • maintenance • cleaner look",
    image320: "images/ethos-empire-hair-care-blueprint-ebook-cover-320.webp",
    image1200: "images/ethos-empire-hair-care-blueprint-ebook-cover-1200.webp",
    alt: "The Hair Care Blueprint ebook cover grooming styling hair health"
  }
];

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
      if (mode === "ebook") {
        return `
          <article class="ebook-card" data-loop-index="${index}" data-loop-copy="${copy}" data-ebook-index="${index}" role="button" tabindex="0" aria-label="Open ${item.title} details">
            <span class="card-eyebrow">Read</span>
            <span class="card-preview">${item.preview}</span>
            <img
              src="${item.image320}"
              srcset="${item.image320} 320w, ${item.image1200} 1200w"
              sizes="(max-width: 767px) 140px, 160px"
              alt="${item.alt}"
              width="160"
              height="226"
              loading="lazy"
              decoding="async"
              draggable="false"
            >
            <a href="${item.page || item.link}" target="_blank" rel="noopener noreferrer bookmark" class="ebook-card-title">
              ${item.title}
            </a>
            <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="buy-btn">Buy</a>
          </article>
        `;
      }

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

  const beginInteraction = () => {
    if (!controller) return;
    controller.isInteracting = true;
    controller.isPaused = true;
    controller.scrollPos = el.scrollLeft;
  };

  const finishInteraction = (delay = 1200) => {
    if (!controller) return;
    controller.isInteracting = false;
    controller.scrollPos = el.scrollLeft;
    normalizePosition(controller);
    applyScroll(controller);
    controller.updateFocus?.();
    scheduleCarouselResume(controller, delay);

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
      if (Math.abs(totalDeltaX) < 8 && Math.abs(totalDeltaY) < 8) return;
      dragIntent = Math.abs(totalDeltaX) > Math.abs(totalDeltaY)
        ? "horizontal"
        : "vertical";
    }

    if (dragIntent === "vertical") return;

    const deltaX = clientX - lastClientX;
    lastClientX = clientX;

    if (Math.abs(deltaX) > 1) {
      moved = true;
    }

    if (kind === "touch" && originalEvent?.cancelable) {
      originalEvent.preventDefault();
    }

    const multiplier = kind === "touch" ? 1 : 0.92;
    el.scrollLeft -= deltaX * multiplier;

    if (controller) {
      controller.scrollPos = el.scrollLeft;
      controller.updateFocus?.();
    }
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

function renderEbookCards() {
  const track = document.getElementById("ebookTrack");
  if (!track) return;

  track.innerHTML = buildLoopedCarouselMarkup(ebookData, "ebook");
  bindCarouselCardEvents(track, "[data-ebook-index]", "openEbookModal");
}

function renderMerchCards() {
  const track = document.getElementById("merchTrack");
  if (!track) return;

  track.innerHTML = buildLoopedCarouselMarkup(merchData, "merch");
  bindCarouselCardEvents(track, "[data-merch-index]", "openMerchModal");
}

function initCarousels() {
  renderEbookCards();
  renderMerchCards();

  const isPhoneLike =
    window.matchMedia("(max-width: 767px)").matches ||
    window.matchMedia("(pointer: coarse)").matches;

  const ebookCarousel = setupInfiniteCarousel({
    wrapperId: "ebookWrapper",
    trackId: "ebookTrack",
    items: ebookData,
    speed: isPhoneLike ? 0.62 : 0.55,
    direction: 1
  });

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
    setTimeout(() => nudge(ebookCarousel), delay);
    setTimeout(() => nudge(merchCarousel), delay);
  });

  window.addEventListener("pageshow", () => {
    setTimeout(() => nudge(ebookCarousel), 100);
    setTimeout(() => nudge(merchCarousel), 100);
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      setTimeout(() => nudge(ebookCarousel), 100);
      setTimeout(() => nudge(merchCarousel), 100);
    }
  });

  setupDragScroll(document.getElementById("ebookWrapper"));
  setupDragScroll(document.getElementById("merchWrapper"));
}

window.ebookData = ebookData;
window.merchData = merchData;
window.initCarousels = initCarousels;

document.addEventListener("DOMContentLoaded", initCarousels);