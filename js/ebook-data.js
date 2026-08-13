/* ==========================================================================
   Ethos Empire — ebook catalogue
   --------------------------------------------------------------------------
   THE single source of truth for every ebook on the site. Both the featured
   shelf on index.html and the full collection on bookstore.html render from
   this one array, through js/bookstore.js. Nothing else defines a book.

   ---------------------------------------------------------------------------
   TO ADD A BOOK
   ---------------------------------------------------------------------------
   1. Export three covers into images/, following the existing names:
        ethos-empire-<slug>-ebook-cover-320.webp    (320 x 500)
        ethos-empire-<slug>-ebook-cover-640.webp    (640 x 1000)
        ethos-empire-<slug>-ebook-cover-1200.webp   (1200 x 1875)
      The 640 is generated from the 1200 master:
        python3 -c "from PIL import Image; im=Image.open(SRC).convert('RGB'); \
          im.resize((640,1000), Image.LANCZOS).save(DST,'WEBP',quality=82,method=6)"
      Keep the 16:25 shape. The grid reserves that box before the image
      loads, so an off-ratio cover is the one thing that will look wrong.
   2. Copy the block below, fill in every field, and set `order` to the
      position you want it in.
   3. Add the 1200 cover and the new page URL to sitemap.xml.

   That is the whole job. No HTML changes, on either page.

   ---------------------------------------------------------------------------
   TO EDIT A BOOK
   ---------------------------------------------------------------------------
   Change the field here. `summary` is the line on the card, `description`
   is the paragraph in the detail view, `purchaseUrl` is every Buy button
   for that title. Each appears exactly once in this file.

   ---------------------------------------------------------------------------
   FIELDS
   ---------------------------------------------------------------------------
   id           stable slug. Used as the DOM hook and the modal target, so
                changing it on a published book is safe but pointless.
   title        exact published title. Do not reword a published book.
   category     short topic label, shown on the card and in the detail view.
   summary      one sentence, shown on the card. Clamped to 3 lines.
   description  the full paragraph, shown in the detail view only.
   topics       short topic chips in the detail view.
   reader       who the book is for. Optional — omitted for every current
                title because the repository has no verified copy for it.
                Set it and the detail view will show it; leave it out and
                the block is not rendered at all.
   cover320     phone-sized cover.
   cover640     mid cover — the one most phones and tablets actually
                pick once device pixel ratio is taken into account.
   cover1200    detail-view cover. All three go into one srcset.
   alt          alt text for both.
   purchaseUrl  the live checkout link. Leave it null and the Buy button is
                not rendered at all.
   status       "available" or "coming-soon". Drives the badge label —
                "Out Now" or "Coming Soon" — through the one STATUS_LABEL
                map in js/bookstore.js. Anything other than "available"
                also removes the Buy button. The status is shown once, on
                the badge; there is no second pill repeating it.
   featured     true puts the book on the homepage shelf and gives it the
                Featured badge in the full collection.
   order        display order, low to high, on both pages.

   Cover paths are relative to the site root, and both pages that read this
   file live at the root, so they resolve unchanged on GitHub Pages.
   ========================================================================== */

