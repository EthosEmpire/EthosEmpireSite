/* ==========================================================================
   Ethos Empire — account page controller
   --------------------------------------------------------------------------
   Drives account.html only. Every Firebase call goes through js/auth.js; this
   file owns panels, focus, validation and messaging.

   This is the one page that loads the Firebase SDK. Marketing pages paint
   their nav from a cached hint instead — see js/auth-ui.js for why.

   Panels are mutually exclusive: login | signup | reset | verify | account,
   plus `unconfigured` if the project has not been set up.

   Nothing here logs an email, password, token or user object.
   ========================================================================== */

import {
  completeRedirectSignIn,
  continueWithGoogle,
  createAccount,
  currentUser,
  describeAuthError,
  isFirebaseConfigured,
  isGoogleAvailable,
  isSilentAuthError,
  logIn,
  logOut,
  providerLabels,
  refreshUser,
  resendVerification,
  resetPassword,
  watchAuthState
} from "./auth.js";

const $ = (id) => document.getElementById(id);

const PANELS = {
  unconfigured: "panelUnconfigured",
  login: "panelLogin",
  signup: "panelSignup",
  reset: "panelReset",
  verify: "panelVerify",
  account: "panelAccount"
};

/* Heading and sub-heading are part of the mode, so the page reads correctly
   from the top rather than always saying "Join the Empire". */
const HEADINGS = {
  unconfigured: ["Your account", "This part of the site is not switched on yet."],
  login: ["Welcome back", "Log in to continue your journey."],
  signup: ["Join the Empire", "Create your Ethos Empire account or log in to continue your journey."],
  reset: ["Reset your password", "We will email you a link to set a new one."],
  verify: ["Almost there", "Confirm your email address to finish setting up your account."],
  account: ["Your account", "You are logged in to Ethos Empire."]
};

let currentMode = null;
/* Guards against a second submit while a request is in flight. */
let busy = false;

/* --------------------------------------------------------------------------
   Cooldowns
   --------------------------------------------------------------------------
   Firebase rate-limits these server-side, but a visitor who taps "resend"
   four times gets four emails and then a lockout. A visible countdown is
   kinder than a silent failure, and it stops accidental double taps.
   -------------------------------------------------------------------------- */

const COOLDOWN_SECONDS = 60;
const cooldowns = new Map();   /* key -> { until, timer } */

function cooldownRemaining(key) {
  const entry = cooldowns.get(key);
  if (!entry) return 0;
  return Math.max(0, Math.ceil((entry.until - Date.now()) / 1000));
}

/* Disables the button and counts down on its label, restoring it after. */
function startCooldown(key, button, label) {
  const existing = cooldowns.get(key);
  if (existing && existing.timer) clearInterval(existing.timer);

  const until = Date.now() + COOLDOWN_SECONDS * 1000;
  const original = label || (button && button.dataset.label) || (button && button.textContent);

  const tick = () => {
    const left = cooldownRemaining(key);
    if (!button) return;
    if (left <= 0) {
      const entry = cooldowns.get(key);
      if (entry && entry.timer) clearInterval(entry.timer);
      cooldowns.delete(key);
      button.disabled = false;
      button.textContent = original;
      button.removeAttribute("aria-disabled");
      return;
    }
    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
    button.textContent = `${original} (${left}s)`;
  };

  cooldowns.set(key, { until, timer: setInterval(tick, 1000) });
  tick();
}

/* --------------------------------------------------------------------------
   Status messages
   --------------------------------------------------------------------------
   One live region for the whole page. Tone is carried by a class AND by the
   wording, never by colour alone.
   -------------------------------------------------------------------------- */

function setStatus(message, tone) {
  const node = $("accountStatus");
  if (!node) return;

  if (!message) {
    node.hidden = true;
    node.textContent = "";
    node.className = "account-status";
    return;
  }

  node.className = "account-status is-" + (tone || "info");
  node.textContent = message;
  node.hidden = false;
}

function clearStatus() {
  setStatus("");
}

