We're turning meAsAgent from a one-person avatar (Yash) into a multi-person product. Visitors can browse the avatars people have launched and talk to one. Anyone who signs in can launch an agent of themselves, and what we know about each person is stored in MongoDB instead of being hardcoded.

Don't write code yet. Read first, ask me your questions, agree a plan with me, and only then build.

## 1. Read before anything else

- `CLAUDE.md`: the working conventions. Follow them, with one exception described below.
- `PLAN.md`, especially §5 (data model), §6.3 (live voice), and §12–§14 (what each stage actually shipped).
- `STAGE-4.md`: the most recent stage and the reasons behind its decisions. Identity, claiming, consent and the signed voice marker all come from there, and this work builds directly on them.
- `README.md` and `RUNBOOK.md`: how to run everything and how the three pipelines (typed chat, spoken replies, live voice) flow.
- `web/AGENTS.md`: this is Next.js 16. Read the relevant guide in `web/node_modules/next/dist/docs/` before writing any routing or page code.

**One rule is out of date.** `CLAUDE.md` says "The persona is Yash, and only Yash", and `PLAN.md` §3.4 and §10 say the same. That was true for a personal avatar and isn't anymore. Update those lines as part of this work. The rule that *does* survive is: never create an avatar of someone who isn't the signed-in person creating it.

## 2. Where the single persona is hardcoded today

I checked this before writing the prompt. Confirm it yourself; don't take it on trust.

**web**
- `web/src/lib/persona.ts` holds `PERSONA_NAME`, `PERSONA_BIO`, `PERSONA_TAGLINE`, `EMPTY_THREAD_PROMPT`, `AVATAR_PORTRAIT_SRC`, `CONTACT_EMAIL` and `PRODUCT_NAME`.
- Those constants are read by `app/layout.tsx` (metadata), `app/privacy/page.tsx`, `app/terms/page.tsx`, `Avatar`, `AvatarPanel`, `MobileHeader`, `ConversationThread`, `MessageComposer`, `PushToTalkBar`, `ConsentCard` and `SignInPrompt`.
- `/` is currently the chat itself.

**api**
- `api/lib/chat/persona.ts` hardcodes a `PERSONA` prompt. `buildPersonaSystemPrompt()` takes no person.
- It is called by `handlers/chats/send-message.ts` (typed chat) and `handlers/voice/chat-completions.ts` (live voice). Both need to know *which* avatar a turn belongs to.
- `services/speech/index.ts` mentions Yash in a comment about the voice provider.

**data**
- Threads have a `userId` (the person talking) but nothing that says *which avatar* they're talking to.
- The signed voice marker (`POST /v1/voice/sessions`) carries `{ sub, threadId }`.
- There are 10 real conversations in the local database right now, all with Yash's avatar. They must survive this change.

## 3. Ask me these before planning

Ask them together, with a recommended option where you have one. Add anything else that would change the design, and skip anything you can decide sensibly yourself.

1. **Who can launch an avatar?** Any signed-in Google account, or only people I approve? One avatar per account, or several?
2. **What do we store about a person?** For example: name, a URL handle, bio, tagline, how they talk, facts about them, topics to avoid, a contact email. Which fields are required, and which do we leave for later?
3. **The portrait.** An upload is planned eventually (see the grey placeholder at `web/public/avatar/portrait.svg`). Do we build uploading now, use Google's profile picture for the time being, or keep the placeholder?
4. **Discovery.** Is there a public directory of every avatar at `/`, or are avatars unlisted and shared by link? What does a visitor see on arrival?
5. **URLs.** `/[handle]`, `/a/[handle]`, or something else? Which handles are reserved?
6. **Yash's existing avatar.** Should it become the first avatar in the database, with the 10 existing conversations attached to it?
7. **What an owner can see.** Can a person read the conversations visitors have had with their avatar? This is a privacy question. The consent card and privacy notice currently promise visitors something specific, so the answer changes what they must say.
8. **Editing and removal.** Can an owner edit their avatar after launching it? Unpublish it? Delete it, and if so, what happens to its conversations?
9. **Safety of owner-written persona text.** Owners will be writing what is effectively part of a system prompt. How much do we constrain it: free text, structured fields assembled server-side, or both? What must the api always append no matter what the owner writes (for example "you are an AI, say so if asked")?
10. **Voice.** Does every avatar share the one voice for now? (Stage 2.5 was dropped, so see `STAGE-2.5.md`.)

