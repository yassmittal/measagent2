# CLAUDE.md

Guidance for Claude Code working in **meAsAgent** — a personal AI avatar that
answers. `PLAN.md` is the build plan and the source of truth for what
each stage delivers, `README.md` is how to set the project up and run it, and
this file is the day-to-day working guide.

Deployed at **meAsAgent.vercel.app**. `meAsAgent.com` is the eventual domain but
is not owned yet — every URL in the code and metadata uses the Vercel domain.

## Layout

```
web/         Next.js 16 + React 19 frontend (Vercel)
api/         Fastify 5 + Bun backend
shared/      TypeScript types shared by web + api, no publish step
```

Bun workspaces. Install once from the repo root (`bun install`); `bun add --cwd api <pkg>`
to add a dependency to one workspace.

```bash
bun run db:start    # project-local MongoDB on 27018
bun run dev         # web on :3000 and api on :3010 together
bun run dev:web     # or one at a time
bun run dev:api
bun run db:stop
cd web && bun run build && bun run typecheck && bun run lint
cd api && bun run typecheck
```

## Running locally

`bun run db:start` boots a mongod that belongs to this project alone —
`scripts/mongodb.sh`, data in `.mongo/data` (gitignored), port **27018**. It is
deliberately not `brew services start mongodb-community`: that runs one shared
server on 27017 for the whole machine, and this way resetting the database is
`bun run db:stop && rm -rf .mongo`.

| | |
|---|---|
| Compass URI | `mongodb://127.0.0.1:27018/` |
| Database | `measagent` |
| Collections | `threads`, `messages` |
| Logs | `bun run db:logs` |

`mongosh` is not installed; Compass covers it, and `mongoexport` (from
`mongodb-database-tools`, already installed) is the quick CLI peek:

```bash
mongoexport --uri "mongodb://127.0.0.1:27018/measagent" --collection messages --quiet
```

`api/.env` and `web/.env.local` are gitignored and already written, including a
`BEDROCK_API_KEY` copied from `sui-sentinal/backend-service/api/.env`.

## Stage

Stages 1-3 are done: the chat shell with working text chat, spoken replies
streamed as `audio_delta` spans alongside the text, and hold-to-speak voice
input. Stages 4-6 (Google sign-in, long-term memory, RAG) are specified in
`PLAN.md §1`.

Voice input (Stage 3) is dictation, not a live call. Holding the mic streams
microphone audio straight from the browser to the transcription provider, and
the release sends the transcript as an ordinary message — so a spoken turn and
a typed turn are the same turn from `handlers/chats/send-message.ts` onward.
The api only mints the session (`services/transcription/` is the provider seam,
`POST /v1/transcription/sessions` the route); audio never passes through it.
The browser side is `web/src/lib/voice/speech-capture.ts` plus
`web/public/worklets/mic-capture.js` — transport only, no product logic, with
the gesture in `hooks/useSpeechCapture.ts`.

`POST /v1/chat/completions` (`handlers/voice/chat-completions.ts`, routed by the
`ma-route:` marker in `lib/voice/route-marker.ts`) is a separate seam for an
external speech-to-speech service to use this api as its language model. The
browser does not call it.

Stage 2's spoken replies live in three places and nowhere else: `services/speech/` is the provider
seam, `lib/speech/` is the pure text handling, `handlers/chats/reply-voice.ts`
orchestrates a turn. **A failing voice must never fail a turn** — every path
downgrades to a `voice_unavailable` event and the reply still arrives as text.

## Stylesheet-driven UI

The stylesheet is split into layers under `web/src/styles/`, imported in order
by `web/src/app/globals.css`, and written flat — no nesting, one class per
element. Components are named after the class they own, so the CSS and the
markup can be navigated from either end: grep a class name and you find both
the rule and the component.

The styles lead the markup here. Several layers describe UI that is not built
yet (message actions, settings, feedback, auth); when you build one of those,
render the DOM the existing rules already expect rather than writing new CSS.
`grep -rn '\.class-name' web/src/styles/` shows what a rule needs.

Two rules that are not negotiable:

- **Never ship the trial fonts.** `ABCDiatype-*-Trial.woff2` are Dinamo trial
  licences and must not enter the repo. Geist Sans is loaded via `next/font`
  with a `size-adjust` local fallback so metrics stay stable.
- **The persona is Yash, and only Yash.** Name, likeness, bio and portrait all
  live in `web/src/lib/persona.ts`; never borrow another person's.

