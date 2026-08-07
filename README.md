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
  home.css          backdrop, footer, cookie banner, homepage sections
  header.css        top bar, partner strip, partnership showcase
  animations.css    the reveal system
  legal.css         terms + privacy (shared)

js/
  site.js           shared behaviour: scroll progress, modals, reveal,
                    card hover/tilt, FAQ accordion
  catalog.js        ebook/merch data and carousel rendering
  matrix.js         background canvas — course pages only, NOT the homepage

course/
  course.css        course landing page
  course-merch.js   shared merch carousel for all 7 topic pages
  training-foundation/workout.css   shared styles for the 8 workout pages
```

### CSS load order matters

The homepage loads its stylesheets in exactly this order:

```
tailwind.css → tokens → base → components → overrides → home → header → animations
```

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
`.section-head` and `.partnership-card`, adds `.is-visible`, then unobserves.
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
The hero marquee is the only continuous animation on the site and it stops
under reduced motion too. Do not add more.

---

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
```

Worth checking by hand after any change: every page returns 200, no horizontal
scroll at 320px, and the reveal animation never leaves content invisible.

---

## Deployment

`.github/workflows/static.yml` publishes the repository root to GitHub Pages on
every push to `main`. **Pushing to `main` deploys to production immediately.**

The site sits behind Cloudflare. `ethosempire.org` currently 301-redirects to
`www.ethosempire.org`, while every canonical URL, `og:url` and sitemap entry in
this repo uses the bare host. Those disagree and it is an open decision — either
make the canonicals `www`, or change the redirect so bare is authoritative. Do
not change one without the other.

---

## Do not change without asking

Gumroad and Printful URLs, prices, checkout behaviour · legal wording in
`terms.html` and `privacy-policy.html` · the Ethos Empire × Ethos A.I
independence wording · course educational content · the unfinished Relationship
Upgrade material, which must not go live.