/* --------------------------------------------------------------------------
   Panels
   -------------------------------------------------------------------------- */

function showPanel(mode, options) {
  const opts = options || {};
  currentMode = mode;

  Object.keys(PANELS).forEach((key) => {
    const panel = $(PANELS[key]);
    if (panel) panel.hidden = key !== mode;
  });

  const heading = HEADINGS[mode];
  if (heading) {
    $("accountTitle").textContent = heading[0];
    $("accountSub").textContent = heading[1];
  }

  /* Keep the address bar honest so the page can be linked and reloaded in
     the same mode, without adding a history entry per toggle. */
  if (mode === "login" || mode === "signup") {
    const url = new URL(window.location.href);
    url.searchParams.set("mode", mode);
    url.searchParams.delete("action");
    window.history.replaceState({}, "", url);
  }

  if (!opts.keepStatus) clearStatus();

  /* Focus moves to the new panel's heading, so a screen reader announces
     where it has landed instead of silently staying put. Focus does not move
     on first load — that would yank the page away from the top. */
  if (opts.moveFocus) {
    const panel = $(PANELS[mode]);
    const title = panel && panel.querySelector(".account-panel-title");
    if (title) {
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
    }
  }
}

/* --------------------------------------------------------------------------
   Form helpers
   -------------------------------------------------------------------------- */

function setBusy(button, isBusy, busyLabel) {
  busy = isBusy;
  if (!button) return;

  if (isBusy) {
    button.dataset.label = button.textContent;
    button.textContent = busyLabel || "Working…";
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  } else {
    if (button.dataset.label) button.textContent = button.dataset.label;
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

function markInvalid(input, invalid) {
  if (!input) return;
  input.setAttribute("aria-invalid", invalid ? "true" : "false");
  input.classList.toggle("is-invalid", Boolean(invalid));
}

function clearInvalid(form) {
  form.querySelectorAll("[aria-invalid='true']").forEach((el) => markInvalid(el, false));
}

/* Focus the first field with a problem so keyboard users are taken straight
   to it rather than having to hunt. */
function fail(message, input) {
  setStatus(message, "error");
  markInvalid(input, true);
  if (input) input.focus();
}

/* --------------------------------------------------------------------------
   Password reveal
   -------------------------------------------------------------------------- */

function setupReveals() {
  document.querySelectorAll("[data-reveal]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = $(button.getAttribute("data-reveal"));
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
      button.setAttribute("aria-pressed", show ? "true" : "false");
      input.focus();
    });
  });
}

/* --------------------------------------------------------------------------
   Actions
   -------------------------------------------------------------------------- */

async function handleLogin(event) {
  event.preventDefault();
  if (busy) return;

  const form = event.currentTarget;
  clearInvalid(form);

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  if (!email) return fail("Please enter your email address.", $("loginEmail"));
  if (!password) return fail("Please enter your password.", $("loginPassword"));

  const button = $("loginSubmit");
  setBusy(button, true, "Logging in…");
  setStatus("Logging you in…", "info");

  try {
    await logIn({ email, password });
    /* watchAuthState decides which panel comes next. */
    $("loginPassword").value = "";
  } catch (error) {
    fail(describeAuthError(error), $("loginPassword"));
  } finally {
    setBusy(button, false);
  }
}

async function handleSignup(event) {
  event.preventDefault();
  if (busy) return;

  const form = event.currentTarget;
  clearInvalid(form);

  const displayName = $("signupName").value.trim();
  const email = $("signupEmail").value.trim();
  const password = $("signupPassword").value;
  const confirm = $("signupConfirm").value;
  const terms = $("signupTerms").checked;

  if (!displayName) return fail("Please enter the name you want to be known by.", $("signupName"));
  if (!email) return fail("Please enter your email address.", $("signupEmail"));
  if (!password) return fail("Please choose a password.", $("signupPassword"));
  if (password !== confirm) {
    markInvalid($("signupPassword"), true);
    return fail("Those two passwords do not match.", $("signupConfirm"));
  }
  if (!terms) {
    return fail("Please accept the Terms of Service and Privacy Policy to continue.", $("signupTerms"));
  }

  const button = $("signupSubmit");
  setBusy(button, true, "Creating account…");
  setStatus("Creating your account…", "info");

  try {
    const { verificationSent } = await createAccount({ displayName, email, password });

    /* Clear both password fields immediately. Nothing keeps a copy. */
    $("signupPassword").value = "";
    $("signupConfirm").value = "";

    setStatus(
      verificationSent
        ? "Account created. Check your email for a verification link."
        : "Account created. We could not send the verification email — you can resend it below.",
      "success"
    );
  } catch (error) {
    fail(describeAuthError(error), $("signupEmail"));
  } finally {
    setBusy(button, false);
  }
}