## Backend conventions

Folder roles, copied from `sui-sentinal/backend-service/api`:

```
routes/<resource>/index.ts     thin: schema + delegate. No business logic.
routes/<resource>/schemas.ts   JSON schemas, frozen, exported as one object
handlers/<resource>/*.ts       request orchestration
lib/<domain>/*.ts              pure domain logic — MUST NOT import fastify
services/*.ts                  external I/O (LLM, TTS, STT tokens)
shared/*.ts                    cross-cutting helpers
plugins/*.ts                   env, mongo, cors, docs, indexes
```

- Every route gets a JSON schema, response schemas included — they are the
  serializer, not just validation.
- Errors go through `@fastify/sensible` (`reply.badRequest(...)`), never a bare
  `throw new Error`.
- `catch (error)` is `unknown`: use `getErrorMessage` from `shared/errors.ts`.
- Pino: `log.error({ err: error }, 'message')`.
- Import specifiers keep the `.js` extension (`from './foo.js'` for `foo.ts`) —
  required by `moduleResolution: nodenext`. **`web/` is the opposite**: bundler
  resolution, extensionless imports.
- Env is read once in `plugins/env.ts` and reached through `fastify.config`.
  Declare new decorators in `types/fastify.d.ts` rather than casting.
- Plugins are registered by hand in `server.ts`, in dependency order. Do not
  autoload them — filesystem order is not guaranteed across platforms.

**`mongodb` is pinned to v6.** v7 pulls `bson@7`, which calls
`node:v8 isBuildingSnapshot` and crashes on Bun at import time.

## Frontend conventions

- Components are nouns naming what is on screen, matching the CSS class they
  own: `.thread` → `ConversationThread`, `.composer-row` → `MessageComposer`,
  `.avatar-panel` → `AvatarPanel`, `.ptt-bar` → `PushToTalkBar`.
- Hooks say what they give you: `useThinkingPhrase`, not `usePhrase`.
- Client components only where interactivity demands it; the shell stays server
  rendered.
- **All streaming state lives in one reducer** (`state/conversation-reducer.ts`),
  never several `useState`s that can disagree about the same turn.
- No `useEffect` for derived state — derive during render.
- Icons come from `lucide-react`, sized at the call site. Do not hand-roll SVG
  components — the UI wants plain 18-20px stroked glyphs, and one consistent
  icon set is worth more than the last pixel of any single glyph.
- Dates are formatted with `date-fns`, through `lib/format-date.ts`. Its output
  is locale-fixed on purpose: the thread is server rendered, so a label that
  differed between server and browser would be a hydration mismatch.

## Naming

Functions are verb phrases that say what they do: `buildPersonaSystemPrompt`,
`streamReply`, `deriveThreadTitle`. Booleans read as assertions:
`isChatModelConfigured`, `isTurnActive`. Types describe the shape, not the
position: `StoredMessage`, `ThreadSummary`. `stt`/`tts` are fine — they are the
domain terms; `msg`, `cfg`, `res2` are not.

Comment the *why*, never the *what*.

## Data

MongoDB. `threads`, `messages` now; `relationships` and `returnReminders` at
Stage 5. Every document carries `userId` **from day one** even though Stage 1
has no accounts — it holds an anonymous `device:<id>` until sign-in, which makes
the Stage 4 migration one `updateMany` instead of a schema rewrite.

## Deploying

**`web/` → Vercel.** Because this is a Bun workspace, the Vercel project needs
Root Directory `web` with *Include source files outside of the Root Directory*
enabled, so `bun install` runs against the repo root and `@measagent/shared`
resolves. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed API origin — it is a
public value, the browser calls the API directly and there is no proxy in front
of it.

**`api/` → anywhere that runs Bun** (Fly, Railway, EC2). It is not deployable to
Vercel: `POST /v1/chats` holds an open SSE stream for the length of a turn, and
Stage 3 adds a long-lived voice gateway. Whatever origin it lands on has to be
listed in `MA_WEB_ORIGIN` — see `api/.env.example` for the full set of vars.

Local development is covered under **Running locally** above. Without a
`BEDROCK_API_KEY`, point `BEDROCK_BASE_URL` at any OpenAI-compatible stub to
exercise everything but the model itself.

## Version control

Do not run any git command here. Leave changes in the working tree and say what
changed — Yash handles version control himself.
