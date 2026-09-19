# SEO — from nothing indexed to a site search engines can read

Built 2026-09-16. This file is the reasoning. `PLAN.md` is the plan you
approved, `RESEARCH.md` and `KEYWORDS.md` the evidence,
`CONTENT-CALENDAR.md`, `OFF-PAGE.md` and `MEASUREMENT.md` what happens next, and
`../../CLAUDE.md` § SEO the rules future work keeps.

Before this, Google had indexed nothing and the site had no robots.txt,
sitemap, canonicals, share images or structured data. An avatar's page gave a
crawler about 25 words, with no heading and no way back to the directory. Now
every public page has a canonical URL, complete metadata, a share image and
structured data. Only avatars fit for search are offered to search engines.
Seven pages explain the product in the words people search for.

---

## What you have to do before it works

1. **Approve the owner-facing wording in the working tree, then deploy `web/`
   and `api/` together.** The launch form sends a new required `subject` field,
   so a new web against an old api fails to launch avatars. An old web against a
   new api is refused the same way. The admin portal reads the new fields too.
   Deploy the api first, then `web/` and `admin/`, within minutes of each other.
   The wording to read:
   - `web/src/components/AvatarForm.tsx`: "This avatar is of" (Me / Something I
     run), *Ask me about*, *Your website*, the search-engine checkbox, and both
     attestations
   - `web/src/app/privacy/page.tsx`: the new "In search engines, once it is
     listed" item, and the changed "What you write" and attestation items
   - `web/src/app/terms/page.tsx`: "of you, or of something you run", the search
     line, and the early-access sentence
   - `PRODUCT_TAGLINE` and `PRODUCT_PRICING_NOTE` in `web/src/lib/product.ts`
2. **Check `MA_WEB_ORIGIN` on the production api.** `.env.example` listed
   `https://meAsAgent.vercel.app` in mixed case. Browsers send the origin in
   lowercase, so if production copied that value and the CORS check compares
   strings exactly, requests would be refused. It works today, so production
   probably already has a matching value. The example now says
   `https://measagent.vercel.app`.
3. **Check the weekly email is actually sending in production.** The site copy
   describes it, as the privacy notice already did. It needs Resend and a
   verified sending domain, which `vercel.app` cannot be (`../decisions/owner-view.md`). If it
   is not sending, tell me and I'll soften those lines. The draft posts in
   `OFF-PAGE.md` say the same.
4. **Tell the owners of `tileville`, `ravenhouse` and `secorra` to open
   `/launch` and choose "Something I run".** Until they do, their pages are
   marked up as a `Person`. Editing only the subject does not send them back to
   review.
5. **Search Console is verified** (2026-09-17) with the HTML file
   `web/public/google2d0134d554a0af0d.html`, live in production. **Never delete
   that file** — Google re-checks it, and the property is lost without it. Still
   to do there: submit the sitemap and request indexing (`OFF-PAGE.md` §1), and
   add the site to Bing (import it from Search Console).
6. **The owner profiles are in.** GitHub, X, LinkedIn and yashmittal.xyz are the
   `sameAs` of the founder and article author in structured data, and the guide and comparison bylines link
   to yashmittal.xyz. The Organization gets no `sameAs` until the product has
   profiles of its own — pointing it at a person's accounts would mislabel them.

---

## The decisions that shaped this

### 1. Search indexing is decided in two functions, and the sitemap and the page ask the same one

`isAvatarSearchIndexable` (api) answers *may* this avatar be offered: listed,
live, and not hidden by its owner. `shouldIndexAvatarPage` (web) adds *should*
it: at least 60 characters of bio, or some *Ask me about* topics. The page's
`robots` tag and `sitemap.ts` both call the second, so a URL in the sitemap can
never say `noindex`, and a page with `noindex` never appears in the sitemap.

Pending, declined, paused and hidden avatars return **200 with `noindex`**, not
404. The link is theirs to share (review gates the directory, not the link), and
a paused page that returned 404 would invite someone to take the handle.

**Rejected:** a `listed` flag on the public profile with each caller deriving
the rest (three callers, three chances to disagree), and opt-in indexing (almost
nobody opts in, and you chose opt-out).

