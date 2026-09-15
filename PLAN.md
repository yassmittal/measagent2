# meAsAgent — End-to-End Build Plan

AI avatars of real people: anyone signed in launches an avatar of themselves,
and visitors talk to it. Written 2026-09-08 as a personal avatar of Yash; made
multi-person on 2026-09-14 (§15, and `MULTI-PERSON.md` for the reasoning).

**Named `meAsAgent`.** Deployed at `meAsAgent.vercel.app`; `meAsAgent.com` is the
eventual domain but is not owned yet, so every URL in code and metadata uses the
Vercel domain. The placeholder folder `ai-avatar/` has been renamed `meAsAgent/`.

**Status: Stages 1-5 are built, and the product is multi-person (§15).** Stage
6 is still plan only. Stage 2.5 was
investigated and dropped — `STAGE-2.5.md` says why.
Day-to-day conventions live in `CLAUDE.md`; this file stays the staging plan.

---

## 0. The shape of the product

A directory of avatars at `/`, and one chat surface per avatar at `/<handle>`. A
still portrait and a short bio sit in a left panel; the conversation fills the
rest. There is no video avatar — the
"avatar" is the portrait plus a voice.

Three decisions set the architecture, and everything else follows from them:

1. **Audio never round-trips through our server.** The browser holds the
   transcription socket itself and the api only mints a short-lived token. This
   is the single biggest latency win available in a product like this.
2. **Speech is streamed, not batched.** Reply audio is synthesised sentence by
   sentence and interleaved into the turn's own event stream, so the avatar
   starts speaking before the answer has finished generating.
3. **Memory is the actual product; voice is table stakes.** Per-user memory
   (`relationship`) plus a background job that prepares a follow-up before the
   visitor returns (`returnReminders`) is the differentiator — "remembers your
   story, keeps thinking between your conversations."

---

## 1. Stage plan

Each stage is shippable on its own. Stage 1 is the full chat shell with no
auth, as requested.

| Stage | Delivers | Auth | Voice | Memory |
|---|---|---|---|---|
| **1** ✅ | Chat shell + working text chat against a local persona | none | none | in-thread only |
| **2** ✅ | Voice out (avatar speaks) | none | TTS | in-thread |
| **3** ✅ | Voice in (hold-to-speak dictation) | none | STT + TTS | in-thread |
| **4** ✅ | Google sign-in, per-user threads, consent screen | Google | both | per-user threads |
| **5** ✅ | Long-term memory (`relationship`) + return reminders | Google | both | cross-thread |
| **6** | RAG over your own corpus, Tavily search, feedback/analytics | Google | both | full |

Stage 1's layout was settled before Stage 2 began, on purpose: retrofitting
layout under a working voice pipeline is much harder than the reverse.

---

## 2. Stack

Decided 2026-09-08. Reasons kept for the record.

**Frontend: Next.js 16 + React 19 + TypeScript.** *(built)*
The original is a Vite SPA, but every other project in this workspace is
Next.js, and Stages 4-6 want a real landing page, OG images and OAuth
callbacks. The chat surface itself will be almost entirely client components,
so we get the Vite experience anyway. Deploy on Vercel.

**Backend: Fastify 5 + Bun + TypeScript**, as its own service. *(built)*
Mirrors `sui-sentinal/backend-service/api` so the two codebases feel the same.
Reuse that repo's exact folder convention (see §7).

**Database: MongoDB.** *(decided)* Chosen over Supabase here. Threads, messages and
the memory document are document-shaped with variable structure; `@fastify/mongodb`
is already a proven dependency in sui-sentinal; and if we ever put LangGraph
in the loop, `@langchain/langgraph-checkpoint-mongodb` is already in use there.
Postgres would only win if we needed pgvector — and for Stage 6 RAG,
sui-sentinal already uses Pinecone, so that path is covered too.

**Single repo** *(decided)* — shared TypeScript types between `web/` and `api/`
with no publishing step, since the message shapes are most of the coupling:

```
meAsAgent/
  web/                # Next.js frontend
  api/                # Fastify backend
  shared/             # types shared by web + api (message shapes, DTOs)
```

---

## 3. The design system

