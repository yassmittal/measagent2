# SEO research — meAsAgent

Taken 2026-09-16 against `https://measagent.vercel.app`. Phases 1–3 of
`SEO-PROMPT.md`: the audit, the market, and AI search. Keywords are in
`KEYWORDS.md`. Nothing has been changed in the code yet.

**Data limits, stated once:** no paid keyword tool, Search Console or Bing data
was available (the `openseo` MCP is installed but needs your sign-in). PageSpeed
Insights' API was over its daily quota, so Lighthouse 12 ran locally in headless
Chrome against production instead. I could not query ChatGPT, Perplexity, Google
AI Overviews or Claude.ai directly; the AI-search section uses web search as a
proxy and says so. No search volumes appear anywhere, because I have none.

---

## 1. Live technical audit

### Status codes and redirects

| URL | Status | Notes |
|---|---|---|
| `/` | 200 | `cache-control: private, no-store` (dynamic via `connection()`) |
| `/yashmittal`, `/tileville`, `/secorra`, `/ravenhouse` | 200 | the four listed avatars |
| `/yash`, `/yash2` | 404 | the local handles don't exist in production |
| `/this-handle-does-not-exist` | **404** + `<meta name="robots" content="noindex">` | real 404 ✅ |
| `/YashMittal` | 404 | uppercase isn't redirected to the lowercase handle |
| `/yashmittal/` | 308 → `/yashmittal` | no-trailing-slash policy already consistent ✅ |
| `http://…/` | 308 → `https://…/` | ✅ |
| `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/llms.txt`, `/favicon.ico`, `/opengraph-image` | 404 | none exist |
| `/launch` | 200, indexable | |
| `/launch/visitors` | 200 + `noindex` | |
| `/privacy`, `/terms` | 200, indexable | |

Headers on every page: only `strict-transport-security` for security. No
`x-content-type-options`, `referrer-policy` or `permissions-policy`, and
`x-powered-by: Next.js` is exposed. The function runs in `iad1`, so requests
from India go `bom1::iad1`. Curl TTFB was 0.35–0.83 s from here.

### What the `<head>` says

| Page | Title | Description | Canonical | OG image | JSON-LD | Robots |
|---|---|---|---|---|---|---|
| `/` | meAsAgent — AI avatars of real people | the tagline | none | none | none | default |
| `/yashmittal` | Talk to Yash Mittal — meAsAgent | bio ("A full-stack software engineer + AI Engineer") | none | none | none | default |
| `/launch` | Launch your avatar — meAsAgent | "Launch an AI avatar of yourself…" | none | none | none | default |
| 404 | the site default title | tagline | — | — | — | noindex |

Bugs:

- **`/launch` inherits `og:title` and `og:url` from the root**, so a shared launch
  link previews as the home page with `og:url=https://measagent.vercel.app`.
- The 404 page has the site's default title. Its "This page could not be found"
  text exists only in the RSC payload, not in the HTML.
- `SITE_URL` is `https://meAsAgent.vercel.app` (mixed case). Next normalises it,
  so `og:url` comes out lowercase already. The source should say the lowercase
  form too, so a hand-built URL never differs.

### What a crawler without JavaScript reads

| Page | Headings | Links in the body | Words (roughly) |
|---|---|---|---|
| `/` | one H1: "meAsAgent" | `/launch` + 4 avatars | ~120 (tagline + 4 bios) |
| `/yashmittal` | **none** | `/privacy` only | ~25: name twice, bio, "Send a message first, then you can talk", the owner notice |
| `/launch` | none | `/` | 1: "Back" |

- **Avatar pages have no H1, no link to the directory or other avatars, and
  `alt=""` on the portrait.** A crawler lands on a dead end.
- **The home page doesn't link to `/privacy` or `/terms`.** They're only reachable
  from the notice line inside the chat, so the home page gives no trust signals.
- `AppShell` is a client component. Its SSR output still carries the name and
  bio, but the empty-thread copy is client-rendered.

### Lighthouse 12 (local headless Chrome, production URLs, 2026-09-16)

| Page | Form factor | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT | FCP |
|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 100 | 96 | 100 | 100 | 1.7 s | 0 | 20 ms | 1.1 s |
| `/` | desktop | 100 | 96 | 100 | 100 | 0.4 s | 0 | 0 ms | 0.4 s |
| `/yashmittal` | mobile | 97 | 100 | 100 | 100 | **2.5 s** | 0 | 20 ms | 1.2 s |
| `/yashmittal` | desktop | 100 | 100 | 100 | 100 | 0.5 s | 0 | 0 ms | 0.3 s |