async function handleReset(event) {
  event.preventDefault();
  if (busy) return;

  const form = event.currentTarget;
  clearInvalid(form);

  const email = $("resetEmail").value.trim();
  if (!email) return fail("Please enter your email address.", $("resetEmail"));

  const button = $("resetSubmit");
  if (cooldownRemaining("reset") > 0) return;
  setBusy(button, true, "Sending…");

  const result = await resetPassword(email);
  setBusy(button, false);

  if (result.ok) {
    /* Deliberately neutral: the same sentence whether or not that address has
       an account, so this form cannot be used to discover who is registered. */
    setStatus(
      "If an account exists for that email, a password-reset link has been sent. Check your inbox and spam folder.",
      "success"
    );
    $("resetForm").reset();
    startCooldown("reset", button, "Send reset link");
  } else {
    fail(result.message, $("resetEmail"));
  }
}

async function handleLogout() {
  if (busy) return;
  busy = true;
  setStatus("Logging you out…", "info");
  try {
    await logOut();
    setStatus("You have been logged out.", "success");
  } catch (error) {
    setStatus(describeAuthError(error), "error");
  } finally {
    busy = false;
  }
}

async function handleVerifyRefresh() {
  if (busy) return;
  const button = $("verifyRefresh");
  setBusy(button, true, "Checking…");

  try {
    const user = await refreshUser();
    if (user && user.emailVerified) {
      applyUser(user);
      setStatus("Email verified. Your account is ready.", "success");
    } else {
      setStatus("Not verified yet. Open the link in your email, then try again.", "info");
    }
  } catch (error) {
    setStatus(describeAuthError(error), "error");
  } finally {
    setBusy(button, false);
  }
}

async function handleVerifyResend() {
  if (busy) return;
  const button = $("verifyResend");
  if (cooldownRemaining("verify") > 0) return;

  setBusy(button, true, "Sending…");

  try {
    await resendVerification();
    setStatus("Verification email sent. Check your inbox and spam folder.", "success");
    setBusy(button, false);
    startCooldown("verify", button, "Resend email");
  } catch (error) {
    setStatus(describeAuthError(error), "error");
    setBusy(button, false);
  }
}

/* --------------------------------------------------------------------------
   Continue with Google
   -------------------------------------------------------------------------- */

async function handleGoogle() {
  if (busy) return;
  const button = document.querySelector("[data-google-signin]");
  setBusy(button, true, "Opening Google…");
  clearStatus();

  try {
    const user = await continueWithGoogle();
    /* null means the visitor closed the chooser, or a redirect has started
       and this page is about to unload. Either way: say nothing. */
    if (!user) return;
    /* watchAuthState decides which panel comes next. */
  } catch (error) {
    if (!isSilentAuthError(error)) setStatus(describeAuthError(error), "error");
  } finally {
    setBusy(button, false);
  }
}

/* The Google button is absent from the page until we know this origin is on
   the project's authorized-domain list — a visible button that always fails
   is worse than no button. */
async function revealGoogleIfAllowed() {
  const block = document.querySelector("[data-google-block]");
  if (!block) return;
  try {
    if (await isGoogleAvailable()) block.hidden = false;
  } catch (_) { /* stays hidden */ }
}

/* --------------------------------------------------------------------------
   Password reset from inside the account
   -------------------------------------------------------------------------- */

