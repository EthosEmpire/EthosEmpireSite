# Ethos Empire — ethosempire.org

Static marketing and content site for **Ethos Empire LLC**: ebooks, merch, and a
free knowledge library on discipline, confidence, health and legacy.

No build step, no framework, no backend. Plain HTML, CSS and JavaScript served
directly by GitHub Pages. Anything you can open in a browser is the real thing.

---

## Business rule that shapes the markup

**Ethos Empire LLC and Ethos A.I LLC are two separate, independent companies.**
They collaborate and promote each other. Nothing on this site may describe either
as the other's parent, subsidiary, owner, division, product, joint venture or
agent.

Approved phrasings already in use: *"Independent Brands. Shared Vision."*,
*"In partnership with Ethos A.I"*, *"Independent partner company"*. The full
clarification is Terms §9 (`terms.html#partnership`).

Ethos Empire is the primary brand here. The Ethos A.I orange and teal are scoped
to partnership surfaces only — the header chip, the hero strip and the
partnership card. They are never used for body text or general accents.

---

## Layout

```
index.html              homepage
bookstore.html          the full ebook collection
account.html            log in / create account (noindex, not in sitemap)
terms.html              Terms of Service
privacy-policy.html     Privacy Policy
logo/                   brand mark page
course/                 free knowledge library
sitemap.xml robots.txt site.webmanifest favicon.ico

css/
  tokens.css        design tokens — the ONLY :root on the site
  base.css          reset, document defaults, scroll progress bar
  components.css    cards, buttons, carousels, modal, FAQ
  overrides.css     legacy motion-polish layer (see below)
  home.css          backdrop base, footer, cookie banner, homepage sections
  header.css        top bar, primary nav, partner strip, partnership card
  animations.css    the reveal system + the drifting backdrop layers
  bookstore.css     the bookstore — shared by index.html and bookstore.html
  account.css       the account page
  legal.css         terms + privacy (shared)

js/
  site.js           shared behaviour: scroll progress, the modal
                    primitives, reveal, card hover/tilt, FAQ accordion
  ebook-data.js     THE ebook catalogue — the only place a book is defined
  bookstore.js      renders the catalogue + the book detail dialog
  firebase-config.js  THE only place Firebase is configured/initialised
  auth.js           every Firebase Auth call, plus neutral error wording
  auth-ui.js        account controls in the top bar (loads no Firebase SDK)
  account-page.js   drives account.html only
  catalog.js        merch data and the merch carousel
  cookie-consent.js the privacy preference notice
  matrix.js         background canvas — course pages only, NOT the homepage

course/
  course.css        course landing page
  course-merch.js   shared merch carousel for all 7 topic pages
  <topic>/styles.css                each topic's own theme (see below)
  training-foundation/workout.css   shared styles for the 8 workout pages

source-assets/      master artwork, git-ignored, never deployed
```

### Course themes: one stylesheet per topic, on purpose

The seven course topics do **not** share a stylesheet, and that is
deliberate. Measured across all seven, **zero** CSS rules are identical on
every page, and of the 71 selectors they have in common only 29 share
declarations — the rest differ on background, font-size, letter-spacing,
transition and shadow. They are seven different designs, not one design with
seven accent colours.

So each topic owns `course/<topic>/styles.css`. What genuinely *is* shared
lives in code, not CSS: `course/course-merch.js` (the merch carousel, proven
behaviourally identical across all seven) and `js/matrix.js` (the background
canvas). The eight workout pages are the opposite case — they were 96.8–100%
identical, so they share `training-foundation/workout.css`.

If you add a topic, give it its own `styles.css`. Do not try to merge them.

### CSS load order matters

The homepage loads its stylesheets in exactly this order:

```
tailwind.css → tokens → base → components → overrides → home → header → animations → bookstore
```

`bookstore.html` loads the same chain in the same order.

Reordering them changes which rules win. `overrides.css` in particular only
works because it comes straight after `components.css`.

`tokens.css` is the single source of truth for colour, surface, border, shadow
and motion. **Do not add a second `:root` block.** `legal.css` overrides four
token values for the darker legal surface and adds three legal-only tokens; that
is the one intentional exception and it is commented in the file.

### About `overrides.css`

Historical layer that refines the components above it. It used to win with two
dozen `!important` flags; all but three were proven redundant and removed. The
three that remain are load-bearing (`.soft-card` has to beat a later
`.pillar-card` rule under reduced motion).