The stylesheet is the spine of the frontend, and it is deliberately larger than
the markup: layers exist for UI that later stages will build, so a new feature
renders into rules that are already written rather than inventing new ones.

### 3.1 Layers

Split under `web/src/styles/` and imported in order by `app/globals.css`. Order
is load-bearing — tokens define the variables every later layer reads:

```
web/src/styles/
  tokens.css      # :root custom properties — colour, spacing, easing, radii
  base.css        # reset, typography, layout primitives
  thread.css      # .thread, .msg-*, .date-divider
  journey.css     # .journey-*, .live-progress, .live-turn-stop
  composer.css    # .composer-row, .composer-input, .composer-send, .composer-voice
  avatar.css      # .avatar-panel, .avatar-panel-bio, .avatar-panel-name
  voice.css       # .ptt-bar, .wave
  settings.css    # .settings-*, .profile-*
  feedback.css    # .feedback-*, .msg-actions
  ...
```

### 3.2 One class, one component

Rules are written flat — no nesting, one class per element — and every
component is named after the class it owns: `.thread` → `ConversationThread`,
`.composer-row` → `MessageComposer`, `.ptt-bar` → `PushToTalkBar`. So a class
name is a two-way index: grep it and you find the rule and the markup that
uses it.

Build order, roughly by weight of the class families present:

`thread` / `msg` → `composer` → `avatar` panel → `ptt` / `live` →
`feedback` → `settings` / `profile` → `journey` → `relationship` →
`consent` → `auth` → `legal`

### 3.3 Fonts

`ABCDiatype-*-Trial.woff2` are **Dinamo trial licences**, which do not permit
deployment — they must never enter the repo. Geist Sans is loaded via
`next/font` with a `size-adjust` tuned local fallback, so swapping the face
does not shift the metrics the layout was tuned against:

```css
@font-face { font-family:"Diatype Fallback"; src:local("Helvetica Neue"); size-adjust:97%; }
```

Nothing in the CSS pulls an external asset — no images, no icon font. Icons are
`lucide-react`, sized at the call site.

### 3.4 The persona

*Superseded 2026-09-14.* This section said the persona was Yash and only Yash.
The rule that replaced it: **an avatar is only ever of the person who launched
it.** Its name and portrait come from the owner's Google account, what it knows
comes from what they wrote, and all of it lives in MongoDB (§15).

---

## 4. Backend API design

Keep their route shapes — they are good, and it makes the frontend a direct
port.

| Route | Stage | Purpose |
|---|---|---|
| `POST /v1/chats` | 1 | send a message, stream the reply |
| `GET  /v1/chats` | 4 | list threads for the caller |
| `GET  /v1/chats/:threadId` | 4 | load one thread |
| `POST /v1/tts` | 2 | synthesize speech for a text span |
| `GET  /v1/stt/token` | 3 | mint an ephemeral STT token |
| `POST /v1/chat/completions` | 3 | OpenAI-compatible endpoint for live voice (see §6.3) |
| `POST /v1/auth/google` | 4 | trade a Google credential for a session |
| `GET  /v1/auth/session` | 4 | the account behind a session token |
| `POST /v1/voice/sessions` | 4 | mint a live-voice routing marker |
| `POST /v1/feedback` | 6 | thumbs up/down on a message |
| `GET/POST /v1/consent` | 4 | consent record |
| `GET  /v1/avatars` | MP | the directory: reviewed, live avatars |
| `GET  /v1/avatars/:handle` | MP | one avatar's public profile |
| `GET/POST/PATCH /v1/me/avatar` | MP | launch, read, edit or pause your own avatar |
| `POST /v1/admin/sessions` | MP | admin portal sign-in |
| `GET  /v1/admin/avatars` | MP | the review queue, by listing |
| `PATCH /v1/admin/avatars/:avatarId` | MP | list or decline an avatar |
| `GET  /v1/relationships/:avatarId` | 5 | what one avatar remembers about the caller, and their message count |
| `DELETE /v1/relationships/:avatarId` | 5 | that avatar forgets the caller |
| `DELETE /v1/relationships` | 5 | every avatar forgets the caller |
| `POST /v1/reminders/return` | 5 | deliver the "while you were away" follow-up, once — a POST because reading it spends it |
| `GET  /v1/me/avatar/visitors` | OV | the owner's visitors |
| `GET  /v1/me/avatar/visitors/:visitorKey` | OV | one visitor's conversations, read-only |
| `GET/PATCH /v1/me/weekly-summary` | OV | the owner's weekly email switch and time zone |
| `POST /v1/weekly-summary/unsubscribe` | OV | stop the weekly email with the link's token |