async function handleChangePassword() {
  if (busy) return;
  const user = currentUser();
  if (!user || !user.email) return;

  const button = $("changePassword");
  if (cooldownRemaining("reset-account") > 0) return;

  setBusy(button, true, "Sending…");
  const result = await resetPassword(user.email);
  setBusy(button, false);

  if (result.ok) {
    setStatus("Password reset link sent to your email address.", "success");
    startCooldown("reset-account", button, "Send password reset email");
  } else {
    setStatus(result.message, "error");
  }
}

/* --------------------------------------------------------------------------
   Auth state
   -------------------------------------------------------------------------- */

/* Shows enough of the address to confirm which account this is, without
   printing it in full on a screen someone else might be looking at. */
function maskEmail(email) {
  if (!email || email.indexOf("@") < 1) return "Not set";
  const [name, domain] = email.split("@");
  const head = name.slice(0, name.length <= 2 ? 1 : 2);
  return `${head}${"•".repeat(Math.max(3, name.length - head.length))}@${domain}`;
}

function applyUser(user) {
  if (!user) return;

  const providers = providerLabels(user);
  const hasPassword = user.providerData.some((p) => p.providerId === "password");

  $("detailWelcome").textContent = user.displayName || "member";
  $("detailName").textContent = user.displayName || "Not set";
  $("detailEmail").textContent = maskEmail(user.email);
  $("detailVerified").textContent = user.emailVerified ? "Yes" : "Not yet";
  $("detailProvider").textContent = providers.length ? providers.join(", ") : "Not set";
  $("accountUnverifiedNote").hidden = Boolean(user.emailVerified);

  /* Only accounts that actually have a password can reset one. */
  $("passwordRow").hidden = !hasPassword;

  /* An unverified account is not presented as finished setup. */
  showPanel(user.emailVerified ? "account" : "verify", { keepStatus: true });
}

function onAuthState(user) {
  /* Tell the shared nav module, which mirrors this into the cached hint used
     by every other page. */
  if (window.ethosAuthUI) window.ethosAuthUI.setSignedIn(Boolean(user));

  if (user) {
    applyUser(user);
    return;
  }

  /* Signed out — fall back to whichever mode the URL asked for. */
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") === "signup" ? "signup" : "login";
  showPanel(mode, { keepStatus: true });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

function boot() {
  setupReveals();

  document.querySelectorAll("[data-goto]").forEach((button) => {
    button.addEventListener("click", () => {
      showPanel(button.getAttribute("data-goto"), { moveFocus: true });
    });
  });

  document.querySelectorAll("[data-action='logout']").forEach((button) => {
    button.addEventListener("click", handleLogout);
  });

  $("loginForm").addEventListener("submit", handleLogin);
  $("signupForm").addEventListener("submit", handleSignup);
  $("resetForm").addEventListener("submit", handleReset);
  $("verifyRefresh").addEventListener("click", handleVerifyRefresh);
  $("verifyResend").addEventListener("click", handleVerifyResend);
  $("changePassword").addEventListener("click", handleChangePassword);

  document.querySelectorAll("[data-google-signin]").forEach((button) => {
    button.addEventListener("click", handleGoogle);
  });

  if (!isFirebaseConfigured) {
    showPanel("unconfigured");
    return;
  }

  revealGoogleIfAllowed();

  /* If this load is the landing point of a Google redirect, resolve it once.
     Errors here are reported; a cancelled redirect stays silent. */
  completeRedirectSignIn().catch((error) => {
    if (!isSilentAuthError(error)) setStatus(describeAuthError(error), "error");
  });

  const params = new URLSearchParams(window.location.search);

  /* ?action=logout from the nav: sign out, then land on the login panel. */
  if (params.get("action") === "logout") {
    handleLogout();
  }

  /* Paint the requested mode straight away so the page is never blank while
     Firebase works out whether anyone is signed in. onAuthStateChanged
     corrects it a moment later if they are. */
  showPanel(params.get("mode") === "signup" ? "signup" : "login");

  watchAuthState(onAuthState);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
