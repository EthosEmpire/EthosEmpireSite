/* ==========================================================================
   Ethos Empire — account controls in the navigation
   --------------------------------------------------------------------------
   Renders the account slot in the top bar on every page, from one function.

   ---------------------------------------------------------------------------
   WHY THIS FILE DOES NOT LOAD THE FIREBASE SDK
   ---------------------------------------------------------------------------
   Firebase App + Auth is ~260KB. Loading it on the homepage, the bookstore,
   seven course pages and two legal pages — none of which do anything with an
   account — to decide between the words "Log In" and "My Account" would be a
   poor trade.

   So the nav reads a tiny cached hint from localStorage, written by
   account.html whenever the real auth state changes there. The hint is:

     - synchronous, so the correct nav paints on the first frame and the bar
       never shifts once auth resolves
     - a display hint ONLY

   It is NOT authorization, and nothing is gated on it. It decides which two
   links to show and nothing else. Anyone can set it in devtools; all they
   would achieve is showing themselves a "My Account" link that leads to a
   page which asks them to log in. Real state is established by
   onAuthStateChanged on account.html, which corrects the hint on arrival.

   If protected content is ever added it must be enforced with Firebase
   Security Rules on the server, never with this flag.
   ========================================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "ee_auth_hint";

  /* Written by account.html; read everywhere. Values: "in" | "out". */
  function readHint() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "in" ? "in" : "out";
    } catch (_) {
      /* Private mode or blocked storage — signed-out is the safe default. */
      return "out";
    }
  }

  function writeHint(signedIn) {
    try {
      window.localStorage.setItem(STORAGE_KEY, signedIn ? "in" : "out");
    } catch (_) { /* nothing to do */ }
  }

  /* Path back to the site root, so this works from /, /course/<topic>/ and
     /course/training-foundation/<muscle>/ without per-page configuration. */
  function basePath(slot) {
    return slot.getAttribute("data-auth-base") || "";
  }

  function render(slot, state) {
    var base = basePath(slot);

    if (state === "in") {
      slot.innerHTML =
        '<a class="topbar-account-link" href="' + base + 'account.html">My Account</a>' +
        '<a class="topbar-account-cta" href="' + base + 'account.html?action=logout">Log Out</a>';
    } else {
      slot.innerHTML =
        '<a class="topbar-account-link" href="' + base + 'account.html?mode=login">Log In</a>' +
        '<a class="topbar-account-cta" href="' + base + 'account.html?mode=signup">Join the Empire</a>';
    }

    /* Marks the slot as resolved so CSS can stop reserving space. */
    slot.setAttribute("data-auth-state", state);
  }

  function renderAll(state) {
    var slots = document.querySelectorAll("[data-auth-nav]");
    Array.prototype.forEach.call(slots, function (slot) {
      render(slot, state);
    });
  }

  /* Public surface, used by account.html once the real state is known. */
  window.ethosAuthUI = {
    /* Called from account.html's onAuthStateChanged handler. */
    setSignedIn: function (signedIn) {
      writeHint(signedIn);
      renderAll(signedIn ? "in" : "out");
    },
    readHint: readHint
  };

  /* Paint immediately from the hint — before first paint where possible, so
     there is no flash of the wrong control and no layout shift. */
  function init() {
    renderAll(readHint());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Another tab logging in or out updates this one. */
  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) renderAll(readHint());
  });
})();