It is still debt. Folding these rules back into their base components is a real
rewrite and deserves its own reviewed change, not a drive-by.

---

## The reveal system

One `IntersectionObserver` in `js/site.js` watches `.soft-card`,
`.section-head`, `.partnership-card` and `.reveal-block`, adds `.is-visible`,
then unobserves. `.reveal-block` is for wrappers whose contents are rendered
by JavaScript — the wrapper is in the HTML, so the observer sees it no matter
which script finishes first.
No scroll listeners, no polling. Only `opacity` and `transform` animate, so
there is no layout shift.

Two details that are easy to break:

- The hiding rules are scoped to `html.js-reveal`, set by a small inline script
  in `<head>` that runs before first paint and only when `IntersectionObserver`
  exists. That is the one piece of JavaScript deliberately left inline. Without
  it, a script failure would leave content permanently invisible.
- Elements already on screen at load get `.no-anim` so a mid-page refresh does
  not replay the animation.

The selector list is duplicated between `js/site.js` and `css/animations.css`.
Keep them in sync.

`prefers-reduced-motion` reveals everything immediately with no transitions.

The only continuous animations on the site are the hero marquee and the three
ambient backdrop layers (see below). Both stop under reduced motion. Do not
add more.

---

## The ebook catalogue

**`js/ebook-data.js` is the only place a book is defined.** The homepage
featured shelf and `bookstore.html` both render from it through
`js/bookstore.js`. No book title, cover, link, category or description is
written into either HTML file.

A page opts in with one attribute:

```html
<div class="book-grid" data-ebook-grid="featured">  <!-- featured only -->
<div class="book-grid" data-ebook-grid="all">       <!-- everything -->
```

`data-ebook-count` on any element is filled with the live number of books, so
headline counts cannot drift.

**To add a book:** export three covers into `images/` at 320×500, 640×1000 and
1200×1875, add one entry to `ebook-data.js`, add the covers to `sitemap.xml`,
and regenerate the JSON-LD block in `bookstore.html`. No HTML changes.

The 640 is generated from the 1200 master, not exported separately:

```bash
python3 -c "from PIL import Image; im=Image.open(SRC).convert('RGB'); \
  im.resize((640,1000), Image.LANCZOS).save(DST,'WEBP',quality=82,method=6)"
```

**To edit a summary or a purchase link:** change that one field. `summary` is
the card line, `description` is the dialog paragraph, `purchaseUrl` is every
Buy button for that title.

Three things worth knowing:

- **`purchaseUrl: null` or `status` other than `"available"`** removes the Buy
  button entirely and flips the badge to "Coming Soon". Never ship a button
  that looks live and goes nowhere, and never repeat the status twice on one
  card.
- **The Gumroad slug for The Architecture of Health is
  `thearchitechtureofhealth`.** That spelling is the published product's. The
  corrected spelling 404s — do not "fix" it.
- **Covers ship at 320w, 640w and 1200w, and `sizes` is measured, not
  guessed.** The three grids (homepage shelf, bookstore, course row) render
  at different widths so they carry three different `sizes` strings. If you
  change a grid's column count or max-width in `bookstore.css`, re-measure
  and update the matching string in `bookstore.js`, or the browser will pull
  the 86KB cover for a 230px slot.
- **Availability is data, not markup.** `status` drives the badge through
  one `STATUS_LABEL` map in `bookstore.js`. "Out Now" is never typed into a
  page. The badge sits beside the category and never over the artwork,
  because most of these covers carry their title across the top third.

The book detail dialog is built in JavaScript rather than pasted into both
pages. It reuses the shared modal shell, so scroll lock, focus trap, Escape
and focus restore all have one implementation in `js/site.js`.

The seven course topic pages render from the same catalogue. Each names the
books it wants and nothing else:

```html
<div class="ebook-row"
     data-ebook-row="clear-skin-guide,looksmaxxing-guide,architecture-of-health"
     data-ebook-base="../../"></div>
```

`data-ebook-base` is the path back to the site root, because those pages sit
two levels down and the catalogue stores root-relative cover paths. The markup
produced is identical to the hand-written cards it replaced, so all seven topic
designs render exactly as before.

---

## The ambient backdrop

Three layers of slow-moving light over a static gradient. No canvas, no
particles, no library, one extra DOM node.

```
.page-backdrop            static base gradient      css/home.css
.page-backdrop::before    cool navy aurora          css/animations.css
.backdrop-glow            warm gold light           css/animations.css
.backdrop-glow::after     one wide cool sheen       css/animations.css
.page-backdrop::after     static vignette, on top   css/home.css
```