const ebookData = [
  {
    id: "built-by-money",
    title: "Built by Money",
    category: "Money & Discipline",
    summary: "Financial discipline, controlled spending, and a long-term wealth mindset.",
    description: "Learn how to build financial discipline, control your spending, and develop a long-term wealth mindset that helps you stay focused on growth.",
    topics: ["Money habits", "The long game", "Self-control"],
    cover320: "images/ethos-empire-built-by-money-ebook-cover-320.webp",
    cover640: "images/ethos-empire-built-by-money-ebook-cover-640.webp",
    cover1200: "images/ethos-empire-built-by-money-ebook-cover-1200.webp",
    alt: "Built by Money ebook cover financial discipline wealth mindset for men",
    purchaseUrl: "https://ethosempire.gumroad.com/l/builtbymoney?layout=profile",
    status: "available",
    featured: true,
    order: 1
  },
  {
    id: "command-the-room",
    title: "Command the Room",
    category: "Confidence & Presence",
    summary: "Build presence, social strength, and the confidence to carry yourself with authority.",
    description: "Build confidence, presence, and social strength so you can carry yourself with more authority in any room you walk into.",
    topics: ["Presence", "Charisma", "Social strength"],
    cover320: "images/ethos-empire-command-the-room-ebook-cover-320.webp",
    cover640: "images/ethos-empire-command-the-room-ebook-cover-640.webp",
    cover1200: "images/ethos-empire-command-the-room-ebook-cover-1200.webp",
    alt: "Command the Room ebook cover confidence presence social strength",
    purchaseUrl: "https://ethosempire.gumroad.com/l/commandtheroom?layout=profile",
    status: "available",
    featured: true,
    order: 2
  },
  {
    id: "confidence-guide",
    title: "Confidence Guide",
    category: "Confidence & Mindset",
    summary: "Real confidence through better habits, stronger self-belief, and a sharper mindset.",
    description: "Develop real confidence through better habits, stronger self-belief, and a sharper mindset that carries into everyday life.",
    topics: ["Habits", "Self-belief", "Sharp mindset"],
    cover320: "images/ethos-empire-confidence-guide-ebook-cover-320.webp",
    cover640: "images/ethos-empire-confidence-guide-ebook-cover-640.webp",
    cover1200: "images/ethos-empire-confidence-guide-ebook-cover-1200.webp",
    alt: "Confidence Guide ebook cover self belief mindset personal growth",
    purchaseUrl: "https://ethosempire.gumroad.com/l/howtobeconfidence?layout=profile",
    status: "available",
    featured: false,
    order: 3
  },
  {
    id: "philosophy-of-becoming",
    title: "The Philosophy of Becoming",
    category: "Mindset & Discipline",
    summary: "Mindset, discipline, and personal standards to become stronger and more intentional.",
    description: "Explore the mindset, discipline, and personal standards needed to become stronger, sharper, and more intentional in how you live.",
    topics: ["Mindset", "Discipline", "Becoming"],
    cover320: "images/ethos-empire-philosophy-of-becoming-ebook-cover-320.webp",
    cover640: "images/ethos-empire-philosophy-of-becoming-ebook-cover-640.webp",
    cover1200: "images/ethos-empire-philosophy-of-becoming-ebook-cover-1200.webp",
    alt: "The Philosophy of Becoming ebook cover mindset discipline personal growth",
    purchaseUrl: "https://ethosempire.gumroad.com/l/thephilosophyofbecoming?layout=profile",
    status: "available",
    featured: true,
    order: 4
  },
  {
    id: "life-lessons-in-faith",
    title: "Life Lessons in Faith",
    category: "Faith & Purpose",
    summary: "Purpose, discipline, and belief connected to a more grounded way of living.",
    description: "Explore purpose, discipline, and belief with a guide that connects inner strength to a more grounded way of living.",
    topics: ["Faith", "Purpose", "Inner strength"],
    cover320: "images/ethos-empire-life-lessons-in-faith-ebook-cover-320.webp",
    cover640: "images/ethos-empire-life-lessons-in-faith-ebook-cover-640.webp",
    cover1200: "images/ethos-empire-life-lessons-in-faith-ebook-cover-1200.webp",
    alt: "Life Lessons in Faith ebook cover purpose discipline belief",
    purchaseUrl: "https://ethosempire.gumroad.com/l/lifelessonsinfaith?layout=profile",
    status: "available",
    featured: false,
    order: 5
  },
  {
    id: "relationship-code",
    title: "The Relationship Code",
    category: "Relationships",
    summary: "Communication, attraction, and building meaningful relationships with clarity.",
    description: "Learn how to communicate better, build attraction, and approach relationships with more clarity and confidence.",
    topics: ["Communication", "Attraction", "Clarity"],
    cover320: "images/ethos-empire-relationship-code-ebook-cover-320.webp",
    cover640: "images/ethos-empire-relationship-code-ebook-cover-640.webp",
    cover1200: "images/ethos-empire-relationship-code-ebook-cover-1200.webp",
    alt: "The Relationship Code ebook cover communication attraction confidence",
    purchaseUrl: "https://ethosempire.gumroad.com/l/therelationshipcode?layout=profile",
    status: "available",
    featured: true,
    order: 6
  },
  {
    /* Gumroad slug is "thearchitechtureofhealth". The spelling is the
       published product's, not a typo here — the corrected spelling 404s.
       Do not "fix" it. */
    id: "architecture-of-health",
    title: "The Architecture of Health",
    category: "Health & Training",
    summary: "Build a better body and mind through habits that support long-term health.",
    description: "Build a better body and clearer mind through habits that support energy, training, nutrition, and long-term health.",
    topics: ["Training", "Nutrition", "Energy"],
    cover320: "images/ethos-empire-architecture-of-health-ebook-cover-320.webp",
    cover640: "images/ethos-empire-architecture-of-health-ebook-cover-640.webp",
    cover1200: "images/ethos-empire-architecture-of-health-ebook-cover-1200.webp",
    alt: "The Architecture of Health ebook cover fitness nutrition wellness habits",
    purchaseUrl: "https://ethosempire.gumroad.com/l/thearchitechtureofhealth?layout=profile",
    status: "available",
    featured: true,
    order: 7
  },
  {
    id: "gym-mindset",
    title: "The Gym Mindset",
    category: "Health & Training",
    summary: "Train with more consistency, discipline, and purpose for real progress.",
    description: "Train with more consistency, discipline, and purpose so your gym routine turns into real progress over time.",
    topics: ["Discipline", "Progress", "Consistency"],
    cover320: "images/ethos-empire-gym-mindset-ebook-cover-320.webp",
    cover640: "images/ethos-empire-gym-mindset-ebook-cover-640.webp",
    cover1200: "images/ethos-empire-gym-mindset-ebook-cover-1200.webp",
    alt: "The Gym Mindset ebook cover training discipline consistency progress",
    purchaseUrl: "https://ethosempire.gumroad.com/l/thegymmindset?layout=profile",
    status: "available",
    featured: false,
    order: 8
  },
  {
    id: "clear-skin-guide",
    title: "The Clear Skin Guide",
    category: "Grooming & Skin",
    summary: "Practical skincare steps for healthier skin and better daily habits.",
    description: "Improve your skincare routine with practical steps that help you build healthier skin and better daily habits.",
    topics: ["Routine", "Healthy skin", "Consistency"],
    cover320: "images/ethos-empire-clear-skin-guide-ebook-cover-320.webp",
    cover640: "images/ethos-empire-clear-skin-guide-ebook-cover-640.webp",
    cover1200: "images/ethos-empire-clear-skin-guide-ebook-cover-1200.webp",
    alt: "The Clear Skin Guide ebook cover skincare routine healthy skin habits",
    purchaseUrl: "https://ethosempire.gumroad.com/l/theclearskinguide?layout=profile",
    status: "available",
    featured: false,
    order: 9
  },
  {
    id: "looksmaxxing-guide",
    title: "Looksmaxxing Guide",
    category: "Style & Grooming",
    summary: "Level up your appearance — style, grooming, and self-presentation.",
    description: "Level up your appearance with a sharper approach to style, grooming, confidence, and self-presentation.",
    topics: ["Style", "Grooming", "Confidence"],
    cover320: "images/ethos-empire-looksmaxxing-guide-ebook-cover-320.webp",
    cover640: "images/ethos-empire-looksmaxxing-guide-ebook-cover-640.webp",
    cover1200: "images/ethos-empire-looksmaxxing-guide-ebook-cover-1200.webp",
    alt: "Looksmaxxing Guide ebook cover style grooming attraction appearance",
    purchaseUrl: "https://ethosempire.gumroad.com/l/thelooksmaxxingguide?layout=profile",
    status: "available",
    featured: true,
    order: 10
  },
  {
    id: "hair-care-blueprint",
    title: "The Hair Care Blueprint",
    category: "Grooming & Hair",
    summary: "The complete hair grooming, styling, and maintenance guide.",
    description: "Take better care of your hair with a simple approach to grooming, maintenance, and a cleaner overall look.",
    topics: ["Grooming", "Maintenance", "Cleaner look"],
    cover320: "images/ethos-empire-hair-care-blueprint-ebook-cover-320.webp",
    cover640: "images/ethos-empire-hair-care-blueprint-ebook-cover-640.webp",
    cover1200: "images/ethos-empire-hair-care-blueprint-ebook-cover-1200.webp",
    alt: "The Hair Care Blueprint ebook cover grooming styling hair health",
    purchaseUrl: "https://ethosempire.gumroad.com/l/thehaircareblueprint?layout=profile",
    status: "available",
    featured: false,
    order: 11
  }
];

window.ebookData = ebookData;
