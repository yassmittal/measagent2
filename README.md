# meAsAgent

AI avatars of real people. Anyone who signs in with Google can launch an avatar
of themselves, and it is listed straight away; visitors browse them and talk to
any of them over text chat, spoken replies, and hold-to-speak voice input.

Deployed at **meAsAgent.vercel.app**.

This file is how you get it running. `CLAUDE.md` is the working guide —
conventions, folder roles, naming. Everything else is in [`docs/`](docs):
the [runbook](docs/RUNBOOK.md), the [roadmap](docs/ROADMAP.md), the
[design decisions](docs/decisions) behind each stage, and the
[search work](docs/seo).

---

## Architecture

```
web/       Next.js 16 + React 19, deployed to Vercel
admin/     Next.js 16 admin portal that unlists avatars, deployed on its own
api/       Fastify 5 on Bun, deployed anywhere that runs Bun
shared/    TypeScript types imported by all three, no build or publish step
scripts/   project-local MongoDB, the dev stack, voice and admin helpers
```

Bun workspaces, one lockfile at the root. The web app's browser calls the API
directly; there is no Next.js route handler in front of it. The admin portal is
the opposite: its own server calls the API, so the admin token never reaches a
browser.

| Page | What it is |
|---|---|
| `/` | the directory: every listed, live avatar |
| `/<handle>` | talk to one avatar |
| `/launch` | launch your own avatar, or edit and pause it |
| `/privacy`, `/terms` | the legal pages |

One turn of conversation:

```
composer → POST /v1/chats  ──►  writes the user message + an empty reply
                                calls Bedrock, streams tokens back as SSE
           SSE events      ◄──  turn_started → delta… → turn_completed
                                the finished reply is persisted
```

The user message and a placeholder reply are written **before** the model is
called, so a dropped connection leaves a recoverable turn instead of a silent
loss.

---

## Prerequisites