Every colour, blur and cycle length is a token in `tokens.css` — retune there,
not in the keyframes.

**Two rules keep it premium rather than muddy, and both are about composition,
not numbers.**

1. *Keep the warm light's R/G ratio near 1.4.* A dark yellow **is** olive. A
   dim, wide, low-saturation gold wash over black cannot look like gold at any
   alpha — the first version tried exactly that and measured R/G 1.03, a flat
   khaki. Gold reads as gold only when it is small, brighter and biased to red.
2. *Keep the warm and cool lights apart.* Wherever a yellow falloff crosses a
   blue one the result is grey-green. The placements are deliberately
   asymmetric and both sources fall to transparent before they meet.

Three more things that are easy to get wrong here:

- **A `circle` radius may not be a percentage.** Writing one invalidates the
  whole `background` and the layer silently renders nothing. Sizes are in `vw`.
- **Gradient positions are percentages of the layer, not the screen.** The
  layers are `inset: 0` for exactly this reason; a negative inset makes the box
  150% of the viewport and every `at x% y%` lands somewhere else.
- **`alternate-reverse` is one hyphenated keyword.** As two words it is invalid,
  the whole `animation` shorthand resets, and the layer sits perfectly still
  while looking correct in the stylesheet.

Blur radius must stay well under the feature it softens or it erases it — the
warm light has its own much smaller `--light-blur-warm` for that reason.

Only `transform` and `opacity` animate, so every layer composites on the GPU
and none can cause layout shift. The vignette is painted above all three, so
text contrast never depends on where the lights happen to be. Phones drop the
sheen and use fewer, larger gradients. Reduced motion freezes everything and
keeps the colour.

`.page-backdrop` is `overflow: hidden` because the moving layers are inset
past its edges on purpose.

---

## The logo

`images/ethos-empire-logo.webp` is the one and only Ethos Empire mark. Every
place the logo appears — top bar, Join card, account page, favicons source,
Open Graph — points at that file.

**It ships with a solid black background and is used exactly as it is.** There
is no transparent export, and none should be made: the artwork is not to be
modified, recoloured or background-removed. An earlier attempt used
`mix-blend-mode: screen` to fake transparency; that is gone and must not come
back. It also fought the stacking context — an animated `transform` on any
ancestor silently turned the mark into a solid black square.

The black square is treated as an intentional emblem instead: rounded corners
and a soft gold glow, the same framing the mark already gets in the top bar.

- Join card styles — `css/home.css`, the `v6 — Homepage opening rebuild`
  block (`.join-card`, `.join-card-logo`, `.join-card-aura`)
- Account page logo — `css/account.css` (`.account-logo`)
- Markup — one `.join-card` block in `index.html`; there is no mobile copy

## Responsive testing

One markup structure serves every viewport; phones are handled with focused
media queries on the existing components, never with duplicate markup.

Verified at 320, 360, 375, 390, 430, 768, 1280 and 1920 across the homepage,
both account modes, the bookstore, a course page and both legal pages. The
check that matters is `scrollWidth > clientWidth`, ignoring anything clipped
by a scroller or an `overflow:hidden` ancestor — the merch carousels and the
backdrop light layers legitimately extend past their parents.

Two things bite at 320px specifically, and both have been fixed:

- `flex-wrap` on the nav rows. Four links total ~351px against a 292px
  container, and without wrapping they overflow the page rather than forming
  a second line.
- Non-breaking spaces. `A&nbsp;•&nbsp;B&nbsp;•&nbsp;C` is one unbreakable
  token; at 320px the hero eyebrow measured 315px of min-content and widened
  the whole grid. Bind the bullet to the word before it and use a normal
  space after: `A&nbsp;• B&nbsp;• C`.

---

## Accounts (Firebase Authentication)

`account.html` is the only page with an account system. It has three modes in
one page — `?mode=login`, `?mode=signup`, and a password-reset panel — plus a
verify-email state and a signed-in state.

### How it is wired

```
js/firebase-config.js   the six public config values + one initializeApp()
js/auth.js              every SDK call; translates errors to neutral wording
js/auth-ui.js           the top bar's Log In / Join the Empire controls
js/account-page.js      panels, validation, focus, messaging (account.html)
```

Firebase App + Auth are loaded as ES modules from `gstatic.com`, pinned to a
version. There is no build step and no npm dependency, matching the rest of the
site.

