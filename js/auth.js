/* ==========================================================================
   Ethos Empire — authentication operations
   --------------------------------------------------------------------------
   Every call into Firebase Authentication goes through this module. The UI
   layers (js/auth-ui.js, account.html) never import the Firebase SDK
   directly, so the SDK version and the error handling live in one place.

   Deliberate choices:

   - Errors are translated into short, neutral sentences. Firebase's raw codes
     distinguish "no account with this email" from "wrong password", which
     hands an attacker a way to test whether an address is registered. Both
     map to the same message here. Firebase Console's own email enumeration
     protection should also be left ON — see README.md.
   - Nothing here logs an email, a password, a token or a user object.
   - No password is stored, cached or held after the call that uses it.
   ========================================================================== */

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

import { firebaseConfig, getFirebaseAuth, isFirebaseConfigured } from "./firebase-config.js";

export { isFirebaseConfigured };

/* --------------------------------------------------------------------------
   Error translation
   -------------------------------------------------------------------------- */

/* One message for every "those credentials did not work" case, so the form
   cannot be used to discover which addresses have accounts. */
const CREDENTIAL_FAILURE =
  "That email and password combination did not match an account. Please check both and try again.";

const MESSAGES = {
  "auth/invalid-email": "That does not look like a valid email address.",
  "auth/missing-email": "Please enter your email address.",
  "auth/user-disabled": "This account has been disabled. Contact info.ethosempire@gmail.com for help.",

  /* All four collapse to the same wording on purpose. */
  "auth/user-not-found": CREDENTIAL_FAILURE,
  "auth/wrong-password": CREDENTIAL_FAILURE,
  "auth/invalid-credential": CREDENTIAL_FAILURE,
  "auth/invalid-login-credentials": CREDENTIAL_FAILURE,

  "auth/email-already-in-use":
    "An account with that email already exists. Try logging in instead, or reset your password.",
  "auth/weak-password":
    "That password does not meet the password policy for this site. Please choose a stronger one.",
  "auth/password-does-not-meet-requirements":
    "That password does not meet the password policy for this site. Please choose a stronger one.",

  "auth/too-many-requests":
    "Too many attempts from this device. Please wait a few minutes and try again.",
  "auth/network-request-failed":
    "Could not reach the server. Check your connection and try again.",
  "auth/operation-not-allowed":
    "Email and password accounts are not enabled for this site yet.",
  "auth/unauthorized-domain":
    "This website address is not authorised for sign-in yet.",
  "auth/requires-recent-login":
    "For security, please log in again before making this change.",

  /* Google / OAuth.
     account-exists-with-different-credential is deliberately vague about
     WHICH method was used first. Naming it would confirm that the address
     has an account and reveal how it signs in. */
  "auth/account-exists-with-different-credential":
    "That email is already set up with a different sign-in method. Please use the method you signed up with.",
  "auth/popup-blocked":
    "Your browser blocked the sign-in window. Allow pop-ups for this site, or try again.",
  "auth/unauthorized-domain":
    "Google sign-in is not available on this address yet.",
  "auth/credential-already-in-use":
    "Those credentials are already linked to another account."
};

/* Cancelling a Google popup is a normal thing to do, not an error. These
   codes resolve to null so the UI can stay silent instead of showing an
   alarming message to someone who simply changed their mind. */
const SILENT_CODES = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/user-cancelled"
]);

export function isSilentAuthError(error) {
  return Boolean(error && SILENT_CODES.has(error.code));
}

export function describeAuthError(error) {
  const code = error && error.code ? error.code : "";
  if (MESSAGES[code]) return MESSAGES[code];
  /* Anything unmapped gets a generic sentence. The raw code is never shown,
     because some of them leak account existence or internal detail. */
  return "Something went wrong. Please try again in a moment.";
}

/* --------------------------------------------------------------------------
   Guard
   -------------------------------------------------------------------------- */

function requireAuth() {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase is not configured. See js/firebase-config.js.");
  }
  return auth;
}

/* --------------------------------------------------------------------------
   Operations
   -------------------------------------------------------------------------- */

/* Creates the account, sets the display name, and sends the verification
   email. The password is passed straight to Firebase and never retained.

   `displayName` and the verification email are best-effort: if either fails
   the account still exists, so the caller is told the signup succeeded rather
   than being shown an error for a partial success it cannot undo. */
export async function createAccount({ displayName, email, password }) {
  const auth = requireAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  const name = (displayName || "").trim();
  if (name) {
    try {
      await updateProfile(user, { displayName: name });
    } catch (_) { /* non-fatal — the account exists */ }
  }

  let verificationSent = false;
  try {
    await sendEmailVerification(user);
    verificationSent = true;
  } catch (_) { /* non-fatal — resend is offered in the UI */ }

  return { user, verificationSent };
}