- **Mobile LCP on avatar pages is 2.5 s**, right at the "good" limit. The LCP
  element is `p.thread-empty` ("Say hello — …"), and **72% of it is render delay**
  (1.8 s). That text only appears after hydration. TTFB is the other 28%.
- A11y 96 on `/`: `.avatar-directory-launch` fails colour contrast.
- The Google photos load as `=s96-c` JPEGs from `lh3.googleusercontent.com` with a
  one-day cache (Lighthouse flags modern formats and cache TTL). The avatar page
  ships about 200 KB of gzipped JS across 9 chunks, plus 54 KB of CSS.
- Lighthouse's SEO score of 100 means little here: it checks that tags exist,
  not that the page has content, canonicals or structured data.
- No field (CrUX) data exists, because the site has too little traffic.

**Conclusion:** performance isn't the bottleneck. Discoverability and content are.

### Index status

- `site:measagent.vercel.app` returns **nothing**. The site isn't indexed.
- Brand searches for `meAsAgent` and `"me as agent"` return **nothing about this
  product**. They return an arXiv paper, *Me-Agent* (2601.20162), a GitHub repo
  `me-agent`, and dictionary pages for "agent". The brand name has to earn its
  own entity, and people will type "me as agent", "measagent" and "meAsAgent".
- `@vercel/analytics` is live. No Search Console or Bing Webmaster.

### A finding that changes the plan: the listed avatars aren't all people

Production lists four avatars. Only one clearly fits "an AI avatar of a real
person":

| Handle | Google name | Bio says it is |
|---|---|---|
| `yashmittal` | Yash Mittal | a person ✅ |
| `tileville` | TileVille | a blockchain game ("I'm TileVille, a strategy city-building game…") |
| `ravenhouse` | RavenHouse | an NFT marketplace on Aztec |
| `secorra` | Angie Lawrence | "Secora is my homegrown non-LLM AI…", a project, under a person's name |

This matters for SEO in three ways. `Person` markup on `/tileville` would be
false markup. The core claim "AI avatars of real people" is contradicted on the
front page. And the keyword strategy differs if products and brands can have
avatars. See question 9.

---

## 2. Market and competitor map

Checked live on 2026-09-16 (titles, H1/H2, JSON-LD, robots.txt, sitemap and
llms.txt fetched directly).