### 2. Brands and projects may have avatars, and the markup says which

`subject: 'person' | 'project'` is chosen at launch and editable. It changes the
attestation wording and whether an avatar's page is a `ProfilePage` about a
`Person` or an `Organization`. Existing avatars read as `person` with no
migration (`readAvatarPublicDetails` supplies the default). It is still launched
from the owner's own Google account and is never of another person.
`../../CLAUDE.md`'s rule now says so.

**Rejected:** inferring it from the name, which would guess wrong exactly when it
matters.

### 3. Owners add public text, and public text goes back to review

*Ask me about* (up to 5 topics, 60 characters each) and a website (`https://`
only, no credentials, a real hostname) join the bio as the things a page shows.
Changing any of the three sends a listed avatar back to `pending`, as the bio
already did. Otherwise an approved avatar could be turned into a link to
anything. Changing the subject or the search setting does not reset review: they
change how the page is described, not what it says.

The website link carries `rel="me"`, plus `nofollow ugc` until the page itself is
indexable. An owner-written link passes no ranking credit before a reviewer has
seen it.

### 4. Copy lives as data, and every surface reads the same data

`web/src/content/` holds the home intro, how-it-works, three persona pages, the
guide and the Delphi comparison as typed objects. The pages, the FAQ markup, the
`Article` markup, the sitemap dates, the footer and `llms.txt` all read them.
A new guide is one object in `guides.ts`: its route, metadata, share image,
markup, sitemap entry, footer link and `llms.txt` line follow.

Every factual sentence was checked against the code and the privacy notice (see
"What I verified"). Every claim about Delphi carries `sourceUrl` and `checkedOn`,
and uses only what Delphi's own pages said on 2026-09-16. Their pricing page
served several versions that day, so a claim is included only if every version
made it.

### 5. One metadata helper, because Next.js replaces metadata objects rather than merging them

`buildPageMetadata` sets canonical, title, description, Open Graph and Twitter
together. The live `/launch` bug (its share preview claimed to be the home page)
came from setting only part of `openGraph`. The same replacement drops an
inherited share image, which is why `/launch`, `/privacy` and `/terms` each have
an `opengraph-image.tsx`. I found that while checking the built HTML, not by
reading the docs.

### 6. AI crawlers allowed, CCBot blocked, `llms.txt` shipped

GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot
and Google-Extended may crawl. Conversations are never public pages, so they see
what any visitor sees. CCBot collects only for training datasets and sends nobody
back, so it is blocked. Each AI group repeats the private disallows, because a
crawler obeys only the most specific group that names it.

### 7. Things I measured and deliberately did not change

- **Mobile LCP on avatar pages (2.5–2.6 s)** is the "Say hello" line, which
  renders only after hydration because the conversation loads in the browser.
  Rendering it on the server would flash "Say hello" at every returning visitor
  before their conversation appears. That is worse than 0.8 s of lab LCP, and
  field data doesn't exist yet to say it matters.
- **`next/image` for Google photos.** `Avatar.tsx` already explains why its wrapper
  would break the sizing rule, and the photo is 96px.
- **A Content-Security-Policy.** The cross-origin api, the realtime voice socket
  and the worklets make a wrong policy a silent voice outage. The three headers
  that shipped can't break anything.

---

## What is where

**shared**
```
src/avatars.ts        AvatarSubject, AvatarPublicDetails, website pattern, topic limits;
                      AvatarProfile gains isSearchIndexable + updatedAt
```

**api**
```
lib/avatars/avatar-public-details.ts   defaults for old documents, isAvatarSearchIndexable,
                                       topic and website normalising and checks
lib/avatars/own-avatar.ts              public text (bio, topics, website) resets review
lib/avatars/avatar-with-owner.ts       the public profile carries the new fields
lib/avatars/handle.ts                  reserved: apple-icon blog compare faq for guides how-it-works
                                       llms manifest opengraph-image pricing twitter-image
routes/v1/avatars/schemas.ts           response schema (the serializer) gains the fields
routes/v1/me/avatar/schemas.ts         launch/update bodies and the own-avatar response
handlers/avatars/launch-avatar.ts      subject required; website checked
handlers/avatars/update-own-avatar.ts  website checked
shared/documents.ts                    optional fields on AvatarDoc
shared/constants.ts                    CONSENT_TERMS_VERSION → 2026-09-16 (re-asks nobody)
```

