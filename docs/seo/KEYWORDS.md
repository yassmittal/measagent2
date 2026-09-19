# Keywords — meAsAgent

Taken 2026-09-16. Method: seeds from what the product actually does, expanded
through Google autocomplete (`suggestqueries.google.com`, en/US, 30 seeds × 7
modifiers), related searches, competitor H1/H2s and sitemaps, and the questions
AI-answer sources are built around. `RESEARCH.md` has the SERP evidence.

**Volumes (added 2026-09-16, after the plan):** openSEO (DataForSEO) was
connected and one batch of 45 keywords was measured — table below. The cluster
table keeps its relative "signal" column for everything the batch did not cover.
Where no row appears for a keyword, DataForSEO returned no data (too low to
measure). "Signal" below is relative: **●●●** = autocomplete returns
many variants of the phrase, **●●** = a few, **●** = the phrase itself or a close
variant, **○** = nothing. Difficulty is read from who ranks: **H** = big brands or
well-funded vendors with content hubs, **M** = vendor blogs and listicles, **L** =
thin or no matching pages.

Scores are 1–5. **Fit** = how exactly it describes what ships today. **Value** =
how likely a searcher launches or talks. **Realism** = for a new `vercel.app` site
in its first 90 days.

---

## Measured volumes (openSEO / DataForSEO, United States, English, 2026-09-16)

Monthly searches, keyword difficulty (0–100), intent as DataForSEO labels it.
500 credits were available; this batch used them.

| Keyword | Volume | KD | Intent | Maps to |
|---|---:|---:|---|---|
| ai avatar | 4,400 | 42 | informational | — (image/video intent; not worth it) |
| ai twin | 4,400 | 0 | informational | — (therapy apps, video; glossary mention in the guide) |
| delphi ai | 1,900 | 7 | informational | navigational for Delphi; `/compare/delphi` catches the comparison slice |
| **ai clone** | **1,000** | **18** | transactional | `/guides/make-an-ai-version-of-yourself` (secondary) |
| **ai digital twin** | **880** | **15** | transactional | guide FAQ + how-it-works; **candidate for its own guide** (see calendar week 3) |
| ai persona | 720 | 36 | informational | — (marketing-persona intent) |
| personify ai | 260 | 0 | informational | a later `/compare/personify` |
| **ai version of me** | **210** | 26 | informational | guide |
| coachvox | 170 | 0 | navigational | a later `/compare/coachvox` |
| steno ai | 170 | 40 | informational | — |
| **how to make an ai of yourself** | **70** | **10** | informational | guide (primary) |
| ai version of yourself | 50 | 17 | informational | guide |
| create ai clone of yourself free | 40 | 0 | transactional | guide + how-it-works FAQ ("free") |
| how to make an ai version of yourself | 40 | 0 | informational | guide (primary) |
| ai avatar of yourself | 30 | 44 | informational | — |
| create an ai version of yourself | 30 | 20 | informational | guide |
| make an ai chatbot of yourself | 30 | 16 | informational | guide FAQ |
| ai clone of yourself | 20 | 3 | informational | guide |
| make an ai clone of yourself | 20 | 4 | informational | guide |
| create ai clone | 20 | — | informational | guide |
| personal ai avatar | 20 | 34 | navigational | — |
| delphi ai alternative | 10 | — | commercial | `/compare/delphi` |
| make an ai version of yourself | 10 | 32 | informational | guide |

**No measurable volume:** can I make an AI chatbot of myself, talk to AI versions
of people / famous people, AI clone for coaches / creators / founders / teachers,
AI avatar for founders, AI that answers questions for me, AI that talks for me,
AI clone chatbot, talk to an AI avatar, AI agent of yourself, AI twin for
creators, AI clone ethics, meet AI Andrew Ng, Delphi digital mind.

**What the numbers changed:**
- The **guide** is the highest-value page: "ai clone" (1,000, KD 18) and the
  "how to make an ai of yourself" family are low-difficulty and exactly its topic.
- **"ai digital twin" (880, KD 15)** was "not worth it" on relative signal. It is
  worth a dedicated, honest explainer — week 3 of the calendar.
- **The persona pages have no measurable demand.** They stay (built, cheap, good
  landing pages for links shared to those audiences), but no more persona pages
  until Search Console shows impressions for them.
- **Comparison pages** have small but commercial demand; Personify (260) and
  Coachvox (170) are the next two after Delphi.

---

## What the product can and can't honestly rank for

| Can claim (true in code) | Must not claim |
|---|---|
| An AI avatar **of yourself, or of something you run**, that people talk to by **text or voice** | "trained on your content, docs, podcasts" (no RAG yet) |
| Only ever of the Google account that launched it | "clones **your** voice" (one shared voice) |
| Remembers signed-in visitors between conversations, follows up once on unfinished things | video avatar, lip-sync, a 3D avatar |
| The owner reads every conversation and gets a weekly email that flags who needs them | payments, monetisation, embeds, WhatsApp |
| Launch in minutes: a handle, a bio and three notes | "verified" people (review gates the directory, not identity beyond Google) |
| Reviewed directory; says it's an AI when asked | "free forever" — only "Free while meAsAgent is in early access" (decided 2026-09-16) |