/* --------------------------------------------------------------------------
   Continue with Google
   --------------------------------------------------------------------------
   One helper for every device. Popup first, because it keeps the visitor on
   the page and preserves whatever they had typed; redirect is the fallback
   when the browser refuses a popup, which is common on mobile Safari and in
   embedded webviews.

   Scopes: none added. The provider's defaults already cover what
   authentication needs. No contacts, Drive, Calendar, Gmail or anything
   beyond identity is requested, and nothing here reads Google profile data
   past the display name and email Firebase puts on the user object.

   Accounts are never silently merged. If Firebase reports the address is
   already registered under another method, the visitor is told to use their
   original method — linking would require recent authentication and is not
   implemented. See README.
   -------------------------------------------------------------------------- */

function googleProvider() {
  const provider = new GoogleAuthProvider();
  /* Always show the chooser rather than silently reusing a session, so
     someone on a shared device is not signed in as the previous person. */
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

/* Firebase rejects OAuth from any origin that is not on the project's
   authorized-domain list. Rather than duplicating that list in code — where
   it would drift — this asks the project itself, once per page load, and the
   UI hides the Google button when the answer is no.

   Fails closed: any error means the button stays hidden, because a visible
   button that always errors is worse than no button. */
let domainCheck = null;

export function isGoogleAvailable() {
  if (domainCheck) return domainCheck;

  domainCheck = (async () => {
    if (!isFirebaseConfigured) return false;
    try {
      const response = await fetch(
        "https://identitytoolkit.googleapis.com/v1/projects?key=" +
          encodeURIComponent(firebaseConfig.apiKey)
      );
      if (!response.ok) return false;
      const data = await response.json();
      const domains = Array.isArray(data.authorizedDomains) ? data.authorizedDomains : [];
      return domains.includes(window.location.hostname);
    } catch (_) {
      return false;
    }
  })();

  return domainCheck;
}

/* Resolves to a user, or null when the visitor cancelled or a redirect was
   started (in which case the page is about to navigate away). */
export async function continueWithGoogle() {
  const auth = requireAuth();

  try {
    const credential = await signInWithPopup(auth, googleProvider());
    return credential.user;
  } catch (error) {
    if (isSilentAuthError(error)) return null;

    /* Popup refused by the browser — fall back to the redirect flow. The
       page navigates away, so there is nothing to return. */
    if (
      error.code === "auth/popup-blocked" ||
      error.code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, googleProvider());
      return null;
    }

    throw error;
  }
}

/* Called once on load. Returns the user when the page is the landing point
   of a redirect sign-in, otherwise null. */
export async function completeRedirectSignIn() {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (error) {
    if (isSilentAuthError(error)) return null;
    throw error;
  }
}

/* Which methods the signed-in user actually has, for the account panel. */
export function providerLabels(user) {
  if (!user || !Array.isArray(user.providerData)) return [];
  const names = { "password": "Email and password", "google.com": "Google" };
  return user.providerData
    .map((p) => names[p.providerId] || p.providerId)
    .filter((v, i, a) => a.indexOf(v) === i);
}

export async function logIn({ email, password }) {
  const auth = requireAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logOut() {
  const auth = requireAuth();
  await signOut(auth);
}

/* Always resolves. The caller shows the same neutral confirmation whether or
   not the address is registered, so this form cannot enumerate accounts.
   A genuine failure is still surfaced for connection-level problems only. */
export async function resetPassword(email) {
  const auth = requireAuth();
  try {
    await sendPasswordResetEmail(auth, email);
    return { ok: true };
  } catch (error) {
    const code = error && error.code;
    if (code === "auth/network-request-failed" || code === "auth/too-many-requests") {
      return { ok: false, message: describeAuthError(error) };
    }
    /* auth/user-not-found and friends deliberately look identical to success. */
    return { ok: true };
  }
}

export async function resendVerification() {
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");
  await sendEmailVerification(user);
}

/* Firebase caches the verified flag on the client, so a user who has just
   clicked the link in their email still looks unverified until reloaded. */
export async function refreshUser() {
  const auth = requireAuth();
  const user = auth.currentUser;
  if (!user) return null;
  await user.reload();
  return auth.currentUser;
}

/* The single source of truth for who is signed in. Returns an unsubscribe. */
export function watchAuthState(callback) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export function currentUser() {
  const auth = getFirebaseAuth();
  return auth ? auth.currentUser : null;
}
