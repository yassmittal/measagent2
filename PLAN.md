# meAsAgent — End-to-End Build Plan

A replica of **avatar.andrewng.org** ("AI Andrew"), rebuilt as a personal AI
avatar. Written 2026-09-08.

**Named `meAsAgent`.** Deployed at `meAsAgent.vercel.app`; `meAsAgent.com` is the
eventual domain but is not owned yet, so every URL in code and metadata uses the
Vercel domain. The placeholder folder `ai-avatar/` has been renamed `meAsAgent/`.

**Status: Stage 1 is built** (2026-09-08). Stages 2-6 are still plan only.
Day-to-day conventions live in `CLAUDE.md`; this file stays the staging plan.

---

## 0. What we are actually cloning (verified, not guessed)

The live site was inspected directly: the HTML, the JS bundle
(`/assets/index-Bfd73B-M.js`, 690 KB) and the stylesheet
(`/assets/index-Bm80L3u1.css`, 41 KB). All three are saved in `reference/`.

There are two generations of the product:

| | v1 (`v1.avatar.andrewng.org`) | v2 (`avatar.andrewng.org`, current) |
|---|---|---|
| Framework | Next.js on Vercel | **Vite + React SPA** |
| Modality | video talking-head avatar | **text + voice, no video** |
| Built by | RealAvatar x DeepLearning.AI | in-house rewrite |

We are cloning **v2**. There is no video avatar in it — the "avatar" is a
still portrait plus voice.

### v2's stack, as read from its own bundle

| Concern | What they use | Evidence in bundle |
|---|---|---|
| Auth | Google Identity Services | `accounts.google.com/gsi/client`, `VITE_GOOGLE_CLIENT_ID` |
| STT | **AssemblyAI Universal-Streaming v3** | browser opens `wss://streaming.assemblyai.com/v3/ws` directly |
| STT auth | ephemeral token from own API | `GET /v1/stt/token` |
| TTS | **ElevenLabs**, streamed | `audio/mpeg` chunks fed to `MediaSource` |
| Web search tool | **Tavily** | privacy-policy subprocessor list |
| Analytics / errors | PostHog, Sentry | `us.i.posthog.com`, `sentry.io` |
| Backend | own REST API | `/v1/chats`, `/v1/relationship`, `/v1/consent`, `/v1/feedback`, `/v1/reminders/return` |
| Hosting | AWS + GCP, CloudFront | subprocessor list, `d2vdd2rz5r85rm.cloudfront.net` |

Two design decisions there are worth copying outright:

1. **Audio never round-trips through their server.** The browser holds the
   AssemblyAI socket itself; the backend only mints a short-lived token. This
   is the single biggest latency win in the whole product.
2. **TTS is streamed through MediaSource Extensions**, so the avatar starts
   speaking before the sentence has finished generating.

And one that is the actual product, not the plumbing: `/v1/relationship` and
`/v1/reminders/return`. Persistent per-user memory, plus a background job that
prepares a follow-up thought before you come back. "Remembers your story,
keeps thinking between your conversations." That is the differentiator; the
voice is table stakes.

---

## 1. Stage plan

Each stage is shippable on its own. Stage 1 is the near-pixel replica with no
auth, as requested.

| Stage | Delivers | Auth | Voice | Memory |
|---|---|---|---|---|
| **1** | Pixel replica shell + working text chat against a local persona | none | none | in-thread only |
| **2** | Voice out (avatar speaks) | none | TTS | in-thread |
| **3** | Voice in (push-to-talk + live mode) | none | STT + TTS | in-thread |
| **4** | Google sign-in, per-user threads, consent screen | Google | both | per-user threads |
| **5** | Long-term memory (`relationship`) + return reminders | Google | both | cross-thread |
| **6** | RAG over your own corpus, Tavily search, feedback/analytics | Google | both | full |

Do not start Stage 2 until Stage 1's DOM matches the reference. Retrofitting
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
ai-avatar/
  reference/          # the real site's css/js/html — read-only source of truth
  web/                # Next.js frontend
  api/                # Fastify backend
  shared/             # types shared by web + api (message shapes, DTOs)
```

---

## 3. Taking the real UI (not screenshots)

This is the core of Stage 1. The method:

### 3.1 Recover the stylesheet
`reference/aiandrew.min.css` is 41 KB on a single line. Prettify it
(`bunx prettier --parser css`) and split it into a layered structure, keeping
**their class names verbatim** so markup can be reconstructed 1:1:

```
web/src/styles/
  tokens.css      # :root custom properties (see below)
  base.css        # reset, typography, layout primitives
  thread.css      # .thread, .msg-*, .date-*
  composer.css    # .composer-row, .composer-input, .composer-send, .composer-voice
  avatar.css      # .avatar-panel, .avatar-panel-bio, .avatar-panel-name
  voice.css       # .ptt-bar, .live-progress, .live-turn-stop
  settings.css    # .settings-*, .profile-*
  ...