**Streaming:** the reply stream should be SSE from `POST /v1/chats`. Note the
original does *not* use `EventSource` — there is no `text/event-stream` in
their bundle, they read a chunked `fetch` body. Do the same: `fetch` +
`ReadableStream` reader, so we can send POST bodies and custom headers.

---

## 5. Data model (MongoDB)

Seven collections. Names are deliberately boring.

```
users           { _id: ownerId, googleSubject, email, name, pictureUrl,
                  createdAt, lastSignedInAt,
                  consent: { acceptedAt, termsVersion } | null,    # Stage 4
                  memoryBudget: { day, used },                     # Stage 5
                  weeklySummary: { isEnabled, timeZone } }         # OV — absent means on, UTC
avatars         { _id, ownerId, handle, bio, aboutMe, speakingStyle, avoidTopics,
                  availability: live|paused, listing: pending|listed|declined,
                  listingReviewedAt, ownerAttestedAt, createdAt, updatedAt }  # MP
threads         { _id, userId, avatarId, title, createdAt, updatedAt, lastMessageAt }
messages        { _id, threadId, userId, role, text, status, turnId,
                  origin: turn|return_reminder, createdAt,
                  feedback: { vote, reason, submittedAt } | null,
                  memorizedAt | null }                             # Stage 5
relationships   { _id, userId, avatarId, summary, interests[], openThreads[],
                  lastSeenAt, memoryDueAt, reminderDueAt, leaseUntil,
                  createdAt, updatedAt }           # Stage 5 — per person *per avatar*
returnReminders { _id, userId, avatarId, threadId, text, generatedAt,
                  expiresAt, deliveredAt }         # Stage 5
weeklySummaries { _id, ownerId, avatarId, weekKey, periodStart, periodEnd,
                  status: summarizing|sending|sent|skipped|failed,
                  visitors[] | null, totals, attentionFlags[],
                  attempts, nextAttemptAt, leaseUntil, lastError,
                  sentAt, createdAt, updatedAt }   # OV — one per owner per week
```

Stage 1 has no `userId`; use a single anonymous device id from `localStorage`
so threads survive a refresh, and migrate those threads onto the real user
at Stage 4. Design that migration in from the start — it is a five-line
`updateMany` if `userId` exists as a field from day one, and a rewrite if not.
*(Stage 4 built it: `lib/chat/thread-ownership.ts`, and it is exactly that.)*

An owner id carries its kind as a prefix — `device:<id>` or `google:<subject>` —
and a signed-in user's `_id` **is** that owner id, so the value on a thread is
also the key of the `users` collection and no lookup translates between them.

Indexes: `threads(userId, avatarId, lastMessageAt desc)`,
`messages(threadId, createdAt)`, `avatars(ownerId)` and `avatars(handle)` (both
unique), and at Stage 5 `relationships(userId, avatarId)` (unique),
`relationships(memoryDueAt)`, `relationships(reminderDueAt)`,
`returnReminders(userId, avatarId)` unique where `deliveredAt` is null (one pending
reminder per pair), and `returnReminders(userId, deliveredAt)`. The owner view
adds `threads(avatarId, lastMessageAt desc)`, `weeklySummaries(ownerId, weekKey)`
(unique), `weeklySummaries(status, nextAttemptAt)` and
`weeklySummaries(avatarId, sentAt desc)`.

---

## 6. Voice — reusing what already works in sui-sentinal

`sui-sentinal/backend-service/api` already contains a complete, working voice
stack. Three pieces of it are directly reusable.

### 6.1 TTS — reuse the pattern, swap the provider later
`api/services/tts.ts` there calls HuggingFace Inference with
**Kokoro-82M** via fal-ai, returning a `Buffer` + content type; `api/routes/tts/`
wraps it in a Fastify route with a JSON schema and a length cap. Copy both
almost verbatim for Stage 2 — it works and it is nearly free.