| | |
|---|---|
| [Bun](https://bun.sh) | ≥ 1.3 — package manager and the API's runtime |
| MongoDB | `brew install mongodb-community` (the server binary; it is never started as a service) |
| `mongodb-database-tools` | optional, for `mongoexport` |
| An LLM key | `BEDROCK_API_KEY` for Amazon Bedrock's OpenAI-compatible gateway |

---

## Getting started

```bash
bun install                       # once, from the repo root

cp api/.env.example api/.env      # then fill in BEDROCK_API_KEY
cp web/.env.example web/.env.local
cp admin/.env.example admin/.env.local   # only if you run the admin portal

bun run db:start                  # MongoDB on 27018
bun run dev                       # web on :3000, api on :3010
```

Open http://localhost:3000. API docs are at http://localhost:3010/docs.

Without a `BEDROCK_API_KEY` everything still runs — point `BEDROCK_BASE_URL` at
any OpenAI-compatible stub and you can exercise the whole pipeline except the
model itself.

### Commands

| | |
|---|---|
| `bun run dev` | web + api together |
| `bun run dev:web` / `dev:api` | one at a time |
| `bun run dev:admin` | the admin portal on :3020 |
| `bun run admin:hash-password` | print a `MA_ADMIN_PASSWORD_HASH` for `api/.env` |
| `bun run db:start` / `db:stop` / `db:status` / `db:logs` | the local database |
| `bun run typecheck` | every workspace |
| `cd web && bun run lint` | Biome — check only |
| `cd web && bun run lint:fix` | Biome — format and autofix |
| `cd web && bun run build` | production build |

Reset the database completely: `bun run db:stop && rm -rf .mongo`.

---

## Environment

**`api/.env`** — see `api/.env.example` for the full annotated set.

| Variable | Notes |
|---|---|
| `MA_HOST`, `MA_PORT` | defaults `127.0.0.1:3010` |
| `MA_WEB_ORIGIN` | comma-separated CORS allowlist. The browser calls this API directly, so every front-end origin must be listed |
| `MA_DB_CONNECTION_STRING` | `mongodb://127.0.0.1:27018` locally |
| `MA_DB_NAME` | `measagent` |
| `BEDROCK_API_KEY`, `BEDROCK_REGION` | the language model |
| `BEDROCK_BASE_URL` | optional override, for stubs or a different gateway |
| `HF_TOKEN`, `MA_S2S_API_KEY` | voice, from Stage 2 on |
| `MA_SESSION_SECRET` | signs the session tokens the browser carries. `openssl rand -hex 32`. Changing it signs everybody out |
| `MA_GOOGLE_CLIENT_ID` | the OAuth 2.0 Web application client id. Leave it empty and the service runs fine — everyone just stays anonymous |
| `MA_ADMIN_USERNAME`, `MA_ADMIN_PASSWORD_HASH` | the admin portal's one login. The hash, not the password, base64-encoded — paste what `bun run admin:hash-password` prints. Empty means admin sign-in is refused |
| `MA_RESEND_API_KEY`, `MA_EMAIL_FROM` | the owners' weekly summary email, through Resend. **Leave both empty locally**: with either empty no summary is written or sent, and the dev api runs against the real database |
| `MA_RESEND_BASE_URL` | defaults to Resend's API; only set to point tests at a stub that records emails |
| `MA_WEB_BASE_URL`, `MA_API_PUBLIC_URL` | where the web app and this api are reachable, for the links and the one-click unsubscribe header in the email |
| `MA_JOB_INTERVAL_SECONDS`, `MA_MEMORY_QUIET_SECONDS`, `MA_REMINDER_AFTER_SECONDS` | memory timing, defaults 120 / 1200 / 86400: how often the background pass runs, how long a conversation must be quiet before it is remembered, how long a visitor must be away before a reminder is written. Only set to shrink them in tests |

Every variable is read once in `api/plugins/env.ts` and reached through
`fastify.config`. Nothing else touches `process.env`.

**`web/.env.local`**

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | the API origin. Public by design — the browser calls it |
| `NEXT_PUBLIC_SPEECH_TO_SPEECH_URL` | the live voice socket, e.g. `ws://127.0.0.1:8766/v1/realtime` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | same value as `MA_GOOGLE_CLIENT_ID`. Empty means the sign-in panel says so |

**`admin/.env.local`** — server-side only, nothing here is `NEXT_PUBLIC`.

| Variable | Notes |
|---|---|
| `MA_API_BASE_URL` | the API origin the portal's server calls |
| `MA_WEB_BASE_URL` | where avatar pages live, so a reviewer can open one |

---

## Database

`bun run db:start` boots a mongod that belongs to this project alone:
`scripts/mongodb.sh`, data in `.mongo/data` (gitignored), port **27018**. It is
deliberately not `brew services start mongodb-community`, which would run one
shared server on 27017 for the whole machine.

| | |
|---|---|
| Compass URI | `mongodb://127.0.0.1:27018/` |
| Database | `measagent` |
| Collections | `users`, `avatars`, `threads`, `messages`, `relationships`, `returnReminders`, `weeklySummaries` |

Indexes are created on boot by `api/plugins/indexes.ts`. `mongosh` is not
required; Compass covers it, and `mongoexport` is the quick CLI peek:

```bash
mongoexport --uri "mongodb://127.0.0.1:27018/measagent" --collection messages --quiet
```

Every document carries `userId` **from day one** even though there are no
accounts yet — it holds an anonymous `device:<id>` minted by the browser and
kept in `localStorage`, which makes the Stage 4 sign-in migration one
`updateMany` instead of a schema rewrite. It is not a security boundary; it
stops a refresh from losing the thread.

---

## API

Swagger UI at `/docs`, generated from the route schemas — those schemas are the
serializer, not just validation, so they are always current.

| Route | Does |
|---|---|
| `GET /v1/avatars` | the directory: listed, live avatars, newest first |
| `GET /v1/avatars/:handle` | one avatar's public profile, listed or not |
| `GET`/`POST`/`PATCH /v1/me/avatar` | read, launch, or edit and pause your own avatar |
| `POST /v1/chats` | send a message to an avatar; responds with an SSE stream for the turn |
| `GET /v1/chats?avatarId=` | the caller's conversations with one avatar, most recent first |
| `GET /v1/chats/:chatId` | load a thread and its messages |
| `POST /v1/auth/google` | trade a Google credential for a session token |
| `GET /v1/auth/session` | the account behind the session token on the request |
| `GET`/`POST /v1/consent` | read and record acceptance of the terms |
| `POST /v1/voice/sessions` | mint the routing marker for one live voice session |
| `GET /v1/relationships/:avatarId` | what one avatar remembers about the signed-in caller, and their message count |
| `DELETE /v1/relationships/:avatarId` | that avatar forgets the caller |
| `DELETE /v1/relationships` | every avatar forgets the caller |
| `POST /v1/reminders/return` | deliver a waiting return reminder, once |
| `GET /v1/me/avatar/visitors` | the owner's visitors: who, how much, what the avatar remembers, whether they need the owner |
| `GET /v1/me/avatar/visitors/:visitorKey` | one visitor's conversations with the owner's avatar, read-only |
| `GET`/`PATCH /v1/me/weekly-summary` | the owner's weekly email switch and time zone |
| `POST /v1/weekly-summary/unsubscribe?token=` | stop the weekly email without signing in |
| `POST /v1/chat/completions` | the OpenAI-compatible endpoint the voice service calls |
| `POST /v1/admin/sessions` | admin sign-in, rate limited |
| `GET /v1/admin/avatars?listing=` | avatars by listing state, for moderation |
| `PATCH /v1/admin/avatars/:avatarId` | list or decline an avatar |
| `GET /health` | liveness |

Every request says who it is: an `Authorization: Bearer` session token if signed
in, an `x-device-id` header if not. Both may be present and the session wins.
A thread belonging to someone else returns 404, not their data.

`POST /v1/chats` is framed as SSE but is deliberately **not** consumed with
`EventSource` — the browser has to POST a body and send its own headers, so
both ends speak SSE over a plain chunked `fetch`. Event shapes live in
`shared/src/stream.ts`: `turn_started` → `delta`… → `turn_completed`, or
`turn_failed` with a `retryable` flag. When the reply is spoken, `audio_delta`
spans are interleaved with the text and closed by `audio_done`.

---

## Avatars

An avatar is one document per Google account in `avatars`: a handle (its URL,
fixed at launch), a public bio, and three notes only the model reads — about the
person, how they talk, what to avoid. Its **name and photo are not stored on it**:
they are read from the owner's user document, which every sign-in refreshes from
Google, so an avatar can only ever be of the account that launched it.

```
launch ──► live at /<handle> straight away, listing: pending
            │
admin ──────┼──► listed   → appears in the directory at /
            └──► declined → stays reachable by link, not listed
owner edits the bio ──► back to pending
owner pauses ──► page says so; chat and voice refuse
```

Every turn rebuilds the persona prompt from the avatar document
(`api/lib/chat/persona.ts`). A chat request only names an avatar; nothing in it
reaches the prompt. The owner's notes are wrapped in labelled sections and the
api's own rules come last: the avatar says it is an AI when asked, invents no
biography and makes no commitments on the person's behalf.

A thread belongs to a visitor **and** an avatar (`userId` + `avatarId`), so a
browser keeps one continuing conversation per avatar. The person behind an
avatar reads the conversations visitors have with it — the consent card, the
line under the composer and the privacy notice say so — at `/launch/visitors`,
and gets a weekly summary email. See *Owners and the weekly summary* below.

## Memory and return reminders

Each avatar remembers each signed-in visitor who has accepted the terms,
separately: what they said about themselves, what they care about, and what they
left unfinished. Anonymous conversations are never remembered.

```
turn (typed or spoken) ──► relationship: lastSeenAt, memoryDueAt = now + 20 min quiet
                                   │
background pass ───────────────────┤  conversation quiet → the memory writer (a small
(timer in the api, every 2 min,    │  Bedrock model) rewrites the memory from the old
 work claimed by a MongoDB lease)  │  memory + unread messages; messages marked read
                                   │
                                   └─ open threads + away 24h → the avatar writes one
                                      short follow-up, kept for 14 days
next visit ──► POST /v1/reminders/return ──► delivered once, into the latest conversation
next turn  ──► memory goes into the persona prompt inside <visitor_memory>
```

Remembered text was written from what a visitor said, so it is treated as a way
in: the writer is told to keep facts only and drop instructions to the avatar,
the server strips tags and caps lengths, and the prompt frames the section as
information, never instructions, with the closing rules after it.

A visitor sees what an avatar remembers by selecting their relationship level
beside its name, and can make that avatar — or every avatar, from Settings —
forget them. Forgetting keeps the conversations but marks every message read,
so nothing is summarised back in. A failing memory never fails a turn.

## Owners and the weekly summary

`/launch/visitors` lists everyone who has talked to your avatar, most recent
first: signed-in visitors by their Google name and photo, anonymous ones as
"Anonymous visitor 3", with what the avatar remembers and a "Needs you" mark from
the last weekly email. Opening one shows their conversations, read-only. Visitors'
email addresses are never shown. The owner's own conversations are left out, and
so are anonymous conversations from before the notice under the composer existed
and accounts that never accepted the terms — those are only counted.

```
Monday 09:00, owner's zone ──► weeklySummaries doc (one per owner per week, unique index)
background pass (lease)    ──► read the week → one small-model call per visitor, stored as each lands
                           ──► render text + HTML → Resend, idempotency key = doc id → sent
provider down / model fails ──► retried after 15 min, 1 h, 4 h, 12 h, then recorded as failed
```

The model picks a "needs you" reason from a fixed list (wants to reach you,
business enquiry, waiting on you, complaint, safety concern); anything else is
dropped, contact details and links are stripped, and a safety concern is always
described with fixed wording. Owners turn the email off on the visitors page, or
from the email's link, which asks for a button press so mail scanners cannot do
it for them. Nothing runs without `MA_RESEND_API_KEY` and `MA_EMAIL_FROM`.

## The admin portal

`admin/` is a separate Next.js app with one username and password, both from
`api/.env`. Signing in trades them for a 12-hour admin token, which the portal's
server keeps in an httpOnly cookie and uses to call the API — the browser never
holds it. Sign-in is rate limited per address to 5 attempts in 15 minutes. Behind
a proxy, every attempt arrives from the portal's server, so the limit is shared:
a burst of wrong passwords locks the real admin out for the window too.

```bash
bun run admin:hash-password     # paste the printed line into api/.env as-is, then restart the api
bun run dev:admin               # http://localhost:3020
```

## Signing in

Signing in is optional. Anyone can talk to the avatar straight away as an
anonymous `device:<id>`, and signing in with Google **claims that device's
conversations onto the account**. Because the app shows one continuing
conversation per avatar, a device conversation with an avatar the account already
talks to is **merged into** the account's conversation (messages keep their own
times, so it reads in order); otherwise it simply moves over. The thread says so
afterwards rather than moving quietly.

