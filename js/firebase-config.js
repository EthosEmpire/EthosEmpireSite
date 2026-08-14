/* ==========================================================================
   Ethos Empire — Firebase configuration and initialisation
   --------------------------------------------------------------------------
   THE only place Firebase is configured or initialised. Import from here;
   never call initializeApp() anywhere else.

   ---------------------------------------------------------------------------
   ABOUT THESE VALUES
   ---------------------------------------------------------------------------
   This is the Firebase *web* configuration. It is designed to be public — it
   ships inside the JavaScript of every Firebase web app in existence and is
   visible to anyone who opens devtools. It is an identifier for the project,
   not a secret, and it grants no access on its own.

   What actually protects the project is, in order:
     1. Firebase Authentication settings (enabled providers, password policy,
        email enumeration protection)
     2. Authorized domains — an origin not on the list cannot use this config
     3. Security Rules on any database or storage the project later uses
     4. An API key restricted, in Google Cloud Console, to only the Firebase
        APIs this site needs

   Items 1-4 are Firebase Console work and are listed in README.md. They are
   NOT verified by this file.

   ---------------------------------------------------------------------------
   WHAT MUST NEVER GO IN THIS FILE, OR ANYWHERE IN THIS REPOSITORY
   ---------------------------------------------------------------------------
     - a Firebase service-account JSON key
     - any Admin SDK credential or private key
     - the Gemini / Google AI API key (that is a different key entirely and
       must never be exposed in a browser)
     - the Netlify token, or any other platform token
     - user passwords, ID tokens or refresh tokens

   The Admin SDK must never run in browser code.

   ---------------------------------------------------------------------------
   TO POINT THIS AT A DIFFERENT PROJECT
   ---------------------------------------------------------------------------
   Firebase Console -> Project settings -> Your apps -> Web app -> Config.
   Replace the six values below. Nothing else in the codebase changes.
   ========================================================================== */

import {
  initializeApp,
  getApp,
  getApps
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

/* Ethos Empire LLC — project "ethos-empire".
   This is the Ethos Empire project, not Ethos A.I. The two companies are
   separate and independent and do not share a Firebase project. */
export const firebaseConfig = {
  apiKey: "AIzaSyABZ1GlwOK1YizD1LzlGKHOZ6vUsUSW3sI",
  authDomain: "ethos-empire.firebaseapp.com",
  projectId: "ethos-empire",
  storageBucket: "ethos-empire.firebasestorage.app",
  messagingSenderId: "56025972719",
  appId: "1:56025972719:web:7d4f546719980cbe01c01a"
};

/* measurementId is deliberately omitted. It belongs to Google Analytics, and
   this site loads no analytics — see js/cookie-consent.js. Adding it here
   would not start Analytics on its own, but leaving it out keeps the config
   honest about what the site actually does. */

/* Lets the account page show a clean "not configured yet" state instead of
   throwing, if the values above are ever blanked out. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain &&
  firebaseConfig.appId
);

let cachedAuth = null;

/* Initialises exactly once per page.

   ES modules are singletons, so this module body runs once no matter how many
   files import it, and the getApps() guard covers the remaining case of some
   other script having initialised a default app first. */
export function getFirebaseAuth() {
  if (!isFirebaseConfigured) return null;
  if (cachedAuth) return cachedAuth;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  cachedAuth = getAuth(app);
  return cachedAuth;
}