```

The design system is entirely token-driven, which makes it clean to lift:

```css
--bg:#fbfbfb;  --accent:#1877f2;  --accent-hover:#1568d8;
--bubble:#d8efff;  --bubble-ink:#0c3d63;
--n100..--n900       /* neutral ramp */
--e1..--e5           /* elevation ramp */
--r-xs..--r-xl, --r-pill   /* radii */
--col:720px; --col-narrow:640px; --col-wide:960px; --measure:33em;
--ease:cubic-bezier(.22,.61,.36,1);
--avatar-size:clamp(180px,32vh,320px);
--composer-stack-height:114px;
--relationship-gold:#DAA520;
```

Copy that block first and build everything on top of it — it is the whole
visual identity in ~60 lines.

### 3.2 Recover the DOM structure
The bundle is minified but **not** obfuscated at the JSX level. Compiled
elements look like:

```js
w.jsx("div", { className: "composer-row", children: ... })
```

So grepping `reference/aiandrew.bundle.js` for a class name recovers the exact
element tree, tag names, attribute order and conditional class logic for that
component. That is how we get a faithful replica without ever screenshotting.
Work component by component, in this order — it matches the CSS class families
present, roughly by weight:

`thread` / `msg` → `composer` → `avatar` panel → `ptt` / `live` →
`feedback` → `settings` / `profile` → `journey` → `relationship` →
`consent` → `auth` → `legal` → `migration` (skip; it is their v1→v2 upgrade path)

### 3.3 Fonts — must be replaced
The site ships `ABCDiatype-Regular-Trial.woff2` and `-Medium-Trial.woff2`.
Those are **Dinamo trial licences**, which do not permit deployment. Two
options: buy ABC Diatype, or substitute. Closest free grotesk substitutes are
**Geist Sans** or **Inter**, with a `size-adjust` tuned fallback exactly as
they already do:

```css
@font-face { font-family:"Diatype Fallback"; src:local("Helvetica Neue"); size-adjust:97%; }
```

Nothing else in the CSS references an external asset — no images, no icon font.
The icons are inline SVG in the bundle.

### 3.4 One honest note
We are lifting a stylesheet from someone's product. For a personal, clearly
non-impersonating avatar of yourself that is your call to make, and the plan
proceeds on it. Two things to actually not do: ship the trial fonts, and use
Andrew's name, likeness or portrait anywhere in it.

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

### 6.2 STT — new, modelled on the original
sui-sentinal has no browser STT (its s2s service owns it), so this is the one
piece we build fresh. Follow AI Andrew exactly:
`GET /v1/stt/token` mints a short-lived AssemblyAI token, the browser opens
`wss://streaming.assemblyai.com/v3/ws` itself, mic audio goes through an
`AudioWorklet` at a fixed sample rate. Never proxy audio through Fastify.

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
- Colocate: `components/composer/MessageComposer.tsx` next to its own CSS module
  import; global lifted CSS stays in `styles/` since we are keeping their class names.

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
| AssemblyAI | 3 | streaming STT, priced per hour of audio |
| 100ms | 3 | only if we do live s2s mode |
| Tavily | 6 | web search tool, free tier exists |
| PostHog + Sentry | 6 | both have usable free tiers |

Check current pricing before committing — these change.

---

## 9. The part that is not code

Stage 6 is where this becomes *your* avatar rather than a chatbot with your
name on it. It needs a corpus: your writing, project READMEs, notes, and
transcripts of you actually talking. Andrew's own comment on the project was
that codifying how he really converses into an agentic workflow was the hard,
still-unfinished part — not the voice, not the UI. Budget accordingly.

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

1. **Landing page** — none. `/` is the chat surface, matching the reference,
   whose only pre-chat screen is the Stage 4 sign-in. A marketing page can be
   added later at its own route without touching the shell.
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

**Frontend** — `/` renders the replica shell: `.shell` → `.mobile-header` +
`.chat-canvas` → `.avatar-panel` + `.thread-pane`, with the full stylesheet
lifted from the reference and split into layers under `web/src/styles/`, class
names verbatim. Working pieces: date dividers, user and reply bubbles, the live
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