| Product | Positioning (their words) | Page types / URL structure | Schema | llms.txt | Keyword angles they own |
|---|---|---|---|---|---|
| **[Delphi](https://www.delphi.ai/)** | "Turn Your Perspective Into Conversation", a "Digital Mind" | `/<handle>` profiles at the root (~5,000 URLs in sitemaps), `/discover/people/<topic>` hubs, `/blog` | `ProfilePage` + `Person` on profiles, title "{Name} - Ask Me Anything • Delphi" | 404 | "digital mind", "clone yourself", people-directory long tail |
| **[Personify](https://personify.fyi/)** | "Your AI expert clone. Live in 10 minutes." Coaches | `/ai-clone/`, `/ai-coach/`, `/blog/…` (40+ posts), `/de/ /es/ /fr/ /pt/` | Organization, WebSite, SoftwareApplication, **AggregateRating**, Offer, SearchAction | ✅ detailed | "AI clone", "AI coaching clone", "AI chatbot of yourself", "AI twin vs digital twin" |
| **[Coachvox](https://coachvox.ai/)** | "Create an AI version of you", the AI tool for coaches | WordPress, post/page sitemaps | FAQPage, BreadcrumbList, WebSite + SearchAction | 404 | "AI version of you", coaches |
| **[Steno.ai](https://www.steno.ai/)** | "AI Twins for brands and experts", done-for-you, from $500/mo | `/coaches /experts /influencers /brands`, `/compare/steno-ai-vs-<x>`, `/compare/best-platforms-…-2026` | SoftwareApplication, **AggregateRating**, FAQPage | ✅ short | "AI twin", comparison SERPs, "best platforms to create an AI version of yourself" |
| **[Twinly Lab](https://twinlylab.com/)** | "You can't be everywhere. Your AI twin can." Video, $5/conversation | `/how-it-works`, `/for/<persona>` (6), `/compare/twinly-lab-vs-<x>` (8), `/guides/…`, `/<handle>` profiles in the sitemap | Person on profiles, FAQPage, SoftwareApplication, AggregateOffer | ✅ | The closest structural match to what we'd build: persona pages, comparisons, indexed profiles |
| **[MindBank AI](https://www.mindbank.ai/)** | "learn, earn and live forever", a digital twin assistant | blog | none | — | "digital twin AI assistant" |
| **[SuperMe](https://superme.ai/)** | "Ask the people who've actually done it" | — | none | — | expert Q&A network |
| **[Viven](https://viven.ai/)** | Enterprise digital twins | — | none | — | "digital twin for teams" |
| **[Tavus](https://www.tavus.io/)** / HeyGen / Synthesia | Video avatars, "AI clone" as video | tools, blog | — | — | "AI video of yourself", "AI avatar of yourself": the **video** meaning |
| **Character.ai** | Characters, including "yourself" clones | `/character/<id>` | (blocked our fetch) | — | "chat with AI of X", fan characters |
| **[avatar.andrewng.org](https://avatar.andrewng.org/)** | "AI Andrew — an intellectual companion… remembers your story, keeps thinking between your conversations" | a single-person app (2.7 KB HTML shell), built by [RealAvatar](https://www.realavatar.ai/) | none | — | only its own name |

Pricing checked on 2026-09-16: [Delphi](https://www.delphi.ai/pricing) has Free /
Builder $79 / Scaler $299 / Immortal custom, with voice calling on every tier.
[Personify's llms.txt](https://personify.fyi/llms.txt) lists free at 100
messages/month and Pro at $39/month. Steno's comparison page lists Coachvox at
$99/month and Steno at $500+/month (Steno's own page, so not independent).

**What they have in common:**
- **Knowledge ingestion is the pitch.** "Trained on your content, docs, podcasts,
  courses." meAsAgent **does not** do this today (Stage 6 RAG isn't built), so
  we can't compete on that claim and mustn't imply it.
- **Monetising coaches** ("get paid forever", "$5/conversation"). meAsAgent has
  no payments.
- **Voice cloning.** Delphi and Personify clone the owner's voice. meAsAgent uses
  **one shared voice for every avatar**, so "voice" copy must never say "your voice".
- AggregateRating markup is common (Personify, Steno). We won't copy it.

**Gaps they leave, where meAsAgent is actually different, checked against our code:**
1. **The owner hears what matters.** Owners read every conversation
   (`/launch/visitors`) and get a weekly email that flags who needs them. No
   competitor homepage leads with "you still hear what matters". Theirs is
   deflection and monetisation.
2. **The avatar remembers each signed-in visitor across conversations and
   follows up once on unfinished things** (return reminders). Only
   avatar.andrewng.org leads with this, and it isn't self-serve.
3. **Identity-bound: an avatar can only be of the Google account that launched
   it.** Delphi (per [VentureBeat, 2023](https://venturebeat.com/ai/you-can-now-make-an-ai-clone-of-yourself-or-anyone-else-living-or-dead-with-delphi))
   has allowed clones of anyone. That's dated and should be rechecked before any
   comparison page quotes it. "Can't be used to impersonate you" is an honest and
   distinctive trust angle.
4. **Free, no ingestion step, minutes to launch**: a handle, a bio and three notes.
   (Is "free" a promise you want in copy? See question 10.)
5. **Founders, investors and teachers** are barely targeted. Everyone fights over
   coaches.

**Note:** `private.md` records that you didn't want the reference project mentioned
anywhere. It appears in this internal file only because the brief asked. I won't
name it on any public page, comparison or llms.txt.

---

## 3. AI search (GEO/AEO)

**Method:** web searches for the prompt "how can I make an AI version of myself
that answers people" and variants, on 2026-09-16. This approximates what
retrieval-based engines (Perplexity, ChatGPT search, AI Overviews) pull from. I
couldn't run the engines themselves.

**What gets surfaced and cited:**
- **Listicles and comparisons:** [Steno — best platforms 2026](https://www.steno.ai/compare/best-platforms-to-create-an-ai-version-of-yourself-2026-comparison),
  [David Riha — 7 best tools](https://davidriha.com/blog/best-tools-create-ai-version-of-yourself-2026/)
  and [12 best AI digital twin tools](https://davidriha.com/blog/best-ai-digital-twin-tools-2026/),
  [meetaiyou comparison](https://meetaiyou.com/comparisons/ai-clone-platform-comparison-2026).
- **Step-by-step guides:** [Creatify](https://creatify.ai/blog/how-to-create-an-ai-version-of-yourself),
  [Dupple](https://dupple.com/learn/how-to-make-an-ai-of-yourself),
  [Spheria](https://spheria.ai/blog/making-an-ai-version-of-yourself-step-by-step-guide),
  [Tavus](https://www.tavus.io/blog/how-to-make-an-ai-clone-of-yourself),
  [Orbit Media](https://www.orbitmedia.com/blog/how-to-make-ai-clone-custom-gpt/).
- **Vendor pages with FAQ blocks and llms.txt** (Personify, Steno, Twinly).
- **Press** as authority: [Forbes, 2025](https://www.forbes.com/sites/jonathanreichental/2025/03/10/inside-the-artificial-intelligence-that-can-clone-your-mind/),
  [Forbes (Jodie Cook), 2024](https://www.forbes.com/sites/jodiecook/2024/12/10/5-ways-to-clone-yourself-with-ai/).

The answers these produce follow a pattern: "a digital twin has layers (chatbot,
voice, video); start with a chatbot; tools: Delphi, Personify, Coachvox, HeyGen;
disclose that it's AI."

**What it would take to be the cited answer:**
1. **Be in the listicles.** Retrieval engines cite them more than vendor pages.
   Honest outreach to the three list authors above is the highest-leverage GEO move.
2. **One definitional page that answers in its first 100 words**, with a
   distinctive, quotable fact: what an avatar is, and how it differs from a
   chatbot or a video clone ("text and voice, remembers visitors, the owner reads
   conversations and gets a weekly summary, only ever of yourself").
3. **An honest comparison** with a dated table. Engines extract tables readily.
4. **FAQ blocks with short factual answers** that match the questions in
   `KEYWORDS.md` ("Can I make an AI chatbot of myself?", "Is it free?", "Can
   someone make an AI of me without permission?").
5. **llms.txt** (three of the five closest competitors ship one) and crawler access
   for the AI bots.
6. **An entity:** consistent name, logo and `Organization` sameAs (your GitHub/X/
   LinkedIn), so "meAsAgent" stops resolving to the arXiv *Me-Agent* paper.

---

## 4. Where the docs and the brief disagree with the code

- `DEMO.md` doesn't exist. The product story was taken from `README.md`,
  `PLAN.md` §0/§15–17 and the brief.
- The brief says the indexable surface includes `/<handle>` with the title "Talk to
  {name}". Confirmed. Unlisted, declined and pending avatars are indexable the same
  way today, because `AvatarProfile` has no `listing` (confirmed in
  `shared/src/avatars.ts` and `toAvatarProfile`).
- Paused avatars return 200 with one line of text, and no `noindex` (confirmed in
  `app/[handle]/page.tsx`). None is paused in production right now.
- Handles that a proposed route would take: **none of `blog`, `guides`,
  `use-cases`, `how-it-works`, `faq`, `pricing`, `compare`, `for`, `features`,
  `about`, `opengraph-image`, `twitter-image`, `apple-icon`, `manifest`** is held
  in production. Each returns 404, and a paused or unlisted avatar would return
  200. The local database wasn't running, so it wasn't checked; I'll check it
  before adding routes. `RESERVED_AVATAR_HANDLES` currently lacks `blog`,
  `guides`, `compare`, `for`, `how-it-works`, `faq`, `pricing`, `opengraph-image`,
  `twitter-image`, `apple-icon` and `manifest`.

---

## Sources (all accessed 2026-09-16)

Live fetches: measagent.vercel.app (pages above), delphi.ai (home, `/pricing`,
`/robots.txt`, sitemaps, `/jim-grady`), personify.fyi (home, robots, sitemap,
llms.txt), coachvox.ai (home, robots, sitemap), steno.ai (home, robots, sitemap,
llms.txt, comparison page), twinlylab.com (home, robots, sitemap, `/shivam`),
mindbank.ai, superme.ai, viven.ai, tavus.io, sensay.io, personal.ai, fab.bio,
avatar.andrewng.org. Google autocomplete via `suggestqueries.google.com` (see
`KEYWORDS.md`). Web search results linked inline above.
