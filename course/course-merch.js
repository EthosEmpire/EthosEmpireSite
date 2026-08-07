/* ==========================================================================
   Ethos Empire — shared course merch carousel
   --------------------------------------------------------------------------
   One implementation for all seven course topic pages. Previously each page
   carried its own copy of this logic inline; four were byte-identical and the
   other three were the same algorithm with different variable names. Every
   copy used the same hoodie list, item width (170), auto-scroll speed (0.4),
   momentum (x120), friction (0.95), drag threshold (10px), resume delay
   (2500ms) and Printful URL, so behaviour here is unchanged.

   Expects, on the page:
     #merchCarousel  outer element
     #merchTrack     inner track (populated here)

   Image paths are resolved relative to the PAGE, and every consumer lives at
   course/<topic>/, so "../../images/" is correct for all of them.

   Purchase destination is intentionally untouched.
   ========================================================================== */

(function () {
  "use strict";

  var carousel = document.getElementById("merchCarousel");
  var track = document.getElementById("merchTrack");
  if (!carousel || !track) return;

  var HOODIES = [
    { name: "Black",    img: "ethos-empire-hoodie-black-gold-logo-400.webp" },
    { name: "Bone",     img: "ethos-empire-hoodie-bone-gold-logo-400.webp" },
    { name: "Latte",    img: "ethos-empire-hoodie-latte-gold-logo-400.webp" },
    { name: "Lavender", img: "ethos-empire-hoodie-lavender-gold-logo-400.webp" },
    { name: "Navy",     img: "ethos-empire-hoodie-navy-gold-logo-400.webp" },
    { name: "Oatmeal",  img: "ethos-empire-hoodie-oatmeal-gold-logo-400.webp" },
    { name: "Vintage",  img: "ethos-empire-hoodie-vintage-gold-logo-400.webp" },
    { name: "White",    img: "ethos-empire-hoodie-white-gold-logo-400.webp" },
    { name: "Pink",     img: "ethos-empire-hoodie-pink-gold-logo-400.webp" }
  ];

  var SHOP_URL = "https://ethosempireo.printful.me/product/ethos-unisex-hoodie";
  var ITEM_WIDTH = 170;
  var AUTO_SPEED = 0.4;
  var DRAG_THRESHOLD = 10;
  var MOMENTUM_SCALE = 120;
  var FRICTION = 0.95;
  var RESUME_DELAY = 2500;
  var SET_COUNT = 3;

  var setWidth = HOODIES.length * ITEM_WIDTH;

  /* Respect a reduced-motion preference: the carousel stays fully usable by
     drag/swipe, it just does not drift on its own. */
  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) { /* matchMedia unavailable — keep default motion */ }

  /* ---------- build the track (SET_COUNT repetitions for a seamless loop) -- */

  for (var s = 0; s < SET_COUNT; s++) {
    HOODIES.forEach(function (hoodie) {
      var link = document.createElement("a");
      link.href = SHOP_URL;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "merch-item";
      link.draggable = false;
      link.innerHTML =
        '<img src="../../images/' + hoodie.img + '" alt="' + hoodie.name +
        ' Hoodie" loading="lazy" draggable="false">' +
        '<span class="merch-name">' + hoodie.name + '</span>' +
        '<span class="merch-buy">Buy →</span>';
      track.appendChild(link);
    });
  }

  /* ---------- state ---------- */

  var pos = 0;
  var isDown = false;
  var didDrag = false;
  var startX = 0;
  var startPos = 0;
  var velocity = 0;
  var lastX = 0;
  var lastTime = 0;
  var momentum = 0;
  var resumeTimer = null;
  var autoActive = !reduceMotion;

  function wrap(n) {
    while (n > 0) n -= setWidth;
    while (n < -setWidth * 2) n += setWidth;
    return n;
  }

  function render() {
    track.style.transform = "translateX(" + pos + "px)";
  }

  function tick() {
    if (!isDown) {
      if (Math.abs(momentum) > 0.3) {
        pos += momentum;
        momentum *= FRICTION;
      } else {
        momentum = 0;
        if (autoActive) pos -= AUTO_SPEED;
      }
      pos = wrap(pos);
    }
    render();
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  /* ---------- drag / swipe ---------- */

  function beginDrag(x) {
    isDown = true;
    didDrag = false;
    startX = x;
    lastX = x;
    startPos = pos;
    momentum = 0;
    velocity = 0;
    lastTime = Date.now();
    clearTimeout(resumeTimer);
    autoActive = false;
  }

  function moveDrag(x) {
    var delta = x - startX;
    if (Math.abs(delta) > DRAG_THRESHOLD) {
      didDrag = true;
      carousel.classList.add("is-dragging");
    }
    var now = Date.now();
    var dt = now - lastTime;
    if (dt > 0) {
      velocity = (x - lastX) / dt;
      lastX = x;
      lastTime = now;
    }
    pos = wrap(startPos + delta);
    render();
  }

  function endDrag() {
    isDown = false;
    carousel.classList.remove("is-dragging");
    momentum = velocity * MOMENTUM_SCALE;
    clearTimeout(resumeTimer);
    if (!reduceMotion) {
      resumeTimer = setTimeout(function () { autoActive = true; }, RESUME_DELAY);
    }
    setTimeout(function () { didDrag = false; }, 20);
  }

  /* Swallow the click that ends a drag so a swipe never opens the shop. */
  carousel.addEventListener("click", function (e) {
    if (didDrag) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  carousel.addEventListener("mousedown", function (e) { beginDrag(e.clientX); });
  window.addEventListener("mousemove", function (e) {
    if (isDown) {
      e.preventDefault();
      moveDrag(e.clientX);
    }
  });
  window.addEventListener("mouseup", function () { if (isDown) endDrag(); });

  carousel.addEventListener("touchstart", function (e) {
    beginDrag(e.touches[0].clientX);
  }, { passive: true });

  carousel.addEventListener("touchmove", function (e) {
    if (!isDown) return;
    moveDrag(e.touches[0].clientX);
    if (Math.abs(lastX - startX) > DRAG_THRESHOLD) e.preventDefault();
  }, { passive: false });

  carousel.addEventListener("touchend", function () { if (isDown) endDrag(); });
})();
