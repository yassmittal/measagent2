# meAsAgent

A personal AI avatar — a chat surface where visitors talk to an agent that
answers as Yash. The UI is a faithful rebuild of `avatar.andrewng.org` (v2):
its stylesheet and DOM were recovered from the live bundle, not re-designed.

Deployed at **meAsAgent.vercel.app**.

`PLAN.md` is the build plan and says what each stage delivers. `CLAUDE.md` is
the working guide — conventions, folder roles, naming. This file is how you get
it running.

---

## Architecture

```
web/       Next.js 16 + React 19, deployed to Vercel
api/       Fastify 5 on Bun, deployed anywhere that runs Bun
shared/    TypeScript types imported by both, no build or publish step
reference/ the original site's html/css/js — read-only, gitignored
scripts/   project-local MongoDB helper
```

Bun workspaces, one lockfile at the root. The browser calls the API directly;
there is no Next.js route handler in front of it.

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
| `HF_TOKEN`, `ASSEMBLYAI_API_KEY`, `MA_S2S_API_KEY` | voice, from Stage 2 on |

Every variable is read once in `api/plugins/env.ts` and reached through
`fastify.config`. Nothing else touches `process.env`.

**`web/.env.local`**

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | the API origin. Public by design — the browser calls it |

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
| Collections | `threads`, `messages` (`relationships`, `returnReminders` at Stage 5) |

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
| `POST /v1/chats` | send a message; responds with an SSE stream for the turn |
| `GET /v1/chats/:chatId` | load a thread and its messages |
| `POST /v1/chats/:chatId/turns/:turnId/tts` | re-synthesize a stored reply as one audio file |
| `GET /health` | liveness |

Requests carry the owner in an `x-device-id` header. A thread belonging to
another device returns 404, not someone else's data.

`POST /v1/chats` is framed as SSE but is deliberately **not** consumed with
`EventSource` — the browser has to POST a body and send its own headers, so
both ends speak SSE over a plain chunked `fetch`. Event shapes live in
`shared/src/stream.ts`: `turn_started` → `delta`… → `turn_completed`, or
`turn_failed` with a `retryable` flag. When the reply is spoken, `audio_delta`
spans are interleaved with the text and closed by `audio_done`.

---

## Live voice

Talking to the avatar is a separate pipeline from the typed one. A standalone
speech-to-speech service owns the microphone, voice activity detection,
transcription and synthesis; our API is only its language model, reached at
`POST /v1/chat/completions`:

```
browser ──ws──► s2s service ──POST /v1/chat/completions──► this API
        mic in,     VAD·STT·TTS      Bearer MA_S2S_API_KEY    persona,
        audio out                                             history, Mongo
```

The s2s service has one process-global backend URL and no per-session routing
channel, so the browser smuggles `ma-route: {"threadId","userId","sessionId"}`
through the realtime session `instructions`, and the gateway reads that line to
decide which conversation a request belongs to. Nothing else in the incoming
`messages` is trusted — the persona prompt is rebuilt server-side every turn.
Spoken and typed turns therefore land in the same thread.

Run it locally (Apple Silicon; models are cached after the first run):

```bash
cd ~/projects/sui/sui-sentinal/speech-to-speech
.venv/bin/speech-to-speech serve   --port 8766   --stt mlx-audio-whisper   --mlx_audio_whisper_model_name mlx-community/whisper-large-v3-turbo-4bit   --tts facebookMMS --facebook_mms_device cpu   --llm_backend chat-completions --model_name measagent   --responses_api_base_url "http://127.0.0.1:3010/v1"   --responses_api_api_key "$MA_S2S_API_KEY"   --responses_api_stream
```

Set `NEXT_PUBLIC_SPEECH_TO_SPEECH_URL` to that endpoint. Unset it and the
control renders disabled rather than breaking.

Browser-side, `lib/voice/realtime-client.ts` owns transport only: two audio
worklets in `public/worklets/` resample between the AudioContext rate and the
service's 16kHz PCM16, and `input_audio_buffer.speech_started` clears the
playback queue so talking over the avatar interrupts it.

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
voices and can never sound like Yash; replacing it with an ElevenLabs clone is
an edit to `getSpeechSynthesizer()` and nothing else.

**A failing voice never fails a turn.** No `HF_TOKEN`, an unreachable provider, a
depleted quota — all of them emit `voice_unavailable` and the reply arrives as
text exactly as it would have.

---

## Frontend

The stylesheet is lifted from `reference/` with **class names kept verbatim**,
split into layers under `web/src/styles/` and imported in order by
`app/globals.css`. That is what lets the DOM be reconstructed 1:1 — so when
changing anything visual, check it against the reference rather than redesigning.

To recover the markup for a component, prettify the bundle and grep the class
name; the JSX survives minification:

```bash
bunx prettier@3 --parser babel reference/aiandrew.bundle.js > /tmp/ref.js
grep -n '"composer-row"' /tmp/ref.js
```

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
- **Never ship the trial fonts.** The reference's `ABCDiatype-*-Trial.woff2` are
  Dinamo trial licences. Geist Sans is substituted via `next/font`, keeping the
  reference's own `size-adjust` fallback metrics.
- **Never use Andrew Ng's name, likeness, bio or portrait.** The persona is
  Yash, and all of it lives in `web/src/lib/persona.ts`.
- **Do not run git commands here.** Leave changes in the working tree; Yash
  handles version control.

---

## Deploying

**`web/` → Vercel.** Because this is a Bun workspace the Vercel project needs
Root Directory `web` with *Include source files outside of the Root Directory*
enabled, so `bun install` runs against the repo root and `@measagent/shared`
resolves. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed API origin.

**`api/` → anywhere that runs Bun** (Fly, Railway, EC2). Not Vercel:
`POST /v1/chats` holds an open stream for the length of a turn, and Stage 3 adds
a long-lived voice gateway. Whatever origin it lands on must be listed in
`MA_WEB_ORIGIN`.

---

## Where this is going

| Stage | Delivers | Auth | Voice |
|---|---|---|---|
| **1** ✅ | replica shell + text chat | none | none |
| **2** ✅ | voice out — the avatar speaks | none | TTS |
| **3** 🔨 | voice in — live conversation in the browser | none | STT + TTS |
| **4** | Google sign-in, per-user threads, consent | Google | both |
| **5** | long-term memory and return reminders | Google | both |
| **6** | RAG over Yash's corpus, web search, feedback | Google | both |

`PLAN.md` has the detail for each, including what Stage 1 deliberately left out.