**admin**
```
components/ReviewCard.tsx   shows subject, search setting, topics and website
```

**web**
```
lib/product.ts                   lowercase SITE_URL, tagline, PRODUCT_PRICING_NOTE, builder, profile URLs
lib/seo/page-metadata.ts         buildPageMetadata, truncateForDescription
lib/seo/avatar-search.ts         shouldIndexAvatarPage, avatar title and description
lib/seo/structured-data.ts       Organization, WebSite, WebApplication, ProfilePage, BreadcrumbList,
                                 FAQPage, Article; escaped serialisation
lib/seo/content-page-seo.ts      metadata, breadcrumbs and markup for content pages
lib/seo/sitemap-entries.ts       content entries; directory + indexable avatar entries
lib/seo/og-image.tsx             the two share-image layouts
content/*.ts                     all long-form copy, site links, legal dates
app/robots.ts  sitemap.ts  manifest.ts  llms.txt/route.ts
app/opengraph-image.tsx and one per segment: [handle], how-it-works, for/[persona],
                                 guides/[slug], compare/[slug], launch, privacy, terms
app/how-it-works  for/[persona]  guides/[slug]  compare/[slug]      new pages
app/[handle]/page.tsx            metadata, robots, uppercase → lowercase 308, JSON-LD
app/favicon.ico  apple-icon.png  public/brand/logo-{192,512}.png   from icon.svg
components/ContentPage FaqList ComparisonTable SiteFooter StructuredData
           AvatarProfileDetails AvatarShareCard                   new
components/AvatarPanel (name is the h1)  Avatar (alt text)  AvatarDirectory (intro)
           AvatarForm AvatarEditor MessageComposer ("Made with", not on phones)
styles/content-page.css site-footer.css avatar-profile.css avatar-share-card.css   new layers
styles/avatar-editor.css (new fields, launch explainer)  directory.css (intro, button contrast)
styles/tokens.css (--accent-strong)  responsive.css (hide "Made with" on phones)
next.config.ts                   poweredByHeader off; nosniff, referrer and permissions headers
```

---

## What I verified, and what I could not

**Checks:** `web` build, typecheck and lint pass; `admin` build, typecheck and lint pass; `api` typecheck passes.

**API**, against a separate test database (`measagent_seo_test`, dropped
afterwards) with eight invented test owners. None of them is a real person.
**29 checks, all passing:**
- the profile and own-avatar responses carry the new fields;
- `isSearchIndexable` is right for listed, pending, declined, paused, hidden and
  pre-existing avatars;
- websites are refused for `http:`, `javascript:`, `ftp:`, no dot, credentials
  and spaces;
- more than 5 topics, a 61-character topic and an unknown subject are refused;
- the subject and search setting don't reset review;
- re-saving unchanged topics and website keeps an avatar listed; changing a
  topic's case, changing the website, or clearing it sends it back to review;
- topics are trimmed and de-duplicated regardless of case;
- launching without a subject, with an `http:` website, or with each of 10
  reserved handles is refused;
- a project avatar launches with every detail.

**Rendered HTML**, on a production build (`next start`) against that api:
- **Status, title, description, canonical, `og:url`, robots and JSON-LD types
  for 24 URLs:**
  - listed person, listed project and pre-existing avatars: indexable;
  - thin, pending, declined, paused and hidden avatars: 200 with `noindex, follow`;
  - a missing handle: 404 with `noindex`;
  - `/SEO-Listed-Person`: 308 to lowercase;
  - `/for/plumbers`, `/for` and `/guides`: 404;
  - every content, legal and launch page.
- **Titles and descriptions:** every title is ≤ 60 characters including the brand
  (after I found a long Devanagari name at 91 and fixed it); every description
  is ≤ 155.
- **Words a crawler sees:**

  | Page | Before | After |
  |---|---|---|
  | `/` | 120 | 351 |
  | Avatar page | 25 | 56–92 |
  | `/how-it-works` | new | 1,103 |

