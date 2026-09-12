# meAsAgent — End-to-End Build Plan

A personal AI avatar: a chat surface where visitors talk to an agent that
answers as Yash. Written 2026-09-08.

**Named `meAsAgent`.** Deployed at `meAsAgent.vercel.app`; `meAsAgent.com` is the
eventual domain but is not owned yet, so every URL in code and metadata uses the
Vercel domain. The placeholder folder `ai-avatar/` has been renamed `meAsAgent/`.

**Status: Stages 1-3 are built.** Stages 4-6 are still plan only.
Day-to-day conventions live in `CLAUDE.md`; this file stays the staging plan.

---

## 0. The shape of the product

A single chat surface, no landing page. A still portrait and a short bio sit in
a left panel; the conversation fills the rest. There is no video avatar — the
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
| **4** | Google sign-in, per-user threads, consent screen | Google | both | per-user threads |
| **5** | Long-term memory (`relationship`) + return reminders | Google | both | cross-thread |
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

The persona is Yash, and only Yash: name, likeness, bio and portrait all live
in `web/src/lib/persona.ts`. Never borrow another person's identity for it.

---

## 4. Backend API design

Keep their route shapes — they are good, and it makes the frontend a direct
port.

| Route | Stage | Purpose |
|---|---|---|
| `POST /v1/chats` | 1 | send a message, stream the reply |
| `GET  /v1/chats` | 4 | list threads for the signed-in user |
| `GET  /v1/chats/:threadId` | 4 | load one thread |
| `POST /v1/tts` | 2 | synthesize speech for a text span |
| `GET  /v1/stt/token` | 3 | mint an ephemeral STT token |
| `POST /v1/chat/completions` | 3 | OpenAI-compatible endpoint for live voice (see §6.3) |
| `POST /v1/feedback` | 6 | thumbs up/down on a message |
| `GET/POST /v1/consent` | 4 | consent record |
| `GET  /v1/relationship` | 5 | long-term memory document |
| `GET  /v1/reminders/return` | 5 | the "while you were away" follow-up |

**Streaming:** the reply stream should be SSE from `POST /v1/chats`. Note the
original does *not* use `EventSource` — there is no `text/event-stream` in
their bundle, they read a chunked `fetch` body. Do the same: `fetch` +
`ReadableStream` reader, so we can send POST bodies and custom headers.

---

## 5. Data model (MongoDB)

Four collections. Names are deliberately boring.

```
threads         { _id, userId, title, createdAt, updatedAt, lastMessageAt }
messages        { _id, threadId, userId, role, text, audioStatus,
                  createdAt, feedback: { vote, reason, submittedAt } | null }
relationships   { _id: userId, summary, interests[], openThreads[],
                  lastSeenAt, updatedAt }          # Stage 5
returnReminders { _id, userId, threadId, text, generatedAt, deliveredAt }
```

Stage 1 has no `userId`; use a single anonymous device id from `localStorage`
so threads survive a refresh, and migrate those threads onto the real user
at Stage 4. Design that migration in from the start — it is a five-line
`updateMany` if `userId` exists as a field from day one, and a rewrite if not.

Indexes: `threads(userId, lastMessageAt desc)`, `messages(threadId, createdAt)`,
`returnReminders(userId, deliveredAt)`.

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
- **Persona:** Yash. The avatar is of you — so the RAG corpus is your writing,
  READMEs, notes and talk transcripts, and the long-term voice target is an
  ElevenLabs clone of your own voice. This makes §6.1's provider seam
  worth building on day one rather than deferring it, and makes §9 (corpus
  collection) a Stage-1-parallel task, not a Stage 6 task.
- **Repo:** single repo, `web/` + `api/` + `shared/`.

## 11. Resolved (2026-09-08)

1. **Landing page** — none. `/` is the chat surface; the only pre-chat screen
   is the Stage 4 sign-in. A marketing page can be added later at its own route
   without touching the shell.
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