The catch: **Kokoro cannot clone your voice.** It has fixed voices. For an
avatar of yourself you will eventually want ElevenLabs (instant voice clone
from ~2 minutes of your audio, professional clone from ~30 minutes).

So define the seam now:

```ts
export interface SpeechSynthesizer {
  synthesizeSpeech(text: string): Promise<SynthesizedSpeech>;
  streamSpeech?(text: string): AsyncIterable<Uint8Array>;
}
```

with `KokoroSpeechSynthesizer` and, later, `ElevenLabsSpeechSynthesizer`.
Chosen by env var. Stage 2 ships Kokoro; the swap is then a one-line change.

Note the existing route returns a complete buffer. To match the original's
feel we want the streaming variant (`streamSpeech`) feeding MediaSource in the
browser. Kokoro-via-HF has no streaming endpoint, so Stage 2 accepts
play-after-generate and Stage 2.5 adds streaming with ElevenLabs.

### 6.2 STT — built, then removed (2026-09-12)
The original design was browser-held dictation: `POST /v1/transcription/sessions`
mints a short-lived AssemblyAI url, the browser opens the socket itself, and mic
audio goes through an `AudioWorklet` resampling to 16kHz PCM16.

It was built and then **deleted**, because §6.3's live mode answered the same
question and shipped instead. Two speech-to-text designs were sitting in the
repo, only one of them reachable. If the s2s service ever proves too expensive
to host, this is the lighter path to rebuild — it is ~200 lines and the
token-minting shape is standard. The rule it was built around still stands:
**never proxy audio through Fastify.**

### 6.3 Live (speech-to-speech) mode — reuse the gateway pattern
This is the genuinely clever bit in sui-sentinal and worth copying wholesale.
A standalone s2s service owns VAD/STT/TTS and the realtime protocol, and calls
back into Fastify at `POST /v1/chat/completions` — an **OpenAI-compatible
endpoint** — as its LLM backend. Fastify owns the system prompt, RAG, tools and
persistence; the s2s service owns the audio. `100ms` (`api/shared/hms.ts`)
provides the WebRTC room and short-lived JWTs.

Two details to carry over:
- The `ss-route:` marker trick in `api/lib/voice/route-marker.ts` — per-session
  routing smuggled through the realtime `instructions` field, since s2s has no
  per-session routing channel. Our equivalent marker carries `{ threadId, userId }`.
- Incoming history and system messages are **not trusted**; only the last user
  message and the marker are read, and the real system prompt is rebuilt
  server-side. Keep that rule.

Warm-up requests arrive with no marker and must return a canned completion,
never an error, or the s2s service fails to boot.

---

## 7. Code conventions

Explicitly requested, and the thing most likely to decide whether this scales.

### Folder convention (copied from sui-sentinal's api)
```
api/
  routes/<resource>/index.ts     # thin: schema + delegate. No business logic.
  routes/<resource>/schemas.ts   # JSON schemas, frozen, exported constants
  handlers/<resource>/*.ts       # request orchestration
  lib/<domain>/*.ts              # pure domain logic, no Fastify types
  services/*.ts                  # external I/O (TTS provider, STT tokens, LLM)
  shared/*.ts                    # cross-cutting helpers
  plugins/*.ts                   # env, mongo, cors, rate-limit
```
A file in `lib/` must never import `fastify`. That single rule keeps the domain
testable and is already how sui-sentinal is structured.

### Naming
- Functions are **verb phrases that say what they do**:
  `synthesizeSpeech`, `mintSpeechToTextToken`, `buildPersonaSystemPrompt`,
  `summarizeThreadIntoRelationship`. Not `getTts`, `doAudio`, `handleData`.
- Booleans read as assertions: `isTextToSpeechConfigured`, `hasPendingReply`,
  `shouldAutoPlayReply`.
- React components are nouns naming what is on screen, matching the CSS class
  they own: `.thread` → `ConversationThread`, `.composer-row` → `MessageComposer`,
  `.ptt-bar` → `PushToTalkBar`, `.avatar-panel` → `AvatarPanel`.
