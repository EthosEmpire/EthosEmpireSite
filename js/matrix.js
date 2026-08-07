
const pageMatrixCanvas = document.getElementById("pageMatrixCanvas");
const pageMatrixCtx = pageMatrixCanvas ? pageMatrixCanvas.getContext("2d") : null;

const MATRIX_CHARSET = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ0123456789<>+-=*";

/* Detected once at load — drives every mobile optimisation below */

let pageMatrixFontSize = 14;
let pageMatrixColumns = [];
let pageMatrixLastFrameTime = 0;
let pageMatrixAnimationFrame = 0;
let pageMatrixEventsBound = false;
let pageMatrixTime = 0;

function randomMatrixChar() {
  return MATRIX_CHARSET[Math.floor(Math.random() * MATRIX_CHARSET.length)];
}

function isMobileMatrixDevice() {
  return (
    window.matchMedia("(hover: none)").matches ||
    window.matchMedia("(pointer: coarse)").matches ||
    window.innerWidth < 768
  );
}

function createPageColumn(x, height, isMobile) {
  const depthRoll = Math.random();
  const depth = depthRoll > 0.7 ? 2 : depthRoll > 0.32 ? 1 : 0;

  const sizeScale = depth === 2 ? 1.28 : depth === 1 ? 0.95 : 0.65;
  const speedBase = isMobile
    ? (depth === 2 ? 20 : depth === 1 ? 13 : 7.5)
    : (depth === 2 ? 30 : depth === 1 ? 20 : 12);
  const speedRange = isMobile
    ? (depth === 2 ? 6 : depth === 1 ? 4 : 2.5)
    : (depth === 2 ? 9 : depth === 1 ? 6 : 3.5);
  const lengthBase = isMobile
    ? (depth === 2 ? 20 : depth === 1 ? 14 : 9)
    : (depth === 2 ? 28 : depth === 1 ? 20 : 12);
  const lengthRange = isMobile
    ? (depth === 2 ? 8 : depth === 1 ? 6 : 4)
    : (depth === 2 ? 12 : depth === 1 ? 8 : 5);

  return {
    x,
    baseX: x,
    y: Math.random() * (height + 400) - 400,
    speed: speedBase + Math.random() * speedRange,
    length: lengthBase + Math.floor(Math.random() * lengthRange),
    glyphs: Array.from({ length: 48 }, randomMatrixChar),
    depth,
    sizeScale,
    headBoost: depth === 2 ? 1.25 : depth === 1 ? 1 : 0.65,
    trailBoost: depth === 2 ? 1.15 : depth === 1 ? 0.88 : 0.5,
    blur: depth === 2 ? 10 : depth === 1 ? 4 : 0.8,
    drift: depth === 2 ? 4 : depth === 1 ? 2 : 0.6,
    phase: Math.random() * Math.PI * 2,
    swaySpeed: depth === 2 ? 0.35 : depth === 1 ? 0.24 : 0.15
  };
}

function resizePageMatrixCanvas() {
  if (!pageMatrixCanvas || !pageMatrixCtx) return;

  const isMobile = isMobileMatrixDevice();
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  const width = window.innerWidth;
  const height = window.innerHeight;

  pageMatrixCanvas.width = Math.floor(width * dpr);
  pageMatrixCanvas.height = Math.floor(height * dpr);
  pageMatrixCanvas.style.width = `${width}px`;
  pageMatrixCanvas.style.height = `${height}px`;

  pageMatrixCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  pageMatrixFontSize = isMobile
    ? Math.max(10, Math.min(13, width / 92))
    : Math.max(13, Math.min(16, width / 112));

  /* Mobile: wider column spacing = fewer columns total = less GPU work */
  const spacing = pageMatrixFontSize * (isMobile ? 1.6 : 0.78);
  const cols = Math.ceil(width / spacing) + (isMobile ? 2 : 12);

  pageMatrixColumns = Array.from({ length: cols }, (_, i) =>
    createPageColumn(i * spacing, height, isMobile)
  );

  pageMatrixTime = 0;
  pageMatrixLastFrameTime = performance.now();
}

