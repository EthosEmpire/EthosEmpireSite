const introOverlay = document.getElementById("introOverlay");
const introCanvas = document.getElementById("matrixCanvas");
const introCtx = introCanvas ? introCanvas.getContext("2d") : null;
const introContent = document.querySelector(".intro-content");

const INTRO_CLOSE_DURATION = 1100;
const MATRIX_CHARSET = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ0123456789<>+-=*";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let introClosing = false;
let introCloseStart = 0;
let introAnimationFrame = 0;
let introFontSize = 16;
let introColumns = [];
let introParticles = [];
let introLastFrameTime = 0;
let currentEbookIndex = 0;
let currentMerchIndex = 0;
let activeModal = null;
const carouselControllers = new Map();

const $ = (id) => document.getElementById(id);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomMatrixChar() {
  return MATRIX_CHARSET[Math.floor(Math.random() * MATRIX_CHARSET.length)];
}

function resizeIntroCanvas() {
  if (!introCanvas || !introCtx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  introCanvas.width = Math.floor(width * dpr);
  introCanvas.height = Math.floor(height * dpr);
  introCanvas.style.width = "100%";
  introCanvas.style.height = "100%";

  introCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  introFontSize = Math.max(12, Math.min(16, width / 110));
  const cols = Math.ceil(width / introFontSize) + 14;

  introColumns = Array.from({ length: cols }, (_, i) => ({
    x: i * introFontSize,
    y: Math.random() * (height + 220) - 220,
    speed: 52 + Math.random() * 36,
    length: 14 + Math.floor(Math.random() * 10),
    glyphs: Array.from({ length: 30 }, randomMatrixChar)
  }));

  introLastFrameTime = performance.now();
}

function drawMatrixLayer(width, height, visibility, delta) {
  if (!introCtx) return;

  introCtx.fillStyle = `rgba(0, 0, 0, ${introClosing ? 0.12 * visibility : 0.065})`;
  introCtx.fillRect(0, 0, width, height);

  introCtx.font = `700 ${introFontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  introCtx.textBaseline = "top";

  for (const col of introColumns) {
    for (let i = 0; i < col.length; i += 1) {
      const y = col.y - i * introFontSize * 1.12;
      if (y < -40 || y > height + 40) continue;

      if (Math.random() > 0.972) {
        col.glyphs[i] = randomMatrixChar();
      }

      const trailStrength = 1 - i / col.length;

      if (i === 0) {
        introCtx.shadowColor = "rgba(210, 255, 225, 0.45)";
        introCtx.shadowBlur = 12;
        introCtx.fillStyle = `rgba(236, 255, 244, ${0.96 * visibility})`;
      } else {
        introCtx.shadowColor = "rgba(100, 255, 160, 0.16)";
        introCtx.shadowBlur = 6;
        introCtx.fillStyle = `rgba(120, 255, 170, ${0.48 * trailStrength * visibility})`;
      }

      introCtx.fillText(col.glyphs[i], col.x, y);
    }

    col.y += col.speed * delta;

    if (col.y - col.length * introFontSize * 1.12 > height + 80) {
      col.y = -Math.random() * 180;
      col.length = 14 + Math.floor(Math.random() * 10);
    }
  }
}

function spawnDustBurst() {
  if (!introContent) return;

  const rect = introContent.getBoundingClientRect();
  const count = 110;
  introParticles = [];

  for (let i = 0; i < count; i += 1) {
    introParticles.push({
      x: rect.left + Math.random() * rect.width,
      y: rect.top + Math.random() * rect.height * 0.85,
      vx: (Math.random() - 0.5) * 0.85,
      vy: -(0.28 + Math.random() * 1.05),
      size: 0.7 + Math.random() * 1.8,
      life: 1,
      decay: 0.006 + Math.random() * 0.006,
      swirl: (Math.random() - 0.5) * 0.016
    });
  }
}

function drawDustLayer(visibility) {
  if (!introCtx || introParticles.length === 0) return;

  const width = window.innerWidth;
  const height = window.innerHeight;

  introCtx.save();
  introCtx.globalCompositeOperation = "lighter";

  for (const p of introParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy -= 0.0015;
    p.vx += p.swirl;
    p.life -= p.decay;

    const alpha = Math.max(0, p.life) * visibility;
    if (alpha <= 0) continue;

    introCtx.beginPath();
    introCtx.fillStyle = `rgba(255, 220, 135, ${alpha})`;
    introCtx.shadowColor = "rgba(255, 215, 0, 0.28)";
    introCtx.shadowBlur = 8;
    introCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    introCtx.fill();
  }

  introCtx.restore();

  introParticles = introParticles.filter(
    (p) =>
      p.life > 0 &&
      p.y > -60 &&
      p.x > -60 &&
      p.x < width + 60 &&
      p.y < height + 60
  );
}

function animateIntro(now) {
  if (!introCtx || !introCanvas || !introOverlay) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const delta = Math.min(0.033, ((now - introLastFrameTime) / 1000) || 0.016);
  introLastFrameTime = now;

  const closeProgress = introClosing
    ? Math.min(1, (now - introCloseStart) / INTRO_CLOSE_DURATION)
    : 0;

  const visibility = 1 - closeProgress;

  introCtx.clearRect(0, 0, width, height);
  drawMatrixLayer(width, height, visibility, delta);

  if (introParticles.length > 0) {
    drawDustLayer(visibility);
  }

  if (!introClosing || closeProgress < 1 || introParticles.length > 0) {
    introAnimationFrame = requestAnimationFrame(animateIntro);
  }
}

function closeIntroOverlay() {
  if (!introOverlay || introClosing) return;

  introClosing = true;
  introCloseStart = performance.now();
  introOverlay.classList.add("is-closing");
  introOverlay.setAttribute("aria-hidden", "true");
  spawnDustBurst();

  window.setTimeout(() => {
    document.body.classList.remove("intro-locked");
    if (introAnimationFrame) cancelAnimationFrame(introAnimationFrame);
    introOverlay.remove();
  }, INTRO_CLOSE_DURATION + 80);
}

function setupIntroOverlay() {
  if (!introOverlay) return;

  document.body.classList.add("intro-locked");
  introOverlay.setAttribute("aria-hidden", "false");

  resizeIntroCanvas();
  introAnimationFrame = requestAnimationFrame(animateIntro);

  const dismiss = (e) => {
    e?.preventDefault?.();
    closeIntroOverlay();
  };

  introOverlay.addEventListener("pointerup", dismiss, { once: true });

  introOverlay.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
      dismiss(e);
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeIntroOverlay();
  });

  window.addEventListener("resize", resizeIntroCanvas);
}

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
    page: "https://ethosempire.gumroad.com/l/architectureofhealth?layout=profile",
    link: "https://ethosempire.gumroad.com/l/architectureofhealth?layout=profile",
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
    title: "The Hair Care Blueprint",
    page: "https://ethosempire.gumroad.com/l/thehaircareblueprint?layout=profile",
    link: "https://ethosempire.gumroad.com/l/thehaircareblueprint?layout=profile",
    desc: "Take better care of your hair with a simple approach to grooming, maintenance, and a cleaner overall look.",
    preview: "Grooming • maintenance • cleaner look",
    image320: "images/ethos-empire-hair-care-blueprint-ebook-cover-320.webp",
    image1200: "images/ethos-empire-hair-care-blueprint-ebook-cover-1200.webp",
    alt: "The Hair Care Blueprint ebook cover grooming styling hair health"
  },
  {
    title: "Looksmaxxing Guide",
    page: "https://ethosempire.gumroad.com/l/looksmaxxingguide?layout=profile",
    link: "https://ethosempire.gumroad.com/l/looksmaxxingguide?layout=profile",
    desc: "Level up your appearance with a sharper approach to style, grooming, confidence, and self-presentation.",
    preview: "Style • grooming • confidence",
    image320: "images/ethos-empire-looksmaxxing-guide-ebook-cover-320.webp",
    image1200: "images/ethos-empire-looksmaxxing-guide-ebook-cover-1200.webp",
    alt: "Looksmaxxing Guide ebook cover style grooming attraction appearance"
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
    bar.style.transform = `scaleX(${progress})`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function setupRevealAnimations() {
  const nodes = document.querySelectorAll(".reveal-group > *");
  if (nodes.length === 0) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("fade-up"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("fade-up");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  nodes.forEach((node, index) => {
    node.style.animationDelay = `${index * 80}ms`;
    observer.observe(node);
  });
}

function setupPointerGlow(selector) {
  const cards = document.querySelectorAll(selector);

  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--glow-x", `${x}%`);
      card.style.setProperty("--glow-y", `${y}%`);
      card.style.setProperty("--shine-x", `${x}%`);
      card.style.setProperty("--shine-y", `${y}%`);
      card.style.setProperty("--card-glow-x", `${x}%`);
      card.style.setProperty("--card-glow-y", `${y}%`);
    });
  });
}

function setupTilt(selector) {
  if (prefersReducedMotion) return;

  const cards = document.querySelectorAll(selector);

  cards.forEach((card) => {
    const maxRotate = 5.5;

    const reset = () => {
      card.classList.remove("is-tilting");
      card.style.transform = "";
    };

    card.addEventListener("pointermove", (event) => {
      if (window.innerWidth < 768) return;
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * maxRotate * 2;
      const rotateX = (0.5 - py) * maxRotate * 2;
      card.classList.add("is-tilting");
      card.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
    });

    card.addEventListener("pointerleave", reset);
    card.addEventListener("pointercancel", reset);
  });
}

function applyCarouselStabilityStyles() {
  if (document.getElementById("carouselStabilityPatch")) return;

  const style = document.createElement("style");
  style.id = "carouselStabilityPatch";
  style.textContent = `
    .ebook-wrapper {
      scroll-behavior: auto !important;
      overscroll-behavior-x: contain;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y pinch-zoom;
      cursor: grab;
    }

    .ebook-wrapper.dragging {
      cursor: grabbing;
    }

    .ebook-card,
    .ebook-card:hover,
    .ebook-card.is-centered,
    .ebook-card.is-tilting {
      transform: none !important;
    }

    .ebook-card img,
    .ebook-card:hover img,
    .ebook-card.is-centered img {
      transform: none !important;
    }
  `;

  document.head.appendChild(style);
}

function createCarouselDots(wrapper, count) {
  if (!wrapper || count < 2) return null;
  let dots = wrapper.nextElementSibling;
  if (!dots || !dots.classList.contains("carousel-progress")) {
    dots = document.createElement("div");
    dots.className = "carousel-progress";
    wrapper.insertAdjacentElement("afterend", dots);
  }

  dots.innerHTML = Array.from({ length: count }, (_, index) =>
    `<span class="carousel-dot${index === 0 ? " is-active" : ""}" aria-hidden="true"></span>`
  ).join("");

  return dots;
}

function updateCenteredCard(wrapper, itemSelector, dots) {
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

  const realIndex = Number(closestCard?.dataset.loopIndex ?? 0);

  cards.forEach((card) => {
    card.classList.toggle("is-centered", card === closestCard);
  });

  if (dots) {
    dots.querySelectorAll(".carousel-dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === realIndex);
    });
  }

  return realIndex;
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

function bindCarouselCardEvents(track, selector, openModalCallback) {
  track.querySelectorAll(selector).forEach((card) => {
    const open = () => openModalCallback(Number(card.dataset.loopIndex));

    card.addEventListener("click", (e) => {
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
  const setWidth = Math.max(step * controller.count, 0);

  controller.cardStep = step;
  controller.setWidth = setWidth;

  if (!controller.initialized && setWidth > 0) {
    controller.wrapper.scrollLeft = setWidth;
    controller.initialized = true;
  }
}

function normalizeInfiniteScroll(controller) {
  if (!controller?.wrapper || !controller.setWidth) return;

  const min = controller.setWidth * 0.5;
  const max = controller.setWidth * 1.5;

  if (controller.wrapper.scrollLeft < min) {
    controller.wrapper.scrollLeft += controller.setWidth;
  } else if (controller.wrapper.scrollLeft > max) {
    controller.wrapper.scrollLeft -= controller.setWidth;
  }
}

function pauseCarousel(controller) {
  if (!controller) return;
  controller.isPaused = true;
  controller.resumeAt = 0;
}

function scheduleCarouselResume(controller, delay = 1000) {
  if (!controller) return;
  controller.isPaused = false;
  controller.resumeAt = performance.now() + delay;
}

function setupInfiniteCarousel(config) {
  const wrapper = $(config.wrapperId);
  const track = $(config.trackId);
  if (!wrapper || !track || config.items.length < 2) return null;

  const controller = {
    wrapper,
    track,
    count: config.items.length,
    speed: config.speed,
    direction: config.direction,
    dots: createCarouselDots(wrapper, config.items.length),
    itemSelector: ".ebook-card",
    rafId: 0,
    setWidth: 0,
    initialized: false,
    focusRaf: 0
  };

  const updateFocus = () => {
    cancelAnimationFrame(controller.focusRaf);
    controller.focusRaf = requestAnimationFrame(() => {
      updateCenteredCard(wrapper, controller.itemSelector, controller.dots);
    });
  };

  controller.updateFocus = updateFocus;
  carouselControllers.set(wrapper, controller);

  refreshCarouselMetrics(controller);
  normalizeInfiniteScroll(controller);
  updateFocus();

  const tick = () => {
    if (!prefersReducedMotion) {
      wrapper.scrollLeft += controller.speed * controller.direction;
      normalizeInfiniteScroll(controller);
    }

    controller.rafId = requestAnimationFrame(tick);
  };

  if (!prefersReducedMotion) {
    controller.rafId = requestAnimationFrame(tick);
  }

  wrapper.addEventListener("scroll", () => {
    normalizeInfiniteScroll(controller);
    updateFocus();
  }, { passive: true });

  window.addEventListener("resize", () => {
    refreshCarouselMetrics(controller);
    normalizeInfiniteScroll(controller);
    updateFocus();
  });

  window.addEventListener("load", () => {
    refreshCarouselMetrics(controller);
    normalizeInfiniteScroll(controller);
    updateFocus();
  });

  wrapper.querySelectorAll(controller.itemSelector).forEach((card) => {
    card.addEventListener("focusin", updateFocus);
    card.addEventListener("pointerenter", updateFocus);
  });

  return controller;
}

function setupCarouselFocus(wrapperId, itemSelector) {
  const wrapper = $(wrapperId);
  if (!wrapper) return null;

  const controller = carouselControllers.get(wrapper);
  if (controller) {
    controller.itemSelector = itemSelector;
    controller.updateFocus = () => updateCenteredCard(wrapper, itemSelector, controller.dots);
    controller.updateFocus();
    return controller;
  }

  const count = wrapper.querySelectorAll(itemSelector).length;
  const dots = createCarouselDots(wrapper, count);

  const update = () => updateCenteredCard(wrapper, itemSelector, dots);

  update();
  wrapper.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  window.addEventListener("resize", update);
  window.addEventListener("load", update);

  wrapper.querySelectorAll(itemSelector).forEach((card) => {
    card.addEventListener("focusin", update);
    card.addEventListener("pointerenter", update);
  });

  return { wrapper, dots, updateFocus: update };
}

function renderEbookCards() {
  const track = $("ebookTrack");
  if (!track) return;

  track.innerHTML = buildLoopedCarouselMarkup(ebookData, "ebook");
  bindCarouselCardEvents(track, "[data-ebook-index]", openEbookModal);
}

function renderMerchCards() {
  const track = $("merchTrack");
  if (!track) return;

  track.innerHTML = buildLoopedCarouselMarkup(merchData, "merch");
  bindCarouselCardEvents(track, "[data-merch-index]", openMerchModal);
}

function animateModalCopy(modalId) {
  const modal = $(modalId);
  const panel = modal?.querySelector(".modal-panel");
  if (!panel) return;

  panel.classList.remove("modal-animate");
  void panel.offsetWidth;
  panel.classList.add("modal-animate");
}

function setEbookModal(index) {
  const item = ebookData[index];
  if (!item) return;

  currentEbookIndex = index;

  const modalCover = $("ebookModalCover");
  modalCover.src = item.image1200 || item.image320;
  modalCover.srcset = `${item.image320} 320w, ${item.image1200} 1200w`;
  modalCover.sizes = "(max-width: 767px) 90vw, 280px";
  modalCover.alt = item.alt;

  $("ebookModalTitle").textContent = item.title;
  $("ebookModalDesc").textContent = item.desc;
  $("ebookModalPage").href = item.page;
  $("ebookModalBuy").href = item.link;

  animateModalCopy("ebookModal");
}

function setMerchModal(index) {
  const item = merchData[index];
  if (!item) return;

  currentMerchIndex = index;

  const modalCover = $("merchModalCover");
  modalCover.src = item.imageLarge || item.image;
  modalCover.srcset = `${item.image} 400w, ${item.imageLarge} 1200w`;
  modalCover.sizes = "(max-width: 767px) 90vw, 280px";
  modalCover.alt = item.alt;

  $("merchModalTitle").textContent = item.title;
  $("merchModalBuy").href = item.link;

  animateModalCopy("merchModal");
}

function openModal(modalId) {
  const modal = $(modalId);
  if (!modal) return;

  activeModal = modalId;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  const focusTarget = modal.querySelector(".modal-close");
  focusTarget?.focus({ preventScroll: true });
}

function closeModal(modalId) {
  const modal = $(modalId);
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  if (activeModal === modalId) {
    activeModal = null;
  }

  if (!document.querySelector(".modal-overlay.open")) {
    document.body.style.overflow = "";
  }
}

function openEbookModal(index) {
  setEbookModal(index);
  openModal("ebookModal");
}

function closeEbookModal() {
  closeModal("ebookModal");
}

function openMerchModal(index) {
  setMerchModal(index);
  openModal("merchModal");
}

function closeMerchModal() {
  closeModal("merchModal");
}

function nextEbook(delta) {
  currentEbookIndex = (currentEbookIndex + delta + ebookData.length) % ebookData.length;
  setEbookModal(currentEbookIndex);
}

function nextMerch(delta) {
  currentMerchIndex = (currentMerchIndex + delta + merchData.length) % merchData.length;
  setMerchModal(currentMerchIndex);
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

function setupDragScroll(el) {
  if (!el) return;

  const controller = carouselControllers.get(el);

  let isDown = false;
  let lastClientX = 0;
  let moved = false;

  const start = (clientX) => {
    isDown = true;
    moved = false;
    lastClientX = clientX;
    el.classList.add("dragging");
  };

  const move = (clientX) => {
    if (!isDown) return;

    const deltaX = clientX - lastClientX;
    lastClientX = clientX;

    if (Math.abs(deltaX) > 1) moved = true;

    el.scrollLeft -= deltaX * (window.innerWidth < 768 ? 1.1 : 0.95);

    if (controller) {
      normalizeInfiniteScroll(controller);
      controller.updateFocus?.();
    }
  };

  const end = () => {
    if (!isDown) return;
    isDown = false;
    el.classList.remove("dragging");

    if (controller) {
      normalizeInfiniteScroll(controller);
      controller.updateFocus?.();
    }
  };

  el.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    start(e.clientX);
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => move(e.clientX));
  window.addEventListener("mouseup", end);

  el.addEventListener("touchstart", (e) => {
    if (!e.touches[0]) return;
    start(e.touches[0].clientX);
  }, { passive: true });

  el.addEventListener("touchmove", (e) => {
    if (!e.touches[0]) return;
    move(e.touches[0].clientX);
  }, { passive: true });

  el.addEventListener("touchend", end);
  el.addEventListener("touchcancel", end);
  el.addEventListener("mouseleave", () => {
    if (isDown) end();
  });

  el.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (moved) {
        e.preventDefault();
        moved = false;
      }
    });
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

  cards.forEach((card) => {
    card.addEventListener("pointerenter", () => {
      cards.forEach((item) => item.classList.toggle("is-dim", item !== card));
      card.classList.add("is-active");
    });

    card.addEventListener("pointerleave", () => {
      updateActiveBubbleCard();
    });
  });

  const bubbleGrid = document.querySelector(".ethos-bubble-grid");
  bubbleGrid?.addEventListener("scroll", () => requestAnimationFrame(updateActiveBubbleCard), { passive: true });
  window.addEventListener("resize", updateActiveBubbleCard);
  window.addEventListener("scroll", () => requestAnimationFrame(updateActiveBubbleCard), { passive: true });

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

window.addEventListener("DOMContentLoaded", () => {
  applyCarouselStabilityStyles();
  setupIntroOverlay();
  ensureScrollProgress();

  renderEbookCards();
  renderMerchCards();

  setupInfiniteCarousel({
    wrapperId: "ebookWrapper",
    trackId: "ebookTrack",
    items: ebookData,
    speed: 0.55,
    direction: 1
  });

  setupInfiniteCarousel({
    wrapperId: "merchWrapper",
    trackId: "merchTrack",
    items: merchData,
    speed: 0.55,
    direction: -1
  });

  setupModalControls();
  setupRevealAnimations();

  setupDragScroll($("ebookWrapper"));
  setupDragScroll($("merchWrapper"));

  setupCarouselFocus("ebookWrapper", ".ebook-card");
  setupCarouselFocus("merchWrapper", ".ebook-card");

  setupPointerGlow(".soft-card, .ebook-card, .ethos-bubble-card");
  setupTilt(".soft-card");
  setupBubbleCards();
  setupFaqAccordion();
  setupStatCount();
});