- Hooks say what they give you: `useSpeechPlayback`, `useMicrophoneStream`,
  `useThreadMessages`. Not `useAudio`, `useChat2`.
- No abbreviations that aren't domain-standard. `stt`/`tts` are fine (they are
  the domain terms and already used in sui-sentinal); `msg`, `usr`, `cfg`,
  `res2`, `tmp` are not.
- Types describe the shape, not the position: `StoredMessage`, `OutgoingReply`,
  `SynthesizedSpeech`, `RelationshipSummary`.

### React/Next specifics
- Client components only where interactivity demands it; keep the shell server-rendered.
- One concern per hook. The composer should not know how audio is decoded.
- No `useEffect` for derived state — derive during render.
- Streaming state lives in one reducer, not five `useState`s that can disagree.
- Colocate a component with anything only it uses; the global stylesheet stays
  in `styles/`, since a class name is the index that ties a rule to its markup.

### Fastify specifics
- Every route gets a JSON schema. Response schemas too — they are the serializer.
- No business logic inside a route handler closure.
- Errors via `@fastify/sensible` (`reply.badRequest(...)`), never bare `throw new Error`.
- Env validated once in `plugins/env.ts` with a schema; no scattered `process.env`
  reads outside `services/`.

### Comments
Comment the *why*, never the *what*. The best examples of the standard are
already in sui-sentinal — see the header of `lib/voice/route-marker.ts` and
`shared/hms.ts` (`"never accept a static token from the environment, those are
dashboard-issued and expire in ~2 weeks"`). That density and that tone.

---

## 8. Accounts and cost

| Service | Stage | Notes |
|---|---|---|
| LLM provider | 1 | whichever you already pay for |
| MongoDB Atlas | 1 | free tier is enough for a long time |
| Vercel | 1 | frontend |
| Fly/Railway/EC2 | 1 | Fastify service |
| HuggingFace | 2 | `HF_TOKEN`, Kokoro TTS — you already have this working |
| ElevenLabs | 2.5 | voice cloning; paid tier required for cloning |
| 100ms | 3 | only if we do live s2s mode |
| Tavily | 6 | web search tool, free tier exists |
| PostHog + Sentry | 6 | both have usable free tiers |

Check current pricing before committing — these change.

---

## 9. The part that is not code

Stage 6 is where this becomes *your* avatar rather than a chatbot with your
name on it. It needs a corpus: your writing, project READMEs, notes, and
transcripts of you actually talking. Codifying how you really converse is the
hard part of a project like this — not the voice, not the UI. Budget
accordingly.

Start collecting the corpus during Stage 1. It has the longest lead time and
no code dependency.

---

## 10. Decisions taken

- **Frontend:** Next.js 16 + React 19.
- **Persona:** *superseded 2026-09-14.* This was "Yash — the avatar is of you".
  It is now whoever launched the avatar (§15), so Stage 6's corpus and any future
  voice clone are per avatar rather than one person's. Stage 2.5's voice cloning
  was dropped (`STAGE-2.5.md`); every avatar shares the one voice.
- **Repo:** single repo, `web/` + `api/` + `shared/`.

## 11. Resolved (2026-09-08)

1. **Landing page** — none, at the time. `/` was the chat surface. *Since
   2026-09-14 `/` is the avatar directory and the chat is `/<handle>`* (§15).
2. **LLM provider** — **Amazon Bedrock**, through its OpenAI-compatible gateway
   at `https://bedrock-mantle.us-east-1.api.aws/v1` with `BEDROCK_API_KEY`, via
   `ChatOpenAI` from `@langchain/openai`. Identical to how
   `sui-sentinal/backend-service/api/lib/attack/model-provider.ts` reaches it,
   and the model list in `api/shared/constants.ts` mirrors that repo's
   `BEDROCK_MODELS`. Default model: `zai.glm-5`. The base URL is overridable by
   env so the service can be pointed at any OpenAI-compatible endpoint (a local
   stub in tests, a different gateway) without a code change.