function drawPageMatrixLayer(width, height, delta) {
  if (!pageMatrixCtx) return;

  const isMobile = isMobileMatrixDevice();
  pageMatrixTime += delta;

  const headAlphaBase  = isMobile ? 0.28 : 0.65;   /* mobile: subtle, not distracting */
  const trailAlphaBase = isMobile ? 0.10 : 0.30;
  const fadeFill       = isMobile ? 0.10 : 0.045;

  pageMatrixCtx.clearRect(0, 0, width, height);
  pageMatrixCtx.fillStyle = `rgba(0, 0, 0, ${fadeFill})`;
  pageMatrixCtx.fillRect(0, 0, width, height);
  pageMatrixCtx.textBaseline = "top";

  /* shadowBlur removed from inner loop — it forces a full GPU composite
     pass per draw call. Colour alpha provides the glow at zero GPU cost. */
  pageMatrixCtx.shadowBlur = 0;

  for (const col of pageMatrixColumns) {
    const fontSize = pageMatrixFontSize * col.sizeScale;
    const step = fontSize * 1.06;
    const x = col.baseX + Math.sin(pageMatrixTime * col.swaySpeed + col.phase) * col.drift;

    pageMatrixCtx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

    for (let i = 0; i < col.length; i += 1) {
      const y = col.y - i * step;
      if (y < -60 || y > height + 60) continue;

      if (Math.random() > 0.968) {
        col.glyphs[i % col.glyphs.length] = randomMatrixChar();
      }

      const trailStrength = 1 - i / col.length;

      if (i === 0) {
        pageMatrixCtx.fillStyle = `rgba(245, 255, 248, ${(headAlphaBase * col.headBoost).toFixed(3)})`;
      } else if (i <= 2) {
        const subFade = i === 1 ? 0.68 : 0.44;
        pageMatrixCtx.fillStyle = `rgba(195, 255, 215, ${(headAlphaBase * subFade * col.headBoost).toFixed(3)})`;
      } else {
        pageMatrixCtx.fillStyle = `rgba(100, 220, 150, ${(trailAlphaBase * trailStrength * col.trailBoost).toFixed(3)})`;
      }

      pageMatrixCtx.fillText(col.glyphs[i % col.glyphs.length], x, y);
    }

    col.y += col.speed * delta;

    if (col.y - col.length * step > height + 100) {
      const reset = createPageColumn(col.baseX, height, isMobile);
      col.y = -Math.random() * 350;
      col.speed = reset.speed;
      col.length = reset.length;
      col.glyphs = reset.glyphs;
      col.depth = reset.depth;
      col.sizeScale = reset.sizeScale;
      col.headBoost = reset.headBoost;
      col.trailBoost = reset.trailBoost;
      col.blur = reset.blur;
      col.drift = reset.drift;
      col.phase = reset.phase;
      col.swaySpeed = reset.swaySpeed;
    }
  }
}

function animatePageMatrix(now) {
  if (!pageMatrixCtx || !pageMatrixCanvas) return;

  /* 20 fps cap on mobile, 30 fps on desktop — background matrix is decorative,
     lower fps is unnoticeable but cuts GPU cost significantly on phones. */
  const fpsCap = (window.innerWidth <= 767 && window.matchMedia('(pointer: coarse)').matches)
    ? 50   /* ~20 fps */
    : 33;  /* ~30 fps */

  if (now - pageMatrixLastFrameTime < fpsCap) {
    pageMatrixAnimationFrame = requestAnimationFrame(animatePageMatrix);
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const delta = Math.min(0.033, ((now - pageMatrixLastFrameTime) / 1000) || 0.016);
  pageMatrixLastFrameTime = now;

  drawPageMatrixLayer(width, height, delta);
  pageMatrixAnimationFrame = requestAnimationFrame(animatePageMatrix);
}

function stopPageMatrix() {
  if (pageMatrixAnimationFrame) {
    cancelAnimationFrame(pageMatrixAnimationFrame);
    pageMatrixAnimationFrame = 0;
  }
}

function startPageMatrix() {
  if (!pageMatrixCanvas || !pageMatrixCtx) return;

  pageMatrixCanvas.style.display = "block";
  resizePageMatrixCanvas();
  stopPageMatrix();
  pageMatrixAnimationFrame = requestAnimationFrame(animatePageMatrix);
}

function setupPageMatrix() {
  if (!pageMatrixCanvas || !pageMatrixCtx) return;

  const isPhone = window.innerWidth <= 767 &&
    window.matchMedia('(pointer: coarse)').matches;

  if (isPhone) {
    /* Enable a very light background matrix on mobile instead of hiding it.
       Low opacity + 20 fps cap keeps CPU/GPU cost well below the old desktop
       version, so Lighthouse scores are not affected. */
    pageMatrixCanvas.style.display = 'block';
    pageMatrixCanvas.style.opacity = '0.20';
  }

  startPageMatrix();

  if (pageMatrixEventsBound) return;
  pageMatrixEventsBound = true;

  window.addEventListener("resize", resizePageMatrixCanvas);
  window.addEventListener("orientationchange", () => {
    window.setTimeout(() => {
      resizePageMatrixCanvas();
    }, 120);
  });

  window.addEventListener("pageshow", () => {
    resizePageMatrixCanvas();
    if (!pageMatrixAnimationFrame) {
      pageMatrixAnimationFrame = requestAnimationFrame(animatePageMatrix);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopPageMatrix();
      return;
    }

    resizePageMatrixCanvas();
    if (!pageMatrixAnimationFrame) {
      pageMatrixAnimationFrame = requestAnimationFrame(animatePageMatrix);
    }
  });
}

window.setupPageMatrix = setupPageMatrix;

document.addEventListener("DOMContentLoaded", () => {
  setupPageMatrix();
});