**The SDK loads on `account.html` only.** ~260KB to choose between the words
"Log In" and "My Account" on ten marketing pages is a bad trade, so those pages
read a `ee_auth_hint` value from `localStorage` that `account.html` keeps in
sync. That hint is a **display hint only** — it decides which two links to draw
and nothing else. It is not authorization and nothing is gated on it. If
protected content is ever added, it must be enforced with Firebase Security
Rules on the server.

### Providers

**Email/Password** and **Continue with Google**. Both verified enabled on the
project by read-only probe (a Facebook control returns `OPERATION_NOT_ALLOWED`,
Google returns a real OAuth `authUri`).

`Continue with Google` is deliberately not called "Login with Gmail" — a Google
account need not be a Gmail address. One helper (`continueWithGoogle`) serves
every device: popup first, redirect as the fallback when a browser blocks it.
No extra OAuth scopes are requested. Accounts are never merged: if the address
already exists under another method the visitor is told to use their original
method, and the message deliberately does not say which method that is.

**The Google button gates itself on the authorized-domain list.** Firebase
rejects OAuth from any origin not on that list, so `account.html` asks the
project for its own list on load and shows the button only when
`location.hostname` is on it. It fails closed. This means the button appears on
a new domain the moment you authorize it in Console — no code change, no
redeploy — and it never renders as a control that always errors.

> **`ethosempire.org` and `www.ethosempire.org` are NOT authorized yet.**
> Until they are, Google sign-in is hidden in production and only
> email/password works there. Email/password is not affected by this list.

### Two-factor authentication

Not implemented. Firebase TOTP MFA requires an Identity Platform upgrade, which
affects billing, and Identity Platform status cannot be read from the browser
with a web API key. Nothing in the UI mentions or offers 2FA. See the checklist
below before implementing it.

Never implement "email me a six-digit code" as a second factor: the same inbox
can already reset the password, so it is not independent.

### Console settings

Verified live from this codebase:

- the project is reachable and the web config is valid
- **Email/Password is enabled** — a failed sign-in returns
  `INVALID_LOGIN_CREDENTIALS`, not `OPERATION_NOT_ALLOWED`
- **email enumeration protection is on** — Firebase returns the same
  `INVALID_LOGIN_CREDENTIALS` for an unknown address as for a wrong password,
  and `sendOobCode` returns HTTP 200 for an unregistered address

- **Authorized domains** currently are: `localhost`,
  `ethos-empire.firebaseapp.com`, `ethos-empire.web.app`,
  `ethos-empire.netlify.app`. Read live from the project.

Still to confirm or change in the Firebase Console (cannot be done from code):

- **Add `ethosempire.org` and `www.ethosempire.org`** to authorized domains.
  Until then Google sign-in is hidden on the live site, and any email-action
  `continueUrl` pointing at those hosts would be rejected.
- **`ethos-empire.netlify.app`** is a leftover from the Netlify era. Remove it
  if Netlify is no longer used — every authorized domain is a valid OAuth
  redirect target.
- **Google provider support email** — check the correct address is selected.
- **Password policy** — set it deliberately. The signup form does not invent a
  client-side minimum; it surfaces whatever the project rejects, so the policy
  in the console *is* the policy.
- **Verification and password-reset email templates** — brand them, and set the
  sender name. They currently go out with Firebase defaults.
- **API key restrictions** — in Google Cloud Console, restrict the browser key
  to the Firebase APIs this site uses and to the site's HTTP referrers.
- **Security Rules** — no database or storage is used by this site, but confirm
  Firestore/Storage are not left open if they are enabled on the project.
- **App Check** — evaluate it if any Firebase resource beyond Auth is used.

**Before any TOTP work**, in order:

1. Check whether the project is on Identity Platform (Firebase Console →
   Authentication → Sign-in method → Advanced, or Google Cloud → Identity
   Platform). TOTP MFA does not exist without it.
2. Review the billing and quota change the upgrade brings. It is not free.
3. Enable the **TOTP** provider. Do **not** enable SMS.
4. Confirm email verification is required before enrollment.
5. Only then implement enrollment, the sign-in challenge and unenrollment.

Do not upgrade the project, enable billing, or change paid-service
configuration without the owner's explicit approval.

### Testing login safely

Do not create or delete real users without the owner's approval. A login attempt
with a deliberately wrong password is enough to prove the wiring end to end and
creates nothing:

```
account.html?mode=login  ->  any address + a wrong password
expect: "That email and password combination did not match an account."
```

