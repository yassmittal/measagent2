# CLAUDE.md

Guidance for Claude Code working in **meAsAgent** — AI avatars of real people.
Anyone signed in can launch an avatar of themselves; visitors browse the
reviewed ones and talk to any of them. `PLAN.md` is the build plan and the
source of truth for what each stage delivers, `README.md` is how to set the
project up and run it, and this file is the day-to-day working guide.

Deployed at **meAsAgent.vercel.app**. `meAsAgent.com` is the eventual domain but
is not owned yet — every URL in the code and metadata uses the Vercel domain.

## Layout

```
web/         Next.js 16 + React 19 frontend (Vercel)
admin/       Next.js 16 admin portal — reviews avatars for the directory
api/         Fastify 5 + Bun backend
shared/      TypeScript types shared by web, admin and api, no publish step
```

Bun workspaces. Install once from the repo root (`bun install`); `bun add --cwd api <pkg>`
to add a dependency to one workspace.

```bash
bun run db:start    # project-local MongoDB on 27018
bun run dev         # web on :3000 and api on :3010 together
bun run dev:web     # or one at a time
bun run dev:api
bun run dev:admin   # admin portal on :3020
bun run admin:hash-password   # the value for MA_ADMIN_PASSWORD_HASH
bun run db:stop
cd web && bun run build && bun run typecheck && bun run lint
cd admin && bun run build && bun run typecheck && bun run lint
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
| Collections | `users`, `avatars`, `threads`, `messages`, `relationships`, `returnReminders`, `weeklySummaries` |
| Logs | `bun run db:logs` |

`mongosh` is not installed; Compass covers it, and `mongoexport` (from
`mongodb-database-tools`, already installed) is the quick CLI peek:

```bash
mongoexport --uri "mongodb://127.0.0.1:27018/measagent" --collection messages --quiet
```

`api/.env` and `web/.env.local` are gitignored and already written, including a
`BEDROCK_API_KEY` copied from `sui-sentinal/backend-service/api/.env`.

## Stage

Stages 1-5 are done: the chat shell with working text chat, spoken replies
streamed as `audio_delta` spans alongside the text, hold-to-speak voice input,
Google sign-in with per-account conversations, and long-term memory with return
reminders (`STAGE-5.md` has the reasoning). On top of that the product is
**multi-person** (`MULTI-PERSON.md` has the reasoning): `/` is a directory of
reviewed avatars, `/[handle]` is the chat with one avatar, `/launch` launches or
edits your own, and `admin/` reviews what the directory lists. Owners **read
their visitors** at `/launch/visitors` and get a **weekly summary email**
(`OWNER-VIEW.md` has the reasoning). Stage 6 (RAG) is
specified in `PLAN.md §1`. Stage 2.5 was investigated and dropped —
`STAGE-2.5.md` says why, and records three things about voice that are wrong in
older docs.

Voice input (Stage 3) is **hold-to-speak over a live voice session**, and it is
a third pipeline: the standalone speech-to-speech service owns the microphone,
voice-activity detection, transcription and synthesis, and calls
`POST /v1/chat/completions` as its language model. This api owns the persona,
the history and the persistence — nothing in the incoming `messages` is trusted
except the latest transcript, so a spoken turn and a typed turn land in the same
thread. Routing is the `ma-route:` marker in `lib/voice/route-marker.ts`,
smuggled through the realtime session's `instructions` because the service has
no per-session routing channel of its own.

The browser side is `web/src/lib/voice/realtime-client.ts` plus the worklets in
`web/public/worklets/` — transport only, no product logic. The gesture is
`hooks/useLiveVoice.ts`: it opens the socket once and thereafter only toggles
`setMicrophoneEnabled`, because a permission prompt and a handshake are far too
much to pay on every press. **Releasing the button does not cut the audio** —
the microphone stays open for a short tail so the service hears the silence it
uses to detect end-of-turn, and closes early once the avatar starts speaking.

A spoken turn is persisted by the api on the service's behalf, so the browser
renders the transcripts optimistically and then re-reads the thread.

Since Stage 4 the marker is **a token the api signed**, fetched from
`POST /v1/voice/sessions`, not a JSON object the browser assembles. The browser
opens the realtime session itself, so an owner id it could write into that
string would not be an owner id at all. Ownership is proved once when the marker
is minted; `chat-completions.ts` verifies the signature and trusts nothing else
in the request but the latest transcript.

Stage 5's memory is **per visitor per avatar**, and only for signed-in visitors
who have accepted the terms. Nothing about it happens inside a turn except one
read and one bookkeeping write, both in `handlers/chats/turn-memory.ts`, which
typed chat and live voice share — **a failing memory never fails a turn**, the
same rule as voice. The summarising and the reminders run in a timer inside the
api (`plugins/background-jobs.ts` → `jobs/`), with work claimed by a lease in
MongoDB so several instances never do it twice. Remembered text reaches the
prompt only inside `<visitor_memory>`, framed as information and never
instructions, with the closing rules still last.

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

Rules that are not negotiable:

- **Never ship the trial fonts.** `ABCDiatype-*-Trial.woff2` are Dinamo trial
  licences and must not enter the repo. Geist Sans is loaded via `next/font`
  with a `size-adjust` local fallback so metrics stay stable.
- **Remembered text is data, never instructions.** It goes into the prompt only
  through `buildVisitorMemorySection` in `lib/chat/persona.ts`, and the writer in
  `lib/memory/memory-writer.ts` is told to drop instructions to the avatar.
- **An avatar is only ever of the person who launched it.** Its name and photo
  are read from the owner's Google account and cannot be set any other way;
  nothing in the code may hardcode a person, and no avatar is created on
  someone else's behalf — not even as seed or test data that ships.

## Backend conventions

Folder roles, copied from `sui-sentinal/backend-service/api`:

```
routes/<resource>/index.ts     thin: schema + delegate. No business logic.
routes/<resource>/schemas.ts   JSON schemas, frozen, exported as one object
handlers/<resource>/*.ts       request orchestration
lib/<domain>/*.ts              pure domain logic — MUST NOT import fastify
services/*.ts                  external I/O (LLM, TTS, STT tokens)
jobs/*.ts                      background passes run by plugins/background-jobs.ts
shared/*.ts                    cross-cutting helpers
plugins/*.ts                   env, mongo, cors, docs, indexes, background jobs
```

- Every route gets a JSON schema, response schemas included — they are the
  serializer, not just validation.
- Errors go through `@fastify/sensible` (`reply.badRequest(...)`), never a bare
  `throw new Error`.
- `catch (error)` is `unknown`: use `getErrorMessage` from `shared/errors.ts`.
- Pino: `log.error({ err: error }, 'message')`.
- Import specifiers keep the `.js` extension (`from './foo.js'` for `foo.ts`) —
  required by `moduleResolution: nodenext`. **`web/` and `admin/` are the
  opposite**: bundler resolution, extensionless imports.
- `shared/`'s index re-exports **types only**. A module with runtime values
  (`avatars.ts`: the handle pattern, text limits) is imported by its own subpath,
  `@measagent/shared/avatars`, because the bundler cannot follow the index's
  `.js` specifiers to `.ts` source. Add a subpath in `shared/package.json` rather
  than exporting a value from the index.
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

MongoDB. `users`, `avatars`, `threads`, `messages`, `relationships`,
`returnReminders`, `weeklySummaries`. Every document carries `userId` **from day one** —
it held an anonymous `device:<id>` before accounts existed, which is what made
the Stage 4 migration one `updateMany` (`lib/chat/thread-ownership.ts`) instead
of a schema rewrite.

An **avatar** is one document per account (unique `ownerId`, unique `handle`).
It does not copy the owner's name or photo — `lib/avatars/avatar-with-owner.ts`
reads them from `users`, so always load an avatar through there. A **thread**
carries both `userId` (who is talking) and `avatarId` (who they are talking to);
every thread query filters on both. A `relationship` (what one avatar remembers
about one visitor) keys on the same pair, and so does a `returnReminder`.
Messages carry `memorizedAt`, null until the memory pass has read them: claiming
hands over unread messages, and forgetting marks everything read, so neither
needs a memory of its own to move.

**Claiming merges.** The web app opens one conversation per visitor per avatar,
so `claimDeviceThreadsForAccount` merges a device conversation into the account's
existing conversation with the same avatar instead of adding a second one beside
it — a second one would hide the first. Sign-in also clears the browser's
remembered conversations so the account's own latest one opens.
The persona prompt is built from the avatar document on every turn
(`lib/chat/persona.ts`): a request only ever *names* an avatar, never shapes it.

**What an owner may read is decided in one place**, `findAvatarVisitors` in
`lib/visitors/avatar-visitors.ts`: never their own conversations, signed-in
visitors only once they have accepted the terms, anonymous visitors only for
conversations started after `OWNER_NOTICE_SHOWN_SINCE` (when the line under the
composer told them). The visitors page, one visitor's conversations and the weekly
summary all start there. A visitor is identified to an owner by the id of their
first conversation — never a device id, which is what an anonymous visitor
authenticates with, and never an email address.

The **weekly summary** (`jobs/weekly-summary-pass.ts`) is one document per owner
per week in `weeklySummaries` (unique `ownerId` + `weekKey`), moved from
`summarizing` to `sending` to `sent` under a lease, with one small-model call per
visitor and the document id as Resend's idempotency key. It never runs unless
`MA_RESEND_API_KEY` and `MA_EMAIL_FROM` are set — keep them empty in any api
pointed at the real database — and a failing email never fails anything else.

An owner id carries its kind as a prefix, `device:<id>` or `google:<subject>`
(`lib/auth/owner-id.ts`), and a user's `_id` **is** their owner id, so the value
on a thread is also the key of the `users` collection.

## Identity

`shared/identity.ts` is the only place a request's owner is decided.
`readCaller` prefers a valid session token and falls back to the device header —
the order matters on the request right after a sign-in, when the browser still
sends both. Handlers call `readCaller`; nothing reads the headers itself.

Every token the api signs carries a `purpose` — `session`, `voice-session`,
`admin-session` or `weekly-summary-unsubscribe` (`lib/auth/token-purpose.ts`) —
and each verifier accepts only its own. All of them share one secret, so without
the claim a voice marker would pass as a sign-in.

Sign-in is **optional**, and every route that takes a device id still does.
Google's credential is verified by `google-auth-library` in
`services/google-identity.ts`; what the browser carries afterwards is this
service's own 30-day token, signed in `plugins/auth.ts` and sent as
`Authorization: Bearer` rather than a cookie, because the api is on a different
origin from the web app. There is no sign-out route: the token is not stored
here, so signing out is the browser discarding it.

Consent lives on the user document with the version accepted
(`CONSENT_TERMS_VERSION`). **Accepted once is accepted for good** — the version
is a record of which wording was on screen, and moving it re-asks nobody. Whether
someone has accepted is decided once, by `hasAcceptedTerms` in
`lib/auth/user-profile.ts`: launching an avatar and being remembered both depend
on it, and so does an owner reading their visitors. The person behind an avatar
reads their visitors' conversations and gets a weekly summary; the consent card,
the line under the composer and the privacy notice say so.

## Deploying

**`web/` → Vercel.** Because this is a Bun workspace, the Vercel project needs
Root Directory `web` with *Include source files outside of the Root Directory*
enabled, so `bun install` runs against the repo root and `@measagent/shared`
resolves. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed API origin — it is a
public value, the browser calls the API directly and there is no proxy in front
of it.

**`admin/` → its own Vercel project** (Root Directory `admin`, same *Include
source files* setting). It needs `MA_API_BASE_URL` and `MA_WEB_BASE_URL`, both
server-side only; its server calls the api, so its origin does not go in
`MA_WEB_ORIGIN`. The api needs `MA_ADMIN_USERNAME` and `MA_ADMIN_PASSWORD_HASH`.

**`api/` → anywhere that runs Bun** (Fly, Railway, EC2). It is not deployable to
Vercel: `POST /v1/chats` holds an open SSE stream for the length of a turn, and
Stage 3 adds a long-lived voice gateway. Whatever origin it lands on has to be
listed in `MA_WEB_ORIGIN` — see `api/.env.example` for the full set of vars. The weekly summary
needs `MA_RESEND_API_KEY`, `MA_EMAIL_FROM` (on a domain verified in Resend),
`MA_WEB_BASE_URL` and `MA_API_PUBLIC_URL`; without the first two it simply does
not run.

Local development is covered under **Running locally** above. Without a
`BEDROCK_API_KEY`, point `BEDROCK_BASE_URL` at any OpenAI-compatible stub to
exercise everything but the model itself.

## Version control

Do not run any git command here. Leave changes in the working tree and say what
changed — Yash handles version control himself.