3. **Voice timing** — mirror `sui-sentinal/backend-service` exactly. Stage 2
   ships Kokoro-82M through the HuggingFace router (`HF_TOKEN`, `fal-ai`
   provider) behind the `SpeechSynthesizer` seam; Stage 2.5 swaps in an
   ElevenLabs clone with MediaSource streaming. Stage 3's live mode reuses that
   repo's gateway pattern wholesale: 100ms for the room, `POST /v1/chat/completions`
   as the s2s service's LLM backend, and the `ss-route:` marker trick.

---

## 12. What Stage 1 actually shipped

**Frontend** — `/` renders the shell: `.shell` → `.mobile-header` +
`.chat-canvas` → `.avatar-panel` + `.thread-pane`, with the stylesheet split
into layers under `web/src/styles/`. Working pieces: date dividers, user and reply bubbles, the live
turn with its rotating shimmer phrase, the auto-growing composer with
Enter-to-send and IME handling, the scroll-to-bottom pill, and the mobile
breakpoint. The push-to-talk bar renders disabled — it is part of the composer's
measured height, so shipping it later would move the thread under the user.

**Backend** — `POST /v1/chats` (send + SSE stream), `GET /v1/chats/:chatId`,
`GET /health`, Swagger at `/docs`. Threads and messages persist in MongoDB under
an anonymous `device:<id>` owner. The user message and an empty `resolving`
reply are both written *before* the model is called, so a dropped connection
leaves a recoverable turn rather than a silent loss.