### Never commit

The web config below is public by design and ships in every Firebase web app.
These are the things that must never appear in this repository:

- a Firebase **service-account JSON** or any Admin SDK credential
- the **Gemini / Google AI API key** — a different key entirely, and never
  allowed in browser code
- Netlify or other platform tokens
- user passwords, ID tokens or refresh tokens

The Admin SDK must never run in browser code.

### Display name

`displayName` is a profile label, nothing more. It is **not** unique, **not**
checked for availability, and **never** a login credential — people sign in with
their email address or with Google. Do not add username reservation, and do not
add Firestore just to hold names.

### Editing the account page text

Headings and sub-headings for each mode are the `HEADINGS` map at the top of
`js/account-page.js`. Everything else is plain markup in `account.html`.

Do not add claims about what an account unlocks. Nothing on this site is gated
behind one today, and both the Terms and the Privacy Policy say so.

---

## Privacy preference notice

`js/cookie-consent.js` plus the markup at the bottom of `index.html`.

**This site sets no cookies and loads no analytics.** There is no
`document.cookie` write anywhere, no tag manager, no pixels. Browser storage
is, in full: `ee_cookie_consent` (this notice), `ee_auth_hint` (which account
links to draw), and a Firebase Auth session — created only if a visitor chooses
to make an account, and removed on sign-out. None are cookies and none are used
for tracking. So it is a preference notice, not a consent platform — do not
describe it as one, and do not add buttons that claim to block tracking that
does not exist.

If optional analytics are ever added, they must read that key **before**
loading, or the control becomes fake.

One trap worth knowing: `.cookie-banner` sets `display: flex`, which beats the
user-agent `[hidden] { display: none }` rule. `css/home.css` therefore carries
an explicit `.cookie-banner[hidden] { display: none }`. Remove it and the
notice can never be dismissed.

## Conventions

**Images** — `lowercase-kebab-case.webp`, named for what the image shows
(`reverse-standing-wrist-curl.webp`, not `IMG_1234.webp`). No spaces, no
uppercase.

**GitHub Pages is case-sensitive; macOS is not.** This repo has
`core.ignorecase = true`, so a rename that changes *only* capitalisation will
silently not reach Git and you get images that work locally and 404 in
production. If you ever need one:

```bash
git -c core.ignorecase=false rm --cached images/OldName.webp
git -c core.ignorecase=false add images/oldname.webp
```

Always validate against `git ls-tree -r HEAD`, not the local filesystem.

**Don't rename published image URLs** just to satisfy the convention. A stable
imperfect URL beats a pretty broken one.

**Course URLs are public.** Do not move `course/<topic>/` or `terms.html` for
tidiness — that breaks indexed links.

---

## Running it locally

```bash
python3 -m http.server 8734
# http://127.0.0.1:8734/
```

## Validation before you commit

```bash
# JS syntax
for f in js/*.js course/*.js; do node --check "$f"; done

# CSS brace balance
for f in css/*.css; do echo -n "$f "; \
  echo "$(tr -cd '{' < $f | wc -c) $(tr -cd '}' < $f | wc -c)"; done

# case-sensitive check against what Git will actually deploy
git ls-tree -r --name-only HEAD | grep images/ | grep '[A-Z]'   # want no output

# the bookstore JSON-LD must still match the catalogue
node -e 'global.window={};require("./js/ebook-data.js");
  console.log(window.ebookData.length+" books")'
```

Worth checking by hand after any change: every page returns 200, no horizontal
scroll at 320px, and the reveal animation never leaves content invisible.

---

## Deployment

`.github/workflows/static.yml` publishes the repository root to GitHub Pages on
every push to `main`. **Pushing to `main` deploys to production immediately.**

The site sits behind Cloudflare. **`www.ethosempire.org` is canonical.**
`ethosempire.org` 301-redirects to it, so every canonical, `og:url`,
structured-data URL, sitemap entry and the robots.txt sitemap line uses the
`www` host. Keep it that way — mixing bare and `www` splits SEO signals.

Two links in the Terms and Privacy contact blocks still point at the bare host
because their visible text is approved legal copy; they resolve through the
redirect.

---

## Do not change without asking

Gumroad and Printful URLs, prices, checkout behaviour · legal wording in
`terms.html` and `privacy-policy.html` · the Ethos Empire × Ethos A.I
independence wording · course educational content · the unfinished Relationship
Upgrade material, which must not go live.