---

## Clusters

| # | Cluster | Example queries (autocomplete-verified) | Intent | Persona | Signal | Diff. | Fit | Value | Realism | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| A | **Make an AI version of yourself** | how to make an AI version of yourself · create an AI version of yourself free · can you make an AI version of yourself · talk to an AI version of yourself | Info → commercial | Owner | ●●● | H | 4 | 5 | 2 | **Target** with a guide; mid-term |
| B | **AI clone of yourself** | make an AI clone of yourself free · create AI clone of yourself · how do you make an AI clone of yourself · AI clone yourself app | Commercial | Owner | ●●● | H | 3 (video-heavy SERP) | 4 | 2 | **Secondary** on the same guide |
| C | **AI chatbot of yourself** | make an AI chatbot of yourself (free) · can I make an AI chatbot of myself · AI bot of myself · AI chat with myself | Info/commercial | Owner | ●● | M | 5 | 4 | 3 | **Target**: best early fit |
| D | **AI avatar of yourself** | make an AI avatar of yourself · create an AI avatar of yourself · AI avatar of yourself free | Mixed: mostly **image/video** | Owner | ●●● | H | 2 | 2 | 1 | **Not worth it** as a head term (ambiguity); only as the brand's own word |
| E | **Talk to AI versions of people** | talk to AI versions of people · talk with AI versions of famous people · talk to an AI avatar | Info/navigational | Visitor | ●● | M | 3 (no famous people, by rule) | 3 | 3 | **Target** on `/` with an honest angle: *real people, launched by themselves* |
| F | **For founders / creators / teachers / coaches / investors** | AI clone for coaches (thin) · digital twin creators · founders, teachers: ○ | Commercial | Owner | ●/○ | H for coaches, L for others | 4 | 4 | 4 (founders, teachers), 2 (coaches) | **Target** long tail with persona pages |
| G | **AI that answers for me and tells me what matters** | AI that answers questions for me · a.i. that answers text messages · AI that talks for me · (AI clone to answer DMs: ○) | Problem-aware | Owner | ●● | L–M | 5 | 5 | 4 | **Target**: the differentiator, nobody owns it |
| H | **Alternatives / comparisons** | delphi ai alternative · alternative to delphi ai · (coachvox / personify alternative: via competitor compare pages) | Commercial | Owner | ● | M | 4 | 5 | 3 | **Target**, fair and dated |
| I | **AI twin / digital twin** | AI twin · AI twin meaning · how to create a digital twin · AI twin vs digital twin | Info (polluted: therapy apps, industrial twins) | Owner | ●●● | H | 2 | 2 | 1 | ~~Glossary mention only~~ **Revised by volume:** "ai digital twin" (880, KD 15) earns an explainer |
| J | **Memory / follow-up** | (AI avatar that remembers: ○) · AI that remembers conversations | Info | Both | ○/● | M (companion apps) | 4 | 2 | 2 | **Supporting section** on how-it-works, not a page |
| K | **Voice** | talk to AI with voice free · talk to AI voice to voice · AI voice clone myself | Mixed; clone intent we can't serve | Visitor | ●●● | H | 2 | 2 | 1 | **Not worth it**; mention voice as a feature only |
| L | **Brand / navigational** | meAsAgent · me as agent · measagent | Navigational | Both | ○ (new) | L, but collides with *Me-Agent* (arXiv) | 5 | 5 | 5 | **Target** on `/` + Organization entity |
| M | **Programmatic: a person's avatar** | "{name} AI" · "talk to {name}" · "ask {name}" · "{name} AI avatar" | Navigational | Visitor | depends on the person | L for unknown people, H for famous ones | 5 | 3 | 4 | **Target** on listed `/<handle>`, subject to Q2 |
| N | **Consent / safety** | can someone make an AI of me without permission · AI clone ethics consent | Info | Both | ● | M (press, academia) | 5 | 2 | 3 | **FAQ answer** + a guide later; trust asset for GEO |
| O | **Generic "talk to AI"** | talk to an AI for free · AI apps to talk to · talk to AI for therapy | Generic | Visitor | ●●● | H | 1 | 1 | 1 | **Not worth it** (and therapy is off-limits) |

---

## Targets by tier

