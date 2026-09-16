# SEO plan — meAsAgent

Written 2026-09-16 after your answers. `RESEARCH.md` and `KEYWORDS.md` hold the
evidence. **Approved and built the same day** — `SEO.md` says what shipped, what
was verified, and where the build departed from this plan (N15's LCP and image
changes were measured and deliberately not made; the launch page's H1 stays
client-rendered, with a server-rendered explainer below the form instead).

## What you decided

| # | Decision |
|---|---|
| 1 | Build on `https://measagent.vercel.app`. No domain yet. The migration runbook is written, not executed |
| 2 | Listed + live avatars are indexed **by default, with an owner opt-out**. Pending, declined and paused avatars are `noindex`, kept out of the sitemap, and still 200 |
| 3 | Avatar pages get server-rendered context: an H1, "launched by them", an optional owner-written *Ask me about* list and an optional website link (`sameAs`) |
| 4 | `/how-it-works` (with FAQ), `/for/founders`, `/for/creators`, `/for/teachers`, one guide, `/compare/delphi`. No blog. Byline: you. About 2 pieces a month |
| 5 | Allow the AI crawlers, block CCBot, ship `llms.txt` |
| 6 | A "Share your avatar" card on the launch/edit page and a "Made with meAsAgent" link on avatar pages. No widget |
| 7 | openSEO will be connected (sign-in pending). Search Console and Bing are done by you |
| 8 | English only, no hreflang |
| 9 | **Brands and projects may have avatars.** The positioning becomes people *and what they build* |
| 10 | Free for now, worded as a limited-time offer. Proposed wording below; you approve it |
| 11 | The reference project is never named publicly |

## Wording you must approve before it ships

Owner-facing and legal copy. I'll draft it in the build; nothing goes live unapproved.

1. **Tagline / H1 on `/`**: "Talk to AI avatars of real people and the things
   they build — or launch your own." (today: "…of real people…").
2. **Free**: "Free while meAsAgent is in early access." Used on `/`,
   `/how-it-works`, the guide, the FAQ and `llms.txt`. It's honest if pricing
   later changes, and it doesn't promise a date.
3. **Launch form, new "This avatar is of" choice**: *Me* / *Something I run
   (a product, project or brand)*. The attestation changes to match: "This avatar
   is of me, {name}" or "I run {the thing this avatar speaks for}, and I'm
   launching it from my own account."
4. **Launch form, search setting**: "Show my avatar in search engines (Google,
   Bing) once it's listed", **on by default**, with the line "Turning this off
   hides your page from search results. The link still works."
5. **Privacy notice**: listed avatar pages can appear in search engines unless the
   owner turns that off; the optional website link and *Ask me about* are public.
   **Terms**: an avatar is of you *or of something you run*, launched from your own
   account, and never of another person. `UPDATED_AT` moves. `CONSENT_TERMS_VERSION`
   moves too (it records which wording was on screen), which, as CLAUDE.md says,
   re-asks nobody.

## Visual changes on existing screens (you approved them in principle; listed so none is a surprise)

- `/`: a short intro block under the header (what it is, 3 steps, a link to
  how-it-works) and a **site footer** (How it works · For founders/creators/teachers ·
  Compare · Privacy · Terms). New CSS layers only.
- `/<handle>`: the name in the avatar panel becomes the page's `<h1>` (same class,
  same look). *Ask me about* chips and the website link appear under the bio **only
  when the owner filled them in**. A small "Made with meAsAgent" link sits in the
  notice line under the composer.
- `/launch`: a two-sentence server-rendered intro above the form when signed out,
  plus the share card when an avatar exists.
- The launch button's colour contrast fixed (a11y 96 → 100). It's a small shade change.

Everything else (the chat, thread, composer, voice) stays pixel-identical.

---

## Now — technical foundations

Ranked by impact ÷ effort. "Verify" is what I'll show you before calling it done.

