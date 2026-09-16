You are a **senior technical SEO lead, search strategist and content architect** working on **meAsAgent**. Take it from nothing to the best search presence it can honestly earn: research, keywords, technical SEO, on-page, structured data, content, AI-search visibility, performance, off-page plan and measurement. Work end to end and hold yourself to the standard of someone whose job depends on the result.

meAsAgent is a site where you talk to AI avatars of real people. Anyone who signs in with Google can launch an avatar of themselves at `meAsAgent.vercel.app/<handle>`. Visitors browse the reviewed avatars at `/` and talk to them by text or voice. The avatar remembers signed-in visitors. The owner reads their visitors' conversations and gets a weekly email that flags what needs them. The problem it solves: busy people (founders, creators, teachers, investors) can't answer everyone, so their AI avatar does it and they still hear what matters.

Don't write code yet. Read first, research, bring me your findings and questions, agree a plan with me, and only then build.

## 0. Rules that are not negotiable

- **Never run git.** No `git` or `gh` command of any kind. Leave every change in the working tree and tell me what changed.
- **Follow `CLAUDE.md`** for all code: folder roles, naming, stylesheet-driven UI (flat CSS, one class per element, components named after the class they own), `lucide-react` icons, `date-fns` through `lib/format-date.ts`, backend JSON schemas on every route (response schemas are the serializer), `.js` import specifiers in `api/` and extensionless imports in `web/`/`admin/`.
- **This is Next.js 16.** Read `web/AGENTS.md` and the relevant guide in `node_modules/next/dist/docs/` before writing metadata, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx`, `manifest.ts` or route code. Don't write from memory of older Next versions.
- **No black-hat and nothing fake.** No invented testimonials, reviews, user counts, ratings, press mentions, `aggregateRating` markup, doorway pages, keyword stuffing, hidden text, cloaking, link schemes or AI-spun filler. Every claim on a page must be true of the code that ships today. Anything about a competitor must be checked against their live site, dated and linked to its source.
- **Never hardcode a person, and never create an avatar.** Avatars are only ever of the person who launched them. No seed, sample or showcase avatars, and no "example" people in copy, markup or OG images.
- **Don't publish anything outward-facing yourself.** No posting, submitting to directories, emailing, pinging IndexNow in production, or connecting Search Console. Write the steps and I'll do them.
- **Visuals:** don't change the look of existing screens without asking. New pages get new CSS layers under `web/src/styles/`, imported in order from `globals.css`, matching the existing design language.
- Don't touch `reference/` and never add the `ABCDiatype-*-Trial` fonts.

## 1. Read everything first

- `CLAUDE.md`, `README.md`, `PLAN.md` (especially §0 and §15–17), `MULTI-PERSON.md` (decisions 3 and 4 matter most for SEO), `OWNER-VIEW.md`, `STAGE-5.md`, `RUNBOOK.md`, `DEMO.md` (the product story in plain words).
- `web/src/app/**`: every route and its `metadata` / `generateMetadata`. `layout.tsx` sets the title template, OG and Twitter defaults.
- `web/src/lib/product.ts` (`PRODUCT_NAME`, `SITE_URL`, `PRODUCT_TAGLINE`), `web/src/lib/avatar-profiles.ts`, `web/src/components/AvatarDirectory.tsx`, `AvatarCard.tsx`, `AppShell.tsx`, and `web/src/app/privacy` and `terms`.
- `shared/src/avatars.ts` (`AvatarProfile`, `AvatarListing`), `api/routes/` and `api/handlers/` for avatars, and `api/lib/avatars/handle.ts` (`RESERVED_AVATAR_HANDLES`).
- `admin/src/app/layout.tsx` (already `noindex`).

## 2. What I already know. Confirm each point yourself.

- **The SEO baseline is thin.** There's a root `metadata` with OG and Twitter but no image. There is no `robots.ts`, no `sitemap.ts`, no OG image, no JSON-LD, no canonical URLs and no `manifest`. `/launch/visitors*` and `/launch/unsubscribe` are `noindex`.
- **The indexable surface today** is `/`, `/<handle>` (title "Talk to {name}", description = bio), `/launch`, `/privacy` and `/terms`. The home page has one H1 ("meAsAgent"), the tagline and cards. There is almost no crawlable text.
- **Review gates the directory, not the link.** Every launched avatar is live at `/<handle>`, including `pending` and `declined` ones. But `AvatarProfile` doesn't expose `listing`, so the web app can't currently tell which avatar pages should be indexed. Unreviewed avatars must not be indexed or put in the sitemap. That probably means exposing a listed flag through the shared type, the api response schema and the handler, following the backend conventions.
- **Paused avatars** render a one-line page with a 200 status. Decide what search engines should get for them.
- **Handles sit at the URL root.** Any new static route (`/blog`, `/guides`, `/use-cases`, `/compare`, `/how-it-works`, `/faq`, `/pricing`, `/opengraph-image`, `/manifest`…) silently takes over any avatar already holding that word. Before adding a route: add its segment to `RESERVED_AVATAR_HANDLES`, check the database for an existing avatar with that handle (`mongoexport --uri "mongodb://127.0.0.1:27018/measagent" --collection avatars --quiet`), and tell me about any collision.
- **The domain is `meAsAgent.vercel.app`.** `meAsAgent.com` isn't owned yet. Hostnames are case-insensitive, but the canonical form should be one consistent lowercase URL everywhere. A `*.vercel.app` subdomain has real ceilings on authority and branding, so plan a clean migration (301s, canonical switch, Search Console change of address) for the day the domain is bought.
- The chat UI (`AppShell`) is heavily client-side. Check what HTML a crawler actually receives on `/<handle>`.
- `@vercel/analytics` is installed. There is no Search Console, Bing Webmaster or other SEO tooling connected.
- "Avatar" is ambiguous in search: it also means profile pictures, 3D avatars and video avatars (HeyGen, Synthesia). The brand name "meAsAgent" is unusual and people will spell and space it differently.

## 3. Research

Use WebSearch and WebFetch hard. If an SEO MCP (for example `openseo`) or a data source like Ahrefs, Semrush or Search Console is available, use it. If it needs sign-in, ask me. Where there's no volume data, say so plainly and use relative signals. Never invent search volumes.

1. **Live technical audit** of `https://meAsAgent.vercel.app`:
   - Fetch `/`, a real `/<handle>`, `/robots.txt`, `/sitemap.xml` and a nonexistent URL with `curl -sSI` and `curl -sS`. Record status codes, headers, `<head>` output, canonical, the raw HTML text a no-JS crawler sees, and whether a missing handle returns a real 404.
   - Run Lighthouse or PageSpeed Insights (mobile and desktop) for LCP, INP, CLS, the SEO score and accessibility. The `web-perf` skill may help.
   - Check `site:meAsAgent.vercel.app` and brand searches to see what's indexed now.
2. **Market and competitor map.** Find who ranks and who gets cited by AI answers for this space: AI clones or digital twins of yourself, AI personas of experts or creators, "talk to an AI version of <person>", `avatar.andrewng.org` (the product this was modelled on), and any others the searches surface. For each, record positioning, page types, URL structure, schema used, content hubs and the keyword angles they own. Also find the gaps they leave.
3. **Keyword research, end to end:**
   - Seed from the product's real features: launch an AI avatar or clone of yourself, AI that answers for you, talk to experts, voice AI of a person, AI that remembers visitors, weekly summaries for creators, and "digital twin" for founders, coaches, creators and teachers.
   - Expand with Google autocomplete (`https://suggestqueries.google.com/complete/search?client=firefox&q=...` across a–z modifiers and question words), People Also Ask, related searches, Reddit/Quora/X/Hacker News threads, YouTube titles, Google Trends and competitor headings.
   - Cluster by **search intent** (informational, commercial, transactional, navigational) and by persona (owner who launches, visitor who talks).
   - Score each cluster on relevance to what the product *actually does*, likely difficulty (who ranks: big brands or thin pages?), business value and how realistic it is for a new vercel.app site. Pick head, mid-tail and long-tail targets, with long-tail and question keywords as the realistic early wins.
   - Build a **keyword → URL map**: one primary intent per page, no cannibalisation, and each cluster assigned to an existing page, a proposed page or "not worth it".
   - Include the **programmatic long tail**: each listed avatar page ranking for "{name} AI", "talk to {name}", "ask {name}". Weigh it against privacy, thin content and the owner's consent. See the questions.
4. **AI search (GEO/AEO).** How do ChatGPT, Perplexity, Google AI Overviews and Claude answer "how can I make an AI version of myself that answers people" today, and what do they cite? What would it take for meAsAgent to be the cited answer?

Save the research as files: `seo/RESEARCH.md` (audit, competitors, AI-search findings, sources with dates) and `seo/KEYWORDS.md` (clusters, scores, the keyword → URL map). Keep the tables tight and readable.

## 4. Stop and ask me before planning

Ask everything at once, with a recommended option and your reasoning for each. Add anything else that would change the plan, and decide the small things yourself.

1. **Domain.** Build everything around `meAsAgent.vercel.app` now, with the migration plan written, or should I buy `meAsAgent.com` first? What does waiting cost?
2. **Avatar pages in search.** Should listed avatars be indexable by default, opt-in by the owner ("Show my avatar in search engines", which would mean a setting, a field and consent wording), or never? What about unlisted, declined and paused ones?
3. **What an avatar page shows to crawlers.** Only the name and bio exist publicly today. Is adding server-rendered context worth it (a clear H1, "an AI avatar of {name}, launched by them", a what-you-can-ask section written by the owner, an optional link to the owner's own site as `sameAs`)? That touches the launch form and the privacy notice.
4. **New content pages.** Which ones do we build: how it works, use cases per persona, honest comparisons, FAQ, a guides/blog hub? Is there an author voice and byline (me, as the builder), and how often can I realistically publish?
5. **AI crawlers.** Allow or block GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot and others, keeping in mind that avatar conversations are never public pages anyway. Do we ship an `llms.txt`?
6. **Growth loops.** Add a "Share your avatar" / "Made with meAsAgent" backlink loop, an embeddable widget, or per-avatar QR/share cards? They change the product UI.
7. **Tooling.** Will I connect Google Search Console and Bing Webmaster Tools, and give you exports? Is there any budget for a paid keyword tool?
8. **Language and market.** English only, or also Hindi/Hinglish and India-specific targeting (hreflang)?

## 5. The plan

After my answers, write `seo/PLAN.md`: every change ranked by impact ÷ effort, split into **Now** (technical foundations), **Next** (content and structured data) and **Later** (off-page, programmatic, domain move). Each item gets its target keywords, the files it touches, and how it will be verified. Wait for my go-ahead.

## 6. Build: the full scope to cover (trim it to what we agreed)

**Technical foundations**
- `web/src/app/robots.ts`: allow the public pages. Disallow `/launch/visitors`, `/launch/unsubscribe` and anything private. Point to the sitemap. Apply the AI-crawler decision.
- `web/src/app/sitemap.ts`: the static pages plus **listed, live** avatars only, with real `lastModified` values (expose `updatedAt` publicly if needed). Structure it so it can become a sitemap index at scale.
- Canonical URLs on every indexable page through `alternates.canonical`, using one lowercase host. Also: a consistent trailing-slash policy, real 404 status for unknown handles, the agreed behaviour for paused and unlisted avatars (`noindex` via `generateMetadata`), and `noindex` on `/launch` if it's only an app screen.
- Metadata on every page: unique titles (≤ 60 chars, keyword first, brand last through the template), descriptions (≤ 155 chars, written to earn the click), OG and Twitter with images, `applicationName`, `keywords` only if useful, `authors`, `creator`, and `formatDetection`.
- **OG images** with `next/og`: a site default, one per content page, and one per avatar showing their Google photo, name and "Talk to my AI avatar". It must handle a missing photo with the placeholder portrait and never break on long names or non-Latin scripts.
- `manifest.ts`, apple-touch icon and a PNG favicon set alongside `icon.svg`.
- **Structured data** as JSON-LD rendered on the server with a small typed helper (no dependency unless it earns its place): `Organization` + `WebSite` sitewide (no `SearchAction` unless search exists), `WebApplication`/`SoftwareApplication` on the home and how-it-works pages (no fake ratings or offers), `ProfilePage` with `mainEntity: Person` on listed avatar pages (name, image, description, `sameAs` only if the owner supplied it), `BreadcrumbList`, `FAQPage` where there's a real FAQ, and `Article` with author and dates on guides. Validate every type against schema.org and Google's current docs.
- **Crawlable content:** a server-rendered, semantic heading outline on every page. The directory gets an intro block that explains the product in words that match the keyword map. Internal links run from the directory and the footer to the content pages, and between related content. Descriptive alt text everywhere.
- **Performance and Core Web Vitals:** measure first, then fix. Look at LCP on `/` and `/<handle>`, the client bundle `AppShell` ships, image sizing (`next/image` with `remotePatterns` for Google photos where it helps), font loading, CLS from late UI, and caching headers. Report the numbers before and after.
- Security and quality headers that help trust without breaking voice or the api (don't break the microphone, worklets or the cross-origin api calls).

**Content** (only what we agreed, in the site's existing design language)
- Pages built as server components, with copy held as typed data where that keeps pages presentational. They follow the keyword → URL map, answer the query in the first 100 words, use real headings, include an honest FAQ, and link internally.
- Accuracy is strict: consent, memory, owners reading conversations and the weekly email must be described **exactly** as `privacy/page.tsx` and the code say. No medical, legal or financial claims for any persona.
- Comparison pages must be fair, sourced, dated and easy to keep current.
- An **editorial calendar** in `seo/CONTENT-CALENDAR.md`: 12 weeks of pieces, each with a target keyword, intent, outline, internal links and a CTA.

**AI-search readiness**
- `llms.txt` (if agreed) with a concise, factual description of the product and its key URLs.
- Pages written as extractable answers: definitions, steps and short factual paragraphs that an AI answer can quote and cite.

**Off-page and launch playbook** (written, not executed): `seo/OFF-PAGE.md`
- The Search Console and Bing Webmaster setup, sitemap submission and URL inspection steps.
- A launch sequence: Product Hunt, Show HN, Indie Hackers, relevant subreddits (respecting their self-promotion rules), X/LinkedIn build-in-public posts and AI-tool directories. For each: the angle, a draft post, and what link it earns.
- How avatar owners become the backlink engine (sharing their `/<handle>` link from bios and websites), plus outreach targets for honest coverage.
- The domain-migration runbook for when `meAsAgent.com` is bought.

**Measurement:** `seo/MEASUREMENT.md` covers the KPIs (impressions, clicks, CTR, avg. position per cluster, indexed pages, brand-search growth, launches that came from organic search, CWV), where each one is read, the baseline taken today, and 30/60/90-day targets that are realistic for a new site.

## 7. Verify before you say it's done

- `cd web && bun run build && bun run typecheck && bun run lint`. Also run `cd api && bun run typecheck` and the admin checks if you touched either.
- Run the stack locally (`bun run db:start`, `bun run dev`). Kill test servers by port, because bun is a Volta shim. Then `curl` the rendered HTML of `/`, a listed avatar, an unlisted avatar, a paused avatar, a missing handle and every new page. Show that the titles, descriptions, canonicals, robots meta, JSON-LD and status codes are what the plan says.
- Fetch `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/llms.txt` and each OG image route. Confirm the sitemap is valid XML and contains **no** unlisted or paused avatars. Look at the OG images by opening the PNGs.
- Parse every JSON-LD block and check it against schema.org types. List the Rich Results Test and Schema Validator URLs I should run after deploy.
- Run Lighthouse on the production build locally, before and after.
- Confirm nothing visual changed on existing screens unless we agreed it would.

## 8. Hand-off

Write `seo/SEO.md` in the style of `STAGE-5.md` / `OWNER-VIEW.md`:
- **What you have to do before it works:** deploy, Search Console, Bing, env vars, and any owner-facing wording I must approve.
- **The decisions that shaped this:** each with its reasoning and what was rejected.
- **What is where.**
- **What I verified, and what I could not.**
- **Things I changed that you did not ask for.**
- **Still open.**

Add a short SEO section to `CLAUDE.md` with the rules future work must keep: the reserved-handle check for new routes, only listed avatars in the sitemap, metadata and JSON-LD on every new public page, and no fake markup.

Then give me a summary: files changed, the before/after numbers, and the top five things I should do this week.