```
browser ──Google credential──► POST /v1/auth/google
                                   │  google-auth-library verifies it
                                   │  upsert the user, claim (merge) the device's threads
                                   ▼
browser ◄──── our own signed session token (30 days) ────┘
        └── every later request: Authorization: Bearer …
```

Three decisions worth knowing:

- **The session is a signed token, not a row.** Which owner is calling is
  answered by a signature, with no database read per message. The trade is that
  sign-out cannot be enforced server-side, so the lifetime is finite;
  `api/plugins/auth.ts` is where a denylist would go if that changes.
- **Bearer header, not a cookie.** The api is on another origin from the web
  app, and cross-site cookies are being removed from browsers.
- **Consent is per account, asked once.** The version accepted is stored as a
  record, but moving `CONSENT_TERMS_VERSION` in `api/shared/constants.ts` does not
  ask anyone again. Memory only exists for accounts that have accepted.

**Setting it up:** create an OAuth 2.0 *Web application* client in the Google
Cloud console, add `http://localhost:3000` (and your deployed origin) to its
authorised JavaScript origins, then put the client id in **both**
`MA_GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, and a random
`MA_SESSION_SECRET` in `api/.env`. With either missing the app still runs and
everybody stays anonymous — the sign-in panel says as much.

---

## Voice input

Holding the mic button talks to the avatar over a **live voice session**. A
standalone speech-to-speech service owns the microphone, voice-activity
detection, transcription and synthesis, and calls this API as its language
model. This API owns the persona, the history and the persistence, so a spoken
turn and a typed turn land in the same thread.

```
browser ──ws (audio)──► speech-to-speech service ──POST /v1/chat/completions──► this API
        ◄──── audio ─── (its own TTS)            ◄──── reply text ────────────