**Head (long-run, don't expect movement in 90 days):** make an AI version of
yourself · AI clone of yourself · AI avatars of real people.

**Mid-tail (realistic in 3–6 months with links):** make an AI chatbot of yourself ·
talk to an AI version of someone · Delphi AI alternative · AI version of yourself
for founders · AI that answers questions for you.

**Long-tail and questions (the early wins):**
- can I make an AI chatbot of myself
- how to make an AI version of yourself for free (only if Q10 = free)
- AI avatar for founders to answer questions · AI clone for teachers to answer students
- AI that answers people for me and summarises what they said
- can someone make an AI clone of me without permission
- does an AI clone remember the people it talks to
- how do I know what people asked my AI clone
- talk to {name}'s AI avatar · {name} AI

---

## Keyword → URL map

One primary intent per URL. Proposed URLs are checked against production handles
(none held, see `RESEARCH.md` §4) and must be added to `RESERVED_AVATAR_HANDLES`.

| URL | Status | Primary target | Secondary | Title draft (≤ 60, brand via template) | Clusters |
|---|---|---|---|---|---|
| `/` | exists | AI avatars of real people · meAsAgent (brand) | talk to AI versions of people | `meAsAgent — Talk to AI avatars of real people` (default title, no template) | E, L |
| `/<handle>` (listed) | exists | talk to {name} · {name} AI | ask {name} | `Talk to {name}'s AI avatar` | M |
| `/launch` | exists (app screen) | — (noindex, or a thin landing, see Q4) | | `Launch your AI avatar` | — |
| `/how-it-works` | **proposed** | how an AI avatar of yourself works | AI that remembers visitors, owner reads conversations, weekly summary | `How an AI avatar of yourself works` | A (support), G, J, N |
| `/for/founders` | **proposed** | AI avatar for founders | answer investor/customer questions | `An AI avatar for founders` | F, G |
| `/for/creators` | **proposed** | AI version of yourself for creators | answer your audience's DMs | `An AI version of yourself for creators` | F, G |
| `/for/teachers` | **proposed** | AI avatar for teachers | answer students' questions | `An AI avatar that answers your students` | F |
| `/for/coaches` | **proposed, later** | AI clone for coaches (H: Coachvox, Personify) | | `An AI avatar for coaches` | F |
| `/for/investors` | **proposed, later** | AI avatar for investors · founders pitching | | `An AI avatar for investors` | F, G |
| `/guides/make-an-ai-version-of-yourself` | **proposed** | how to make an AI version of yourself | AI clone of yourself, AI chatbot of yourself | `How to make an AI version of yourself` | A, B, C |
| `/guides/ai-clone-consent` | **proposed, later** | can someone make an AI clone of me without permission | AI clone ethics | `Can someone make an AI of you without asking?` | N |
| `/compare/delphi` | **proposed** | Delphi AI alternative | meAsAgent vs Delphi | `meAsAgent vs Delphi: an honest comparison` | H |
| `/compare/ai-clone-tools` | **proposed, later** | best tools to make an AI version of yourself | | `Tools to make an AI version of yourself, compared` | A, H |
| `/faq` | **fold into `/how-it-works`** | (avoid cannibalising how-it-works) | | — | — |
| `/privacy`, `/terms` | exist | brand + privacy (trust) | | as today | — |
| `/blog` | **not proposed** | a guides hub is enough at this cadence | | — | — |
| AI twin / digital twin page | **not worth it** | | | | I |
| voice / "talk to AI free" pages | **not worth it** | | | | K, O |
| "AI avatar of yourself" (image/video intent) | **not worth it** | | | | D |

**Cannibalisation rules:**
- `/` owns "AI avatars of real people" and the brand. It must not target "make an
  AI version of yourself"; that belongs to the guide.
- `/how-it-works` owns the mechanism ("how it works", memory, owner view). The
  guide owns the *how-to* query and links to `/how-it-works` for detail.
- Persona pages own "for {persona}" only. They don't repeat the guide's steps;
  they link to it.
- Avatar pages own only their person's name.

---

## The programmatic long tail: avatar pages

What's gained: each listed avatar is a page that can rank for its owner's name
plus "AI", and every owner who links to it from their bio or site brings a
backlink to the domain. Delphi (`ProfilePage` + `Person`, ~5,000 profile URLs in
its sitemap) and Twinly Lab (`Person`, profiles in the sitemap) both index them.

What it costs or risks:
- **Consent.** Owners agreed to a public page reachable by link and to the
  directory. The privacy notice says the name and photo are shown "on your
  avatar's page, and in the directory once it has been reviewed". It doesn't say
  "in search engines". Indexing is arguably covered (a public page), but a person
  searching their own name and finding "Talk to X's AI avatar" may not expect it.
- **Thin content.** Today a page is a name and a bio of ≤ 280 characters. At scale
  that's hundreds of near-identical thin pages, which can drag down how Google
  judges the whole site. It needs more real, owner-written text on the page, or
  indexing held back until a page has enough.
- **Non-person avatars** (TileVille, RavenHouse): `Person` markup would be false.

Recommendation, detailed in the questions: index **listed + live** avatars only,
with **an owner opt-out** rather than opt-in. The launch form would say so. Apply
`noindex` automatically when the page is thin, and use `ProfilePage`/`Person` only
when the avatar is a person.
