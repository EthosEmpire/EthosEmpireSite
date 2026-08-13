/* ==========================================================================
   Ethos Empire — bookstore rendering
   --------------------------------------------------------------------------
   Renders the catalogue in js/ebook-data.js and runs the book detail view.
   One implementation, used by both pages:

     index.html      <div class="book-grid" data-ebook-grid="featured">
     bookstore.html  <div class="book-grid" data-ebook-grid="all">

   The only difference between the two is that attribute. Add a grid with
   data-ebook-grid to any page that already loads this file and it fills
   itself — there is no per-page markup for a book anywhere on the site.

   Also fills any element carrying data-ebook-count with the live number of
   books, so headline counts cannot drift out of step with the catalogue.

   Depends on js/ebook-data.js for the data and on js/site.js for the shared
   modal primitives (scroll lock, focus trap, Escape, focus restore), so it
   must load after both. Everything it needs is guarded, so a failure in
   either one degrades to a static page rather than a broken one.
   ========================================================================== */

(function () {
  "use strict";

  var MODAL_ID = "bookModal";

  /* Fallback destination when a book has no checkout link of its own. Same
     store URL the site already uses elsewhere. */
  var STORE_URL = "https://ethosempire.gumroad.com/";

  /* ------------------------------------------------------------------
     Data helpers
     ------------------------------------------------------------------ */

  function allBooks() {
    var list = Array.isArray(window.ebookData) ? window.ebookData.slice() : [];
    return list.sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
  }

  function findBook(id) {
    var list = allBooks();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  /* A book is buyable only when the data says so AND a link actually
     exists. Both conditions, so removing a dead URL is enough to take a
     book off sale without having to remember to flip the status too. */
  function isBuyable(book) {
    return book.status === "available" &&
      typeof book.purchaseUrl === "string" &&
      book.purchaseUrl.length > 0;
  }

  /* The one place a status value becomes words. Every badge on the site —
     homepage shelf, bookstore, detail view, course pages — reads from
     here, so "Out Now" is never typed into a page. Add a status to the
     data and give it a label here; nothing else needs to change. */
  var STATUS_LABEL = {
    "available": "Out Now",
    "coming-soon": "Coming Soon"
  };

  function statusLabel(book) {
    return STATUS_LABEL[book.status] || STATUS_LABEL["coming-soon"];
  }

  function statusModifier(book) {
    return book.status === "available" ? "is-out" : "is-soon";
  }

  /* Sits in the card body next to the category, never on the artwork —
     a badge over the cover would land on the title text of most of these
     designs. */
  function statusBadge(book, cls) {
    return '<span class="' + cls + " " + statusModifier(book) + '">' +
      esc(statusLabel(book)) + "</span>";
  }

  /* The catalogue is authored in this repository, not user input, but the
     rendering path is innerHTML — so everything interpolated is escaped.
     A stray apostrophe or ampersand in a title stays cheap to fix. */
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ------------------------------------------------------------------
     Card
     ------------------------------------------------------------------ */

  /* Covers ship at 320w and 1200w only, so `sizes` has to be accurate or
     the browser downloads the 86KB cover for a 230px slot. These strings
     are measured, not guessed — they are the real rendered cover width at
     each breakpoint, and the two grids are different widths, so they get
     one string each.

       featured   2-up phone, 3-up from 768px, capped at ~300px
       all        2-up phone, 3-up tablet, 4-up desktop at ~230px

     If a grid's column count or max-width changes in css/bookstore.css,
     re-measure and update the matching string here. */
  var COVER_SIZES = {
    featured: "(max-width: 599px) 35vw, (max-width: 899px) 26vw, 305px",
    all:      "(max-width: 599px) 35vw, (max-width: 899px) 26vw, 235px",
    /* Course pages: three across on desktop inside a ~1000px column,
       one across capped at 280px on phones. */
    course:   "(max-width: 720px) 240px, 24vw"
  };

  function coverMarkup(book, sizes, base) {
    var p = base || "";
    return '<img src="' + esc(p + book.cover320) + '"' +
      ' srcset="' + esc(p + book.cover320) + " 320w, " +
        esc(p + book.cover640) + " 640w, " +
        esc(p + book.cover1200) + ' 1200w"' +
      ' sizes="' + esc(sizes) + '"' +
      ' alt="' + esc(book.alt) + '"' +
      /* Intrinsic ratio of the cover set. With the aspect-ratio box in CSS
         this reserves the exact slot, so covers never shift the grid. */
      ' width="320" height="500"' +
      ' loading="lazy" decoding="async">';
  }

  /* Buy control. A book without a link gets a plain pill, never a button
     that looks live and goes nowhere. */
  function buyMarkup(book) {
    /* No link means no control at all — never a button that looks live and
       goes nowhere. The status badge in the card body already reads
       "Coming Soon", so a second pill here would just repeat it, and
       Details simply takes the full width. */
    if (!isBuyable(book)) return "";

    return '<a class="book-buy-btn" href="' + esc(book.purchaseUrl) + '"' +
      ' target="_blank" rel="noopener noreferrer">' +
      'Buy<span class="sr-only"> ' + esc(book.title) + ' (opens in a new tab)</span>' +
      '</a>';
  }

  function cardMarkup(book, sizes) {
    var badge = book.featured
      ? '<span class="book-badge">Featured</span>'
      : "";

    var category = book.category
      ? '<p class="book-card-category">' + esc(book.category) +
        statusBadge(book, "book-badge-status") + "</p>"
      : "";

    var summary = book.summary
      ? '<p class="book-card-summary">' + esc(book.summary) + "</p>"
      : "";

    return '<article class="book-card" data-book-card="' + esc(book.id) + '">' +
      '<div class="book-card-cover">' + badge + coverMarkup(book, sizes) + "</div>" +
      '<div class="book-card-body">' +
        category +
        /* The title is a heading and it is always visible — it is never
           hidden behind a hover state and never only inside the modal. */
        '<h3 class="book-card-title">' + esc(book.title) + "</h3>" +
        summary +
      "</div>" +
      '<div class="book-card-actions">' +
        /* A real button, not the cover image. The cover is decorative
           here; every action on the card is its own labelled control. */
        '<button type="button" class="book-details-btn"' +
        ' data-book-open="' + esc(book.id) + '"' +
        ' aria-haspopup="dialog">' +
          'Details<span class="sr-only"> about ' + esc(book.title) + "</span>" +
        "</button>" +
        buyMarkup(book) +
      "</div>" +
    "</article>";
  }

  function emptyMarkup() {
    return '<p class="bookstore-empty">The collection could not be loaded. ' +
      'You can browse every Ethos Empire guide at ' +
      '<a href="' + STORE_URL + '" target="_blank" rel="noopener noreferrer">' +
      "our store</a>.</p>";
  }

  /* ------------------------------------------------------------------
     Grids
     ------------------------------------------------------------------ */

  function renderGrids() {
    var grids = document.querySelectorAll("[data-ebook-grid]");
    if (grids.length === 0) return false;

    var books = allBooks();
    var rendered = false;

    Array.prototype.forEach.call(grids, function (grid) {
      var featured = grid.dataset.ebookGrid === "featured";
      var sizes = featured ? COVER_SIZES.featured : COVER_SIZES.all;

      var list = featured
        ? books.filter(function (book) { return Boolean(book.featured); })
        : books;

      if (list.length === 0) {
        grid.innerHTML = emptyMarkup();
        return;
      }

      grid.innerHTML = list.map(function (book) {
        return cardMarkup(book, sizes);
      }).join("");
      rendered = true;
    });

    return rendered;
  }

  /* ------------------------------------------------------------------
     Course-page book rows
     --------------------------------------------------------------------
     The seven course topic pages each recommend three books. They used to
     hardcode the title, cover, summary and checkout link — 21 copies of
     data that also lives in the catalogue, and which quietly drifted:
     two pages said "Architecture of Health" where the published title is
     "The Architecture of Health".

     Now a page names the books it wants and nothing else:

       <div class="ebook-row"
            data-ebook-row="clear-skin-guide,looksmaxxing-guide,architecture-of-health"
            data-ebook-base="../../"></div>

     data-ebook-base is the path back to the site root, because these
     pages sit two levels down and the catalogue stores root-relative
     cover paths.

     The markup produced below is deliberately identical to what was there
     before — same classes, same order, same "Buy Now →" label — so all
     seven topic designs render exactly as they did.
     ------------------------------------------------------------------ */

  function courseCardMarkup(book, base) {
    var inner =
      coverMarkup(book, COVER_SIZES.course, base).replace(
        "<img ", '<img class="ebook-cover" ') +
      '<h3 class="ebook-name">' + esc(book.title) + "</h3>" +
      '<p class="ebook-desc">' + esc(book.summary) + "</p>" +
      statusBadge(book, "ebook-status");

    /* Buyable books keep the whole card as one link, which is what the
       existing course styles are built around. A book with no checkout
       link becomes a plain container instead of a link to nowhere. */
    if (!isBuyable(book)) {
      return '<div class="ebook-card is-unavailable">' + inner + "</div>";
    }

    return '<a href="' + esc(book.purchaseUrl) + '"' +
      ' target="_blank" rel="noopener noreferrer" class="ebook-card">' +
      inner +
      '<span class="ebook-buy">Buy Now <span aria-hidden="true">&rarr;</span>' +
      '<span class="sr-only"> — ' + esc(book.title) + ' (opens in a new tab)</span></span>' +
      "</a>";
  }

  function renderCourseRows() {
    var rows = document.querySelectorAll("[data-ebook-row]");
    if (rows.length === 0) return false;

    var rendered = false;

    Array.prototype.forEach.call(rows, function (row) {
      var base = row.getAttribute("data-ebook-base") || "";
      var ids = row.getAttribute("data-ebook-row").split(",");

      var html = ids.map(function (id) {
        var book = findBook(id.trim());
        /* An unknown id renders nothing rather than a broken card, and
           says so in the console so a typo is not silent. */
        if (!book) {
          if (window.console) console.warn("[bookstore] unknown book id:", id.trim());
          return "";
        }
        return courseCardMarkup(book, base);
      }).join("");

      if (html) {
        row.innerHTML = html;
        rendered = true;
      }
    });

    return rendered;
  }

  function renderCounts() {
    var total = allBooks().length;
    if (total === 0) return;

    var nodes = document.querySelectorAll("[data-ebook-count]");
    Array.prototype.forEach.call(nodes, function (node) {
      node.textContent = String(total);
    });
  }

  /* ------------------------------------------------------------------
     Detail view
     --------------------------------------------------------------------
     Built once, in JavaScript, so the panel markup does not have to be
     pasted into every page that shows books. The shell classes are the
     site's existing modal system, so it inherits the open/close
     animation, the backdrop and the reduced-motion handling for free.
     ------------------------------------------------------------------ */

  function buildModal() {
    if (document.getElementById(MODAL_ID)) return document.getElementById(MODAL_ID);

    var overlay = document.createElement("div");
    overlay.id = MODAL_ID;
    overlay.className = "modal-overlay book-modal";
    overlay.setAttribute("aria-hidden", "true");

    overlay.innerHTML =
      '<div class="modal-panel book-modal-panel" role="dialog" aria-modal="true"' +
      ' aria-labelledby="bookModalTitle">' +
        '<button type="button" class="modal-close" data-book-close' +
        ' aria-label="Close book details">&times;</button>' +
        '<div class="modal-grid book-modal-grid">' +
          '<div class="book-modal-cover-wrap">' +
            '<img id="bookModalCover" class="book-modal-cover" src="" alt=""' +
            ' width="320" height="500" decoding="async">' +
          "</div>" +
          '<div class="book-modal-body">' +
            '<p class="modal-meta" id="bookModalCategory"></p>' +
            '<h2 class="modal-title" id="bookModalTitle"></h2>' +
            '<p class="book-modal-summary" id="bookModalSummary"></p>' +
            '<p class="modal-desc" id="bookModalDesc"></p>' +
            '<div class="book-modal-topics" id="bookModalTopics" hidden>' +
              '<h3 class="book-modal-topics-title">Main topics</h3>' +
              '<ul class="book-modal-topics-list" id="bookModalTopicsList"></ul>' +
            "</div>" +
            '<p class="book-modal-reader" id="bookModalReader" hidden></p>' +
            '<div class="modal-actions book-modal-actions" id="bookModalActions"></div>' +
          "</div>" +
        "</div>" +
      "</div>";

    document.body.appendChild(overlay);
    return overlay;
  }

  function fillTopics(book) {
    var wrap = document.getElementById("bookModalTopics");
    var list = document.getElementById("bookModalTopicsList");
    if (!wrap || !list) return;

    var topics = Array.isArray(book.topics) ? book.topics : [];

    if (topics.length === 0) {
      wrap.hidden = true;
      list.innerHTML = "";
      return;
    }

    list.innerHTML = topics.map(function (topic) {
      return "<li>" + esc(topic) + "</li>";
    }).join("");
    wrap.hidden = false;
  }

  function fillReader(book) {
    var node = document.getElementById("bookModalReader");
    if (!node) return;

    if (!book.reader) {
      node.hidden = true;
      node.innerHTML = "";
      return;
    }

    node.innerHTML = "<b>Who it is for:</b> " + esc(book.reader);
    node.hidden = false;
  }

  function fillActions(book) {
    var actions = document.getElementById("bookModalActions");
    if (!actions) return;

    if (isBuyable(book)) {
      actions.innerHTML =
        '<a class="modal-buy" href="' + esc(book.purchaseUrl) + '"' +
        ' target="_blank" rel="noopener noreferrer">' +
        'Buy Now<span class="sr-only"> — ' + esc(book.title) +
        " (opens in a new tab)</span></a>";
      return;
    }

    actions.innerHTML =
      '<span class="book-status">Coming Soon</span>' +
      '<p class="book-modal-note">This guide is not on sale yet. ' +
      'Everything currently available is in ' +
      '<a href="' + STORE_URL + '" target="_blank" rel="noopener noreferrer">' +
      "the Ethos Empire store</a>.</p>";
  }

  function openBook(id) {
    var book = findBook(id);
    if (!book || typeof window.openModal !== "function") return;

    var cover = document.getElementById("bookModalCover");
    if (cover) {
      cover.src = book.cover1200 || book.cover320;
      cover.srcset = book.cover320 + " 320w, " + book.cover1200 + " 1200w";
      cover.sizes = "(max-width: 767px) 66vw, 230px";
      cover.alt = book.alt || "";
    }

    var category = document.getElementById("bookModalCategory");
    var title = document.getElementById("bookModalTitle");
    var summary = document.getElementById("bookModalSummary");
    var desc = document.getElementById("bookModalDesc");

    if (category) {
      category.innerHTML = esc(book.category || "Ethos Empire Bookstore") +
        statusBadge(book, "book-badge-status");
    }
    if (title) title.textContent = book.title;
    if (summary) summary.textContent = book.summary || "";
    if (desc) desc.textContent = book.description || "";

    fillTopics(book);
    fillReader(book);
    fillActions(book);

    window.openModal(MODAL_ID);
  }

  function closeBook() {
    if (typeof window.closeModal === "function") {
      window.closeModal(MODAL_ID);
    }
  }

  /* ------------------------------------------------------------------
     Wiring
     ------------------------------------------------------------------ */

  function bindEvents() {
    /* Delegated, so re-rendering a grid never needs re-binding. Enter and
       Space come free with a real <button>; Escape and the focus trap come
       from js/site.js. */
    document.addEventListener("click", function (event) {
      var opener = event.target.closest("[data-book-open]");
      if (opener) {
        openBook(opener.getAttribute("data-book-open"));
        return;
      }

      if (event.target.closest("[data-book-close]")) {
        closeBook();
      }
    });

    var overlay = document.getElementById(MODAL_ID);
    if (overlay) {
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) closeBook();
      });
    }
  }

  function init() {
    renderCounts();

    /* Course pages get rows of plain linked cards and no detail view —
       they are recommendations inside a lesson, not a shop. */
    renderCourseRows();

    var rendered = renderGrids();
    if (!rendered) return;

    buildModal();
    bindEvents();

    /* Cards are created after js/site.js has already run, so the shared
       pointer-glow pass has to be applied to them here. */
    if (typeof window.setupPointerGlow === "function") {
      window.setupPointerGlow(".book-card");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