| # | Change | Keywords served | Files | Verify |
|---|---|---|---|---|
| N1 | **Reserve the new route words** before any route exists: `blog`, `compare`, `for`, `guides`, `how-it-works`, `faq`, `pricing`, `opengraph-image`, `twitter-image`, `apple-icon`, `manifest`, `llms`. Re-check local DB + prod for holders | — | `api/lib/avatars/handle.ts` | `mongoexport` of local handles; `curl` 404 on prod for each; api typecheck |
| N2 | **One lowercase host.** `SITE_URL` → `https://measagent.vercel.app`; the migration later changes this one constant | all | `web/src/lib/product.ts` | grep for `meAsAgent.vercel` in `web/`, `admin/`, `api/` |
| N3 | **Expose what indexing needs** on the public profile: `subject` (`person`/`project`), `isSearchIndexable` (listed ∧ live ∧ not hidden, decided once in `lib/avatars`), `updatedAt`, `askMeAbout`, `websiteUrl`. Stored fields `subject`, `askMeAbout` (≤ 5 × 60 chars), `websiteUrl` (https only, ≤ 200), `isHiddenFromSearch`. Existing docs read as `person` / not hidden, with no migration. Editing *Ask me about* or the website resets review, like the bio (they are public text) | M | `shared/src/avatars.ts`; `api/shared/documents.ts`; `api/lib/avatars/avatar-with-owner.ts` (+ a new `search-visibility.ts`); `api/lib/avatars/own-avatar.ts`; `api/routes/v1/avatars/schemas.ts`, `routes/v1/me/avatar/schemas.ts`; `handlers/avatars/launch-avatar.ts`, `update-own-avatar.ts`; `admin/` review screen shows the new fields | api typecheck; `curl` a listed, pending, paused and hidden avatar through the api and read the flags; bio/website edit resets `listing` |
| N4 | **Launch/edit form**: the subject choice, *Ask me about*, website, the search setting, the wording above | M, trust | `web/src/components/AvatarForm.tsx`, `AvatarEditor.tsx`, existing `avatar-editor.css` rules (no new look) | browser pass: launch, edit, toggle; api rejects `http:` and `javascript:` URLs |
| N5 | **Metadata helper + canonicals on every page.** `buildPageMetadata({ path, title, description, image })` sets `alternates.canonical`, OG and Twitter consistently. Root layout: `applicationName`, `authors`, `creator`, `formatDetection`, the title template. Home gets `title.absolute`. Fix `/launch` inheriting the root `og:url` | L, E | `web/src/lib/seo/page-metadata.ts` (new); every `page.tsx`; `app/layout.tsx` | `curl` each page: one canonical, lowercase, no trailing slash; titles ≤ 60, descriptions ≤ 155 |
| N6 | **Avatar page robots.** `generateMetadata` sets `robots: { index: false }` unless `isSearchIndexable` and the page isn't thin (bio ≥ 60 chars or *Ask me about* present). Title `Talk to {name}'s AI avatar`, description built from the bio. Uppercase handle → `permanentRedirect` to lowercase | M | `app/[handle]/page.tsx`, `web/src/lib/seo/avatar-indexing.ts` (new) | `curl` listed / pending / paused / hidden / thin / missing / `/YashMittal` → robots meta + status (200 / 200 / 200 / 200 / 200 / 404 / 308) |
| N7 | **`robots.ts`**: allow all; disallow `/launch/visitors`, `/launch/unsubscribe`; GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended allowed; CCBot disallowed; `sitemap` + `host`. The owner pages keep their `noindex` meta too (they're never linked publicly) | — | `web/src/app/robots.ts` | `curl /robots.txt`; Google robots tester URL listed |
| N8 | **`sitemap.ts`**: static pages with real dates (content `updatedAt` from the typed content) + indexable avatars with `updatedAt`. Written around `generateSitemaps`-ready chunking (one function per source), a single file until ~40k URLs | M, all | `web/src/app/sitemap.ts`, `web/src/lib/seo/sitemap-entries.ts` | `curl /sitemap.xml` → parse as XML; assert no pending, declined, paused, hidden or thin avatar |
| N9 | **Structured data**: a typed, dependency-free helper that serialises with `<` escaped, per the Next 16 JSON-LD guide. Sitewide `Organization` (+ `sameAs` your GitHub/X/LinkedIn) and `WebSite` (no SearchAction). `ProfilePage` + `Person` for person avatars and `ProfilePage` + `Organization` for project avatars (`sameAs` = website if given). `WebApplication` on `/` and `/how-it-works` (`offers` price 0 is **true today**, and stated with the early-access wording; no ratings). `BreadcrumbList` on content and avatar pages. `FAQPage` on how-it-works. `Article` (author you, dates) on the guide and comparison | L, M, all | `web/src/lib/seo/structured-data.ts`, `web/src/components/StructuredData.tsx` | parse every block; check each type against schema.org and Google's docs; URLs for Rich Results Test + validator.schema.org |
| N10 | **OG images** (`next/og`): site default `app/opengraph-image.tsx`; `app/[handle]/opengraph-image.tsx` with photo, name and "Talk to my AI avatar", falling back to the placeholder portrait, truncating long names, and loading a Noto Sans subset for non-Latin names; one per content page. `twitter` uses the same | M, share loop | `web/src/app/**/opengraph-image.tsx`, `web/src/lib/seo/og-image.tsx` | open each PNG: normal, no photo, 60-char name, Devanagari/CJK name |
| N11 | **Icons + manifest**: `manifest.ts`, `apple-icon.png`, `icon.png` (32/192/512) generated from `icon.svg`, plus `favicon.ico` | L | `web/src/app/` | `curl` each; Lighthouse installability section |
| N12 | **Crawlable avatar page**: the name as `<h1>`, alt text "{name}'s portrait", *Ask me about*, the website link (`rel="me nofollow ugc"` until reviewed, `rel="me"` once listed), a link back to `/`, and "Made with meAsAgent" | M | `AvatarPanel.tsx`, `MobileHeader.tsx`, `ChatCanvas`/notice line; new CSS in `web/src/styles/avatar-profile.css` | no-JS `curl` text of `/yashmittal` shows H1, bio and links; screenshot diff at desktop + phone width |
| N13 | **Home intro + site footer**, server-rendered, copy as typed data | E, L | `AvatarDirectory.tsx`, new `SiteFooter.tsx`, `web/src/content/home.ts`, `web/src/styles/site-footer.css`, `directory.css` addition | no-JS text of `/` ≥ 250 words; links to all content pages + legal |
| N14 | **Headers**: `poweredByHeader: false`; `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy: microphone=(self), camera=()`. **No CSP yet**: the realtime socket, worklets and cross-origin api make it a real risk to voice for little SEO gain | trust | `web/next.config.ts` | `curl -I`; hold-to-speak still works in the browser |
| N15 | **Performance**: server-render the empty-thread text so mobile LCP stops waiting on hydration (target < 2.0 s); `next/image` with `remotePatterns` for `lh3.googleusercontent.com` at the displayed size | CWV | `ConversationThread.tsx` (or where `.thread-empty` renders), `Avatar.tsx`, `next.config.ts` | Lighthouse mobile + desktop on a local production build, before/after, on `/` and an avatar |

## Next — content, AI-search readiness

| # | Page / asset | Primary keyword | Files | Verify |
|---|---|---|---|---|
| X1 | `/how-it-works`: definition in the first 100 words; 3 steps; what visitors get (text, voice, memory); what owners get (conversations, weekly summary); what it isn't (no voice cloning, no content upload yet); safety (only of yourself or something you run, says it's an AI); FAQ of 8–10 real questions | how an AI avatar of yourself works | `app/how-it-works/page.tsx`, `web/src/content/how-it-works.ts`, `ContentPage.tsx`, `FaqList.tsx`, `web/src/styles/content-page.css` | every factual line traced to `privacy/page.tsx` or code in the hand-off doc |
| X2 | `/for/founders`, `/for/creators`, `/for/teachers`: one template, copy as data, a distinct scenario each, linking to how-it-works + guide + launch | AI avatar for {persona} | `app/for/[persona]/page.tsx` (`generateStaticParams`, `dynamicParams = false` so unknown personas 404), `web/src/content/personas.ts` | 3 pages 200, `/for/xyz` 404; no medical/legal/financial claims |
| X3 | `/guides/make-an-ai-version-of-yourself`: step-by-step (text, voice, what to write in each note), with meAsAgent as one route and honest alternatives (Custom GPTs, Delphi) | how to make an AI version of yourself · AI chatbot of yourself | `app/guides/[slug]/page.tsx`, `web/src/content/guides.ts` | `Article` JSON-LD with author + dates |
| X4 | `/compare/delphi`: a dated table (voice, voice cloning, content ingestion, visitor memory, owner reads conversations, weekly summary, who you can clone, price), every Delphi cell linked to their live page with the date checked | Delphi AI alternative | `app/compare/[slug]/page.tsx`, `web/src/content/comparisons.ts` (each claim carries `sourceUrl` + `checkedOn`), `ComparisonTable.tsx` | each Delphi claim re-fetched on build day |
| X5 | `llms.txt` as a route handler from the same typed content (so it can't drift) | GEO | `app/llms.txt/route.ts` | `curl /llms.txt`; `llms` is not a valid handle anyway (the dot), reserved regardless |
| X6 | **Share card** on `/launch` when an avatar exists: copy link, and preview the OG image | share loop | `AvatarShareCard.tsx`, `web/src/styles/avatar-share-card.css` | browser pass |
| X7 | `seo/CONTENT-CALENDAR.md`: 12 weeks, **6 pieces** (2/month): keyword, intent, outline, internal links, CTA | long tail | `seo/` | — |

## Later — off-page, programmatic, domain

| # | Item | Files |
|---|---|---|
| L1 | `seo/OFF-PAGE.md`: Search Console + Bing setup, sitemap submission, URL inspection; launch sequence (Product Hunt, Show HN, Indie Hackers, subreddits within their rules, X/LinkedIn, AI-tool directories) with angle, draft post and link earned; outreach to the listicle authors that AI answers cite; owners as the backlink engine | `seo/OFF-PAGE.md` |
| L2 | `seo/MEASUREMENT.md`: KPIs per cluster, where each is read, today's baseline (0 indexed, Lighthouse above), 30/60/90-day targets | `seo/MEASUREMENT.md` |
| L3 | Domain migration runbook (301s via `vercel.json`/proxy, `SITE_URL` switch, Search Console change of address, re-submit sitemap, update OG caches, Resend domain) | in `OFF-PAGE.md` |
| L4 | Sitemap index via `generateSitemaps` once avatars pass ~40k; directory pagination (`/?page=`) + an index on `listing` once past ~100 listed | `sitemap.ts`, api |
| L5 | Later content: `/for/coaches`, `/for/investors`, `/guides/ai-clone-consent`, `/compare/ai-clone-tools` | content data |
| L6 | Refresh `KEYWORDS.md` with openSEO volumes once connected, and re-rank X-items if the numbers disagree | `seo/KEYWORDS.md` |
| L7 | Hand-off: `seo/SEO.md`, and an SEO section in `CLAUDE.md` (reserved-handle check, only indexable avatars in the sitemap, metadata + JSON-LD on every public page, no fake markup) | docs |

## Build order

N1 → N2 → N3 → N4 → N5 → N6 → N7 → N8 → N9 → N12 → N13 → N10 → N11 → N14 → N15
→ X1 → X2 → X3 → X4 → X5 → X6 → X7 → L1 → L2 → L7. Each step leaves `build`,
`typecheck` and `lint` clean.

## Verification at the end (from the brief §7)

- `web` build/typecheck/lint, `api` typecheck, `admin` build/typecheck/lint.
- Local stack; `curl` `/`, a listed, a pending, a paused, a hidden and a thin
  avatar, a missing handle, an uppercase handle, every new page: status, title,
  description, canonical, robots, JSON-LD.
- `/robots.txt`, `/sitemap.xml` (valid XML, no non-indexable avatars),
  `/manifest.webmanifest`, `/llms.txt`, every OG image opened and looked at.
- Every JSON-LD block parsed and checked; Rich Results Test + Schema Validator URLs listed.
- Lighthouse on a local production build, before and after.
- Screenshots of the chat, directory and launch page before/after at desktop and
  phone width, to confirm only the listed visual changes happened.
- Test avatars created for verification live in a **test database** and are
  deleted afterwards. None ships, none is of a real person.

## What I need from you

1. **Finish the openSEO sign-in** (the link is in chat). Without it, `KEYWORDS.md`
   stays relative.
2. **Your public profile URLs** (GitHub, X, LinkedIn, site) for `Organization.sameAs`
   and the author byline. Or say none.
3. **The wording above**: approve, or tell me what to change. I can also build with
   it and you approve it in the working tree before deploy.
4. **After deploy**: tell the TileVille, RavenHouse and Secora owners to set
   "Something I run" (or I set it through the admin review screen if you want that
   power there; not planned by default).
5. **Go-ahead** to build.