- **`/sitemap.xml`:** valid XML with 13 URLs, and none of the thin, pending,
  paused, hidden or declined avatars, nor the owner pages.
- **`/robots.txt`, `/manifest.webmanifest`, `/llms.txt`:** correct.
  `/favicon.ico`, `/apple-icon.png` and `/brand/logo-512.png` return 200 with the
  right `<link>` tags. The security headers are present and `x-powered-by` is gone.
- **JSON-LD:** every block parses on 7 page types; the properties each type
  needs are present; the FAQ markup's question count matches the visible FAQ.
  A bio containing `</script><b>` is escaped in both the markup and the page.
- **Share images, opened and looked at:** a photo, the placeholder, a long
  Devanagari name (rendered with the right font, truncated), the site default, a
  comparison, and a missing handle (falls back to the site image).

**Browser** (Playwright, 1280px and 390px):
- The avatar page's `<h1>` has the same size, weight and position as
  production's `<span>`.
- The phone chat's notice line matches production's height for the same name
  (after I hid "Made with" on phones).
- The home page intro and footer, the comparison table scrolling inside its own
  box on a phone, and the launch page when signed out all display as intended.
- No page scrolls sideways at 390px.

**Lighthouse** (mobile, same machine and day, `MEASUREMENT.md` has the table):

| Page | Production before | After (local build) |
|---|---|---|
| `/` | Perf 96–97, A11y 96, LCP 2.6 s | Perf 98, A11y 100, LCP 2.4 s |
| New content pages | — | Perf 99–100, A11y 100 |

My first pass at the new CSS failed contrast in nine places; all are fixed.

**Not verified:**
- **The launch and edit form in a signed-in browser.** Google sign-in can't
  complete from my browser (`../decisions/multi-person.md` notes the origin error). The form
  compiles, its fields map to the api bodies checked above, and the api side is
  covered. The share card was never seen rendered. **Launch or edit once
  yourself before deploying.**
- **Anything deployed.** No Rich Results Test, Search Console or real crawl. The
  URLs to paste are in `OFF-PAGE.md` §1.
- **Hold-to-speak after the new headers.** `Permissions-Policy: microphone=(self)`
  allows the page itself. Nothing loads the microphone in an iframe, but I did not
  talk to an avatar through the speech service.
- **Whether AI answers cite the site.** That can only be measured after indexing.

---

## Things I changed that you did not ask for

- **`api/.env.example`:** the web origin and base URL are lowercase.
- **Uppercase handles redirect (308)** to the lowercase page instead of 404.
- **The directory's launch button is a shade darker** (`--accent-hover`) so its
  white text passes contrast. You approved this in the plan; it's listed here
  because it is the only visible change to an existing control.
- **"Made with meAsAgent" is hidden on phones**, to keep the phone chat
  pixel-identical.
- **`CONSENT_TERMS_VERSION` → 2026-09-16.** It records which wording was on
  screen; it re-asks nobody.
- **Portrait alt text:** the avatar panel's image carries "Portrait of {name}"
  itself, instead of an `aria-label` on its wrapper. It is announced the same way.
- **`../../README.md`:** two rule lines updated.
- **`KEYWORDS.md`** gained measured volumes after the plan. They moved "ai
  digital twin" from "not worth it" to a planned explainer (calendar week 3).

## Still open

- **Sitemap submission, indexing requests and Bing** (step 5).
- **The three non-person avatars' subject** (step 4). An admin control to set it
  wasn't built; tell me if you want one.
- **The persona pages have no measurable search demand** (`KEYWORDS.md`). They
  stay as landing pages. No more of them until Search Console shows impressions.
- **Sitemap scale:** one file is right until tens of thousands of avatars. Then
  split with `generateSitemaps`, which the entry functions are already shaped for.
  The directory still doesn't paginate (`../decisions/multi-person.md`).
- **Avatar page LCP on phones** (decision 7).
- **A CSP**, once there is a way to test voice end to end after each change.
- **The domain move**: `OFF-PAGE.md` §5 is the runbook. `SITE_URL` is the one
  line of code that changes.