## 4. Constraints that must keep holding

- **Anonymous visitors still work.** Signing in stays optional for *talking*. Only *launching* an avatar requires an account.
- **Claiming still works.** Signing in moves a device's conversations onto the account (`lib/chat/thread-ownership.ts`). That must remain correct across multiple avatars.
- **The voice marker stays a signed token** that the browser can't forge. If it needs to carry the avatar, the api still proves ownership before minting it.
- **The persona is built server-side from the database.** Nothing in a chat request from the browser is trusted to name or shape the persona. Visitors must never be able to set the system prompt.
- **A failing voice never fails a turn**, as before.
- **Stage 5 (long-term memory)** is still ahead. Its `relationships` collection was designed per user. Design this so memory can be keyed per person *per avatar* later without a rewrite. Don't build memory now.
- **The stylesheet leads the markup.** Before writing new CSS, grep `web/src/styles/` for rules that already describe the UI. If new CSS is genuinely needed (a directory page, a launch form), follow the existing conventions: flat rules, one class per element, and a component named after the class it owns.

## 5. How I want the code written

This project will grow, so these points matter more than speed.

- **Readable first.** Variable and function names should explain themselves: functions are verb phrases saying what they do, booleans read as assertions, types describe shapes. No `data`, `info`, `item`, `handleStuff` or `temp`.
- **Reuse before adding.** Look for an existing helper, type, hook, component, schema or CSS rule before writing a new one. `readCaller`, `toUserProfile`, `SettingsPanel`, `formatAbsoluteDate` and the route/schema/handler split already exist and should be extended, not duplicated.
- **No speculative code.** Nothing "for later", no abstraction with a single user, no options nobody passes. Unnecessary code is what would stop this scaling.
- **Framework best practices.** Next.js: server components by default and client components only where interactivity demands it; data fetching where it belongs; typed routes (run `bunx next typegen` after adding routes). React: no `useEffect` for derived state, and one reducer for streaming state. Fastify: every route has a JSON schema including responses; errors go through `@fastify/sensible`; `lib/` never imports fastify; env is read once in `plugins/env.ts`.
- **Comment the why, never the what.** Match the comment density and tone already in the codebase.

## 6. How to work

1. Read (section 1), then ask me the questions (section 3) and wait for answers.
2. Propose a plan in plain language: the data model, routes, pages, a migration for the existing conversations, and how it splits into phases that each ship on their own. Wait for my go-ahead.
3. Build **one phase at a time**, not the whole thing in one go.
4. Verify each phase for real, not only with typecheck:
   - Run `bun run typecheck` in `shared/` and `api/`, and `bun run typecheck && bun run lint && bun run build` in `web/`.
   - Run checks against the running api and the local MongoDB. At minimum: a visitor can't see another avatar's conversations, can't shape a persona from the request, an owner can only edit their own avatar, anonymous chat and claiming still work, and the voice marker still refuses forgeries.
   - Do a browser pass through the new pages.
   - Delete any test data you create, and leave the 10 existing conversations untouched.
5. Keep `PLAN.md`, `README.md`, `RUNBOOK.md` and `CLAUDE.md` accurate as things change.
6. At the end, write `MULTI-PERSON.md` in the repo root explaining what you built and **why**, for every decision: what you chose, what you rejected, what you couldn't verify, anything you changed that I didn't ask for, and what's still open. `STAGE-4.md` is the tone and depth I'm after.

## 7. Things that will bite

- **Never run any git command.** No status, diff, add or commit. Leave changes in the working tree and tell me what changed.
- **`mongodb` is pinned to v6** because v7 crashes on Bun at import. A test script outside `api/` resolves v7 from the global cache and crashes. Import it from `api/node_modules/mongodb/lib/index.js` instead.
- **Typed routes are on.** A new page isn't linkable until the route types are regenerated (`bunx next typegen`).
- **`aria-modal` hides the page from accessibility snapshots.** When a modal is open, an accessibility snapshot shows the page behind it as empty. Check the DOM before assuming a render bug.
- **`scripts/voice-talk.sh`** mints a voice marker through the api. If the marker's shape changes, update the script too.
- **The dev Mac has no working microphone by default.** Test live voice with `bun run talk`, not the browser mic.