```

Nothing in the incoming `messages` is trusted except the latest transcript: the
real system prompt is rebuilt server-side every time. Routing is the
`ma-route:` marker in `api/lib/voice/route-marker.ts`, smuggled through the
realtime session's `instructions` because the service has no per-session
routing channel of its own. A warm-up request arrives with no marker and must
get a canned completion, never an error, or the service fails to boot.
`MA_S2S_API_KEY` is the bearer token it presents.

Browser-side, `lib/voice/realtime-client.ts` and the worklets in
`public/worklets/` are transport only. The gesture lives in
`hooks/useLiveVoice.ts`: the socket is opened once and thereafter only
`setMicrophoneEnabled` is toggled, because a permission prompt and a handshake
are far too much to pay on every press. **Releasing the button does not cut the
audio** — the microphone stays open for a short tail so the service hears the
silence it uses to detect end-of-turn, and closes early once the avatar starts
speaking.

A spoken turn is persisted by this API on the service's behalf, so the browser
renders the transcripts optimistically and then re-reads the thread.

Note the consequence: **spoken replies are voiced by the speech-to-speech
service's own TTS, not by the Kokoro seam below.** Kokoro speaks typed replies
only. Unifying the two voices is the job of whatever replaces Kokoro.

---

## Spoken replies in typed chat

The avatar speaks by default; the speaker button in the composer mutes it and
the choice is remembered per device. Muting sends `speak: false` with the
message, so nothing is synthesized server-side rather than synthesized and
thrown away.

Audio rides the same stream as the text. As the reply arrives it is split into
sentence-sized spans (`api/lib/speech/sentence-chunker.ts`), each is
synthesized, and each is sent as an `audio_delta` the browser plays in
sequence — Kokoro has no streaming endpoint, so this is how the avatar starts
talking before the reply has finished being written. Markdown is stripped first
(`speakable-text.ts`), because a synthesizer will happily read out asterisks.

The provider sits behind `SpeechSynthesizer` in `api/services/speech/`. Stage 2
is Kokoro-82M through the HuggingFace router, which is nearly free but has fixed
voices and cannot be cloned from a person; replacing it with an ElevenLabs clone is
an edit to `getSpeechSynthesizer()` and nothing else.

**A failing voice never fails a turn.** No `HF_TOKEN`, an unreachable provider, a
depleted quota — all of them emit `voice_unavailable` and the reply arrives as
text exactly as it would have.

---

## Frontend

The stylesheet is split into layers under `web/src/styles/`, imported in order
by `app/globals.css`, and written flat — no nesting, one class per element.
Each component is named after the class it owns (`.composer-row` →
`MessageComposer`, `.thread` → `ConversationThread`), so grepping a class name
finds both the rule and the markup.

The styles cover more UI than is built: message actions, settings, feedback and
auth all have rules waiting. When you build one, render the DOM those rules
already expect instead of writing new CSS.

All streaming state lives in one reducer (`state/conversation-reducer.ts`)
rather than several `useState`s that could disagree about the same turn.

Icons come from `lucide-react`; dates are formatted with `date-fns` in
`lib/format-date.ts`.

---

## Things that will bite you

- **`mongodb` is pinned to v6.** v7 pulls `bson@7`, which calls
  `node:v8 isBuildingSnapshot` and crashes on Bun at import time.
- **`reply.hijack()` skips the hooks that write CORS headers.** `ChatEventStream`
  copies the already-staged headers onto the raw response by hand. Without that
  the stream is blocked in the browser even though a preflight on the same route
  succeeds.
- **Import specifiers in `api/` keep the `.js` extension** (`from './foo.js'` for
  `foo.ts`) — required by `moduleResolution: nodenext`. `web/` is the opposite:
  bundler resolution, extensionless.
- **Never ship the trial fonts.** `ABCDiatype-*-Trial.woff2` are Dinamo trial
  licences and must not enter the repo. Geist Sans is loaded via `next/font`
  with a `size-adjust` local fallback so the metrics stay stable.
- **An avatar is only ever of the person who launched it, or of something they
  run.** Its name and photo come from their Google account. Never hardcode a
  person or seed an avatar on someone's behalf.
- **A new top-level route takes a handle from someone.** Reserve the word in
  `api/lib/avatars/handle.ts` and check nobody holds it first (`CLAUDE.md` § SEO).
- **Runtime values in `shared/` need a subpath.** The index re-exports types only;
  a module with values is imported as `@measagent/shared/avatars`, because the
  bundlers cannot follow the index's `.js` specifiers to `.ts` source.
- **CORS lists methods explicitly** (`api/plugins/cors.ts`). A route with a new
  method is refused at the browser's preflight until it is added there; `curl`
  never sends a preflight, so it will not catch this.
- **The background passes run in every api, including the dev one on the real
  database.** Keep `MA_RESEND_API_KEY` empty there, or it will email real owners.
- **`OWNER_NOTICE_SHOWN_SINCE` is a deploy fact.** Anonymous conversations started
  before it are never shown to owners. It must not be earlier than the web deploy
  that put the notice under the composer.
- **Do not run git commands here.** Leave changes in the working tree; Yash
  handles version control.

---

## Deploying

**`web/` → Vercel.** Because this is a Bun workspace the Vercel project needs
Root Directory `web` with *Include source files outside of the Root Directory*
enabled, so `bun install` runs against the repo root and `@measagent/shared`
resolves. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed API origin.

**`admin/` → its own Vercel project**, Root Directory `admin`, same *Include
source files* setting. Set `MA_API_BASE_URL` and `MA_WEB_BASE_URL`. Its server
calls the API, so its origin does not go in `MA_WEB_ORIGIN`.

**`api/` → anywhere that runs Bun** (Fly, Railway, EC2). Not Vercel:
`POST /v1/chats` holds an open stream for the length of a turn, and Stage 3 adds
a long-lived voice gateway. Whatever origin it lands on must be listed in
`MA_WEB_ORIGIN`.

---

## Where this is going

| Stage | Delivers | Auth | Voice |
|---|---|---|---|
| **1** ✅ | chat shell + text chat | none | none |
| **2** ✅ | voice out — the avatar speaks | none | TTS |
| **3** ✅ | voice in — hold-to-speak dictation | none | STT + TTS |
| **4** ✅ | Google sign-in, per-user threads, consent | Google | both |
| **5** ✅ | long-term memory and return reminders | Google | both |
| **OV** ✅ | owners read their visitors; weekly summary email | Google | both |
| **6** | RAG over each avatar owner's corpus, web search, feedback | Google | both |

`docs/ROADMAP.md` has the detail for each, including what Stage 1 deliberately left out.
