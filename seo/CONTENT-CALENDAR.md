# Content calendar — 12 weeks

Starts the week of **2026-09-21**. Six pieces, one every two weeks, the pace you
said you can review. Each piece goes into `web/src/content/guides.ts` (or
`comparisons.ts`) as data, so it gets its route, metadata, `Article` and
`FAQPage` markup, sitemap entry, footer link and `llms.txt` line with no new page
code. Volumes are from `KEYWORDS.md` (US, 2026-09-16); "—" means too low to measure.

Rules for every piece, from `CLAUDE.md` § SEO: answer the query in the first 100
words; every claim about meAsAgent true of the code that ships; every claim about
another product linked to its source with the date checked; no invented numbers,
quotes or customers; byline Yash Mittal.

| Week | Piece | URL | Target keyword (volume, KD) | Intent |
|---|---|---|---|---|
| 1 (live) | How to make an AI version of yourself | `/guides/make-an-ai-version-of-yourself` | how to make an ai of yourself (70, 10) · ai clone (1,000, 18) | Informational |
| 1 (live) | meAsAgent vs Delphi | `/compare/delphi` | delphi ai alternative (10) | Commercial |
| 2 | Set up the pages, submit, watch | — | — | (Search Console week — see `OFF-PAGE.md`) |
| 3 | What is an AI digital twin? | `/guides/what-is-an-ai-digital-twin` | ai digital twin (880, 15) · ai twin (4,400, 0) | Informational |
| 5 | meAsAgent vs Personify | `/compare/personify` | personify ai (260, 0) | Commercial |
| 7 | What to write so your AI avatar sounds like you | `/guides/write-your-ai-avatar-notes` | ai version of me (210, 26) | Informational |
| 9 | meAsAgent vs Coachvox | `/compare/coachvox` | coachvox (170, 0) | Commercial |
| 11 | Can someone make an AI clone of you without permission? | `/guides/ai-clone-consent` | — (trust asset; AI-answer citations) | Informational |
| 12 | Review: refresh every "checked on" date, re-rank the next quarter from Search Console | — | — | — |

---

## Week 3 — What is an AI digital twin?

- **Angle:** the term means three unrelated things (industrial simulation, a video
  or voice likeness, a conversational AI of a person). Define each in one line,
  then go deep on the conversational kind. Honest, vendor-neutral first half.
- **Outline:** a definition in 40 words · three meanings table · what a
  conversational twin actually knows (what you write vs what it is trained on) ·
  what it can and cannot do · consent and disclosure · how to try one (routes, as
  in the guide) · FAQ: "is an AI twin the same as an AI clone?", "is it safe?",
  "does it sound like me?"
- **Internal links:** → guide, → `/how-it-works`, → `/compare/delphi`; add a link
  back from the guide's FAQ answer on digital twins.
- **CTA:** "Launch your own avatar" → `/launch`.

## Week 5 — meAsAgent vs Personify

- **Angle:** Personify is coach-focused (courses, memberships, embeds, "done for
  you" voice cloning). Fair split: who each is for.
- **Before writing:** re-read `personify.fyi` and its `llms.txt`; every row needs
  `sourceUrl` + `checkedOn`. Their llms.txt on 2026-09-16 listed a free tier of
  100 messages/month and Pro at $39/month — re-check, do not copy.
- **Outline:** lede with the one-sentence verdict · table (answers from, voice,
  owner reads conversations, visitor memory, embeds, price) · choose X if / choose
  Y if · FAQ.
- **Internal links:** → `/compare/delphi`, → guide, → `/for/creators`.
- **CTA:** `/launch`.

## Week 7 — What to write so your AI avatar sounds like you

- **Angle:** the practical piece nobody writes: examples of good and bad "About
  you", "How you talk" and "Topics to avoid" notes. Invented examples only, and
  labelled as examples — never a real person's notes.
- **Outline:** why notes beat uploads for a first version · the four fields, each
  with a weak and a strong example · testing your avatar (talk to it, read what
  it got wrong) · when to update the notes (and that bio, topics and website edits
  go back to review) · FAQ.
- **Internal links:** → guide, → `/how-it-works`, → `/for/founders`, `/for/teachers`.
- **CTA:** `/launch`.

## Week 9 — meAsAgent vs Coachvox

- **Angle:** Coachvox is text-first and built for coaches' lead capture. Same
  template as Delphi/Personify.
- **Before writing:** re-read `coachvox.ai` and its pricing section; Steno's page
  quoting $99/month is Steno's claim, not a source.
- **Internal links:** → other comparisons, → guide.
- **CTA:** `/launch`.

## Week 11 — Can someone make an AI clone of you without permission?

- **Angle:** the question people ask before trusting any of these tools, and the
  one AI answers cite when they add a "consider consent" line. Explain what
  identity-bound launching does and does not prevent (it proves a Google account,
  not a legal identity).
- **Outline:** short answer · how platforms differ (only statements from their
  own pages, sourced) · what meAsAgent does (Google identity, attestation, review
  gates the directory, pause) · what it does not do (no proof beyond Google, a
  link works before review) · what to do if you find an AI of yourself you did
  not make (report to the platform; for meAsAgent the contact address) · FAQ.
- **No legal advice.** Link to regulators' pages only where quoted, and say
  "this is not legal advice".
- **Internal links:** → `/privacy`, `/terms`, `/how-it-works`.
- **CTA:** `/how-it-works`.

## Every piece: the publishing checklist

1. Add the entry to `content/guides.ts` or `content/comparisons.ts`; metaTitle ≤ 60
   with " — meAsAgent", metaDescription ≤ 155.
2. `cd web && bun run build && bun run typecheck && bun run lint`.
3. After deploy: open the page, the Rich Results Test on its URL, and request
   indexing in Search Console (URL Inspection → Request indexing).
4. Add a link to it from one older piece.
5. Share it once where it helps (see `OFF-PAGE.md`), not as a drip campaign.