**Verified end to end** against a local MongoDB and a stubbed OpenAI-compatible
model: send, stream, persist, reload, multi-turn history, and cross-device
isolation (another device id gets a 404, not someone else's thread). The real
Bedrock gateway was reached and returned 401 for a deliberately fake key, which
confirms the base URL and auth shape.

**Not built, and deliberately so:** reply-to, feedback/downvote, the tool-call
journey trace, settings, profile, consent, auth, legal pages, the v1 migration
flow. Their CSS is lifted and in place; the components belong to Stages 4-6.

**Two things to know before touching the backend.** `mongodb` is pinned to v6 —
v7 pulls `bson@7`, which calls `node:v8 isBuildingSnapshot` and crashes on Bun at
import time. And `reply.hijack()` skips the Fastify hooks that write CORS
headers, so `ChatEventStream` copies the already-staged headers onto the raw
response by hand; without that the stream is blocked in the browser even though
a preflight on the same route succeeds.

---

## 13. What Stage 2 actually shipped

**The wire.** Audio rides the turn's own SSE stream: `audio_delta` spans
carrying base64 + a MIME type + a sequence number, closed by `audio_done`, with
`voice_unavailable` as the downgrade. This replaced an earlier sketch that had a
separate synthesize endpoint, which would have meant a second round trip and no
way to start speaking mid-reply.

**Chunking instead of streaming.** Kokoro-through-HuggingFace returns a whole
file, so `lib/speech/sentence-chunker.ts` splits the reply at sentence
boundaries (120-480 characters) and each span is synthesized and sent on its
own. Spans are chained, never parallel: they are played in order, and a later
span finishing first would either scramble the speech or force the client to
buffer the whole reply. `speakable-text.ts` strips markdown first — code fences
are dropped outright, since nobody wants a synthesizer reading out braces.

**Muting is server-side.** The composer's speaker button sends `speak: false`
with the message rather than discarding audio in the browser, so a muted visitor
costs nothing to serve. The preference is remembered per device.

**Replay.** `POST /v1/chats/:chatId/turns/:turnId/tts` re-synthesizes a stored
reply as one complete file, which is what anything scrolled back to or reloaded
needs. Same ownership check as the rest: another device gets a 404.

**Verified end to end** against the running API: the full turn streams and
persists, an unknown turn is 404, another device's turn is 404, a missing device
header is 400, and a synthesis failure emits `voice_unavailable` while the reply
still arrives in full. The chunker, markdown stripping and span ordering were
exercised against a stub synthesizer.

**Blocked on account, not code:** the shared `HF_TOKEN` has *depleted its
monthly included credits*, so no real audio has been heard yet. Three ways out —
top up HuggingFace, run Kokoro locally on the Mac (`kokoro-onnx`/MLX, free), or
bring Stage 2.5 forward and go straight to ElevenLabs, which is the eventual
voice anyway. The `SpeechSynthesizer` seam makes any of them a small change.

**Not built, deliberately:** streaming synthesis into MediaSource (needs a
provider that streams — that is Stage 2.5), a replay button in the message row,
and any speaking-state indicator. `.wave` is a *listening* indicator and belongs
to Stage 3's hold-to-speak, so it was left alone rather than repurposed.

---

## 14. What Stage 4 actually shipped

**Sign-in is an offer, not a gate.** Anyone can still chat anonymously as a
`device:<id>`; signing in with Google claims that device's conversations onto
the account with the `updateMany` §5 was designed around, and says so on screen.
The alternative — §11's sign-in wall — would have made the claim path dead code
and stopped anyone trying the product without a Google account.

**Google Identity Services in the browser, our own session token after that.**
The browser gets a Google credential, posts it once to `POST /v1/auth/google`,
and carries a token this service signed from then on. `google-auth-library`
verifies the credential rather than hand-decoding it: signature, issuer,
audience, expiry and clock skew are each a way in if skipped. The token is a
JWT, not a sessions collection — a signature answers "which owner is calling"
without a database read per message. The cost is that sign-out cannot be
enforced server-side, which is why the lifetime is 30 days rather than forever;
`plugins/auth.ts` is where a denylist would go.

**`Authorization: Bearer`, not a cookie.** The api is on a different origin from
the web app, and a cross-site cookie is exactly what browsers are removing.

**The live voice marker is now a signed token.** `lib/voice/route-marker.ts`
used to carry `{ threadId, userId }` in the clear, assembled by the browser —
which meant the browser named its own owner id. Stage 4 makes that a real
boundary: `POST /v1/voice/sessions` proves ownership once and returns a signed
marker, and `POST /v1/chat/completions` verifies it. A hand-written marker is
now a 401. This had to change anyway: the old marker hardcoded `device:<id>`, so
every spoken turn would have broken the moment someone signed in.

**Consent is per account, with the version stored.** An acceptance of superseded
wording reads as no acceptance, so bumping `CONSENT_TERMS_VERSION` re-asks
everyone. It is not enforced server-side — nothing yet does anything with what
consent covers, and refusing to answer a signed-in person would be theatre.

**Verified end to end** against the running api and the real database: 23 checks
covering anonymous chat unchanged, cross-device isolation, 401s on the
signed-out surface, a forged bearer token, claiming, ownership after claiming
(the device alone gets 404), another account getting 404, consent recording and
reading back, voice markers for owner and stranger, an unmarked warmup still
answering, and a hand-written marker refused. Then in the browser: the sign-in
panel, the consent card, the profile menu, settings, and sign-out returning the
app to anonymous.

**Not verified:** a real Google credential, because that needs a client id from
the Google Cloud console. Everything up to Google's own check is exercised — a
credential it did not issue is refused with a 401 and a logged warning.

**Not built, deliberately:** a conversation list (there is no CSS for one, and
the product is one continuing conversation per person), a self-service delete,
and account deletion. The privacy notice says deletion is by email, and calls
that a gap rather than dressing it up.

---

## 15. What the multi-person change shipped

Built 2026-09-14. `MULTI-PERSON.md` has every decision and what was rejected.

**Anyone signed in can launch one avatar of themselves.** `/launch` takes a
handle, a public bio and three notes only the model reads (about me, how I talk,
topics to avoid). The name and photo are the owner's Google profile and cannot
be typed in, which is what makes "only an avatar of yourself" enforceable.
Launching needs the current terms accepted and a stored attestation.

**The persona is data.** `lib/chat/persona.ts` builds the prompt from the avatar
document on every turn — owner text wrapped in labelled sections, api-owned rules
last (it says it is an AI when asked, invents no biography, makes no commitments).
A chat request names an avatar and nothing more.

**Review gates the directory, not the link.** An avatar is live at `/<handle>`
from launch; `/` lists only avatars an admin approved. Changing the bio sends an
avatar back to review. Owners can pause; there is no self-service delete. Owners
cannot read visitors' conversations.

**`admin/` is a separate Next.js app** with one username and password from env.
Its server holds the admin token in an httpOnly cookie and calls the api; the
browser never sees the token.

**Tokens carry a purpose.** Session, voice and admin tokens share a secret, and
before this a voice marker was accepted as a sign-in.

**Verified** against the running api, a stub model that recorded every system
prompt, and the local database: 34 launch/edit checks, 43 per-avatar chat, voice
and claiming checks, 26 admin checks and the rate limit, plus a browser pass
through the directory, an avatar chat against the real model, the paused page,
the launch and edit page, and the admin portal. The 10 pre-avatar conversations
were left in place but are no longer reachable: they have no `avatarId`.
*(Deleted at Stage 5.)*

*Superseded at Stage 5:* "owners cannot read visitors' conversations" is no
longer the promise. The person behind an avatar is meant to read them (§16).

---

## 16. What Stage 5 actually shipped

Built 2026-09-15. `STAGE-5.md` has every decision and what was rejected.

**Memory per visitor per avatar, for signed-in visitors who accepted the terms.**
Anonymous conversations are never remembered. After a conversation has been
quiet for 20 minutes, a background pass asks a small Bedrock model
(`mistral.ministral-3-14b-instruct`) to rewrite that pair's memory — a summary,
up to 10 interests, up to 5 open threads — from the old memory plus the unread
messages. Messages carry `memorizedAt`, which is what makes claiming a merge and
forgetting final.

**Memory in the prompt is data.** It sits inside `<visitor_memory>`, framed as
things the visitor said, with tags stripped and the closing rules after it and
naming it. The writer is told to drop instructions to the avatar, credentials and
other people's contact details.

**Return reminders are in-app.** A visitor who left something unfinished and has
been away a day gets one follow-up written in the avatar's voice, delivered once
into their latest conversation the next time they open that avatar.

**Background work is a timer in the api**, with work claimed by a lease in
MongoDB, so any number of instances can run it. No new dependency.

**Visitors see and control it.** The relationship level (messages sent: levels at
10/25/50/100/200) opens what the avatar remembers, with a forget button; Settings
forgets everything.

**Consent is asked once**, and now says the person behind an avatar reads the
conversations with it.

**Verified** against two api instances on one test database and a stub model that
recorded every prompt: 54 memory checks (write and read, isolation between visitors
and avatars, the lease, prompt injection, failing and garbage writers, the budget,
claiming, typed/spoken parity), 26 relationship and forgetting checks, 46 reminder
checks (scheduling, isolation, delivered exactly once under a race, expiry, paused
avatars, forgetting, failures), and a browser pass. Four real Bedrock calls chose
the writer model.

---

## 17. What the owner view and weekly summary shipped

Built 2026-09-15. `OWNER-VIEW.md` has every decision and what was rejected.

**Owners read their visitors.** `/launch/visitors` lists everyone who talked to
the avatar, with what it remembers about them; one visitor's page shows their
conversations read-only. Signed-in visitors appear by Google name and photo,
anonymous ones by number, never by email. The rule for whose conversations an
owner may read lives once, in `findAvatarVisitors`: not the owner's own, signed-in
visitors who accepted the terms, anonymous visitors only after the notice under
the composer shipped (`OWNER_NOTICE_SHOWN_SINCE`). Owners must have accepted the
terms themselves.

**A weekly summary email**, Monday 09:00 in the owner's time zone, through Resend
called with `fetch`. One small-model call per visitor writes a line or two and an
optional "needs you" reason from a fixed list; the code strips contact details and
never lets the model describe a safety concern. One document per owner per week,
a lease, retries that never repeat finished work, and the document id as the
provider's idempotency key. Owners turn it off on the page or from a signed link.

**Wording changed:** a line under the composer for everyone, the privacy notice
(anonymous conversations are read too, the email, Resend as a processor, the
operator promise) and a line in the terms on how owners may use what they read.

**Verified** against two api instances on one test database, a stub model and a
stub mail server that recorded everything: 45 owner-view checks, 25 unit checks
(weeks across daylight saving, parsing, the email), 65 weekly-summary checks
(once per owner per week across instances and a restart, provider down and back,
refusals, retries running out, a failing model, injection, isolation between
owners, unsubscribing), four real Bedrock calls, and a browser pass.
