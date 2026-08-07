/* ==========================================================================
   Ethos Empire — privacy preference notice
   --------------------------------------------------------------------------
   WHAT THIS SITE ACTUALLY DOES

   ethosempire.org sets no cookies. A repository-wide search finds no
   document.cookie write anywhere, no analytics, no advertising pixels, no
   tag manager and no third-party embeds on this page. The only browser-side
   storage is the single localStorage key written here, and its only job is
   to remember whether this notice has been dismissed.

   So this is a preference notice, not a consent-management platform, and it
   is deliberately not described as one. Both choices record a preference:
   "essential" declines any future non-essential storage, "all" accepts it.
   If optional analytics are ever added they must read this value BEFORE
   loading. Nothing here gates a script today, because there is no script to
   gate - a button that claimed to block tracking that does not exist would
   be a fake control.

   Storage key: ee_cookie_consent   Values: "all" | "essential"
   ========================================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "ee_cookie_consent";
  var VALID = ["all", "essential"];
  var DISMISS_MS = 320;

  var banner = document.getElementById("cookieBanner");
  if (!banner) return;

  /* Guard against a second copy ever being initialised on the same page. */
  if (banner.dataset.consentReady === "true") return;
  banner.dataset.consentReady = "true";

  function readStored() {
    try {
      var v = window.localStorage.getItem(STORAGE_KEY);
      /* Treat anything we did not write - a legacy or corrupted value - as
         "no decision yet" and clear it, rather than silently trusting it. */
      if (v !== null && VALID.indexOf(v) === -1) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return v;
    } catch (e) {
      /* Private mode or storage disabled: show the notice, accept that the
         choice cannot persist. */
      return null;
    }
  }

  if (readStored() !== null) return;

  var lastFocused = null;
  var dismissTimer = null;

  function hide() {
    banner.hidden = true;
    banner.classList.remove("is-dismissing");
    document.removeEventListener("keydown", onKeydown);
  }

  function dismiss(value) {
    if (dismissTimer) return;              /* ignore double clicks */
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (e) { /* choice cannot persist; still dismiss for this visit */ }

    banner.classList.add("is-dismissing");
    dismissTimer = window.setTimeout(function () {
      dismissTimer = null;
      hide();
      /* Return focus to wherever the visitor was, so keyboard and screen
         reader users are not dropped at the top of the document. */
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }, DISMISS_MS);
  }

  function onKeydown(e) {
    if (e.key !== "Escape" && e.key !== "Esc") return;
    /* Escape declines rather than accepting - the conservative default. */
    dismiss("essential");
  }

  var acceptBtn = document.getElementById("cookieAccept");
  var declineBtn = document.getElementById("cookieDecline");

  if (acceptBtn) acceptBtn.addEventListener("click", function () { dismiss("all"); });
  if (declineBtn) declineBtn.addEventListener("click", function () { dismiss("essential"); });

  lastFocused = document.activeElement;
  banner.hidden = false;
  document.addEventListener("keydown", onKeydown);
})();
