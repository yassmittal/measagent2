We're building **Stage 5 of meAsAgent: long-term memory and return reminders.** Today every conversation with an avatar starts from nothing except the recent messages in that one thread. After this stage, an avatar remembers the person it is talking to across conversations (what they told it, what they care about, what was left unfinished), and it can prepare a follow-up for when that person comes back. `PLAN.md` §0 calls this "the actual product; voice is table stakes."

Don't write code yet. Read first, ask me your questions, agree a plan with me, and only then build.

## 1. Read before anything else

- `CLAUDE.md`: the working conventions. Follow them.
- `PLAN.md`, especially §0 (why memory matters), §1 (the stage table), §4 (`GET /v1/relationship`, `GET /v1/reminders/return`), §5 (the `relationships` and `returnReminders` shapes), and §12–§15 (what each stage actually shipped).
- `MULTI-PERSON.md`: the most recent work. Memory must be keyed per visitor **per avatar**, and decisions 2 (how the persona prompt is built) and 5 (threads belong to a visitor *and* an avatar) are what this stage builds on.
- `STAGE-4.md`: identity, claiming and consent. Its decision 5 says consent is not enforced "until memory lands". That moment is now.
- `README.md` and `RUNBOOK.md`: how to run everything and how the three pipelines (typed chat, spoken replies, live voice) flow. Memory has to work in the typed and the spoken path.
- `web/AGENTS.md` and `admin/AGENTS.md`: this is Next.js 16. Read the relevant guide in `node_modules/next/dist/docs/` before writing routing or page code.
- `reference/aiandrew.bundle.js` (read-only): the site this project replicates already has this feature. Search it for `/v1/relationship`, `user_message_count`, `/v1/reminders/return`, `/reminders/seen` and `reminder_delivery_eligible` to see the response shapes and pages it used. Use it to inform the design, not as a spec to copy.

## 2. What already exists

Confirm each of these yourself; don't take them on trust.

- `api/lib/chat/persona.ts` already accepts a `PersonaContext` with `relationshipSummary`, and places it after the owner's sections and before the api's closing rules. Nothing passes it yet.
- `PLAN.md` §5 specifies `relationships { _id, userId, avatarId, summary, interests[], openThreads[], lastSeenAt, updatedAt }` and `returnReminders { _id, userId, threadId, text, generatedAt, deliveredAt }`. `COLLECTIONS` in `api/shared/collections.ts` already names both. Neither has a document type, an index or any code.
- `web/src/styles/relationship.css` describes a relationship-level indicator: a gold animated label, a countdown line and a tooltip, with responsive rules that place it in the mobile header. None of it is rendered yet.
- `api/lib/chat/thread-ownership.ts` claims a device's threads and messages onto an account at sign-in. It knows nothing about memory.
- Consent is stored per account with a version (`CONSENT_TERMS_VERSION`), and the consent card and privacy notice currently make specific promises about what is stored and who sees it.
- There is no background job, scheduler or worker anywhere in the api. It is a single Fastify process on Bun.

## 3. Ask me these before planning

Ask them together, with a recommended option where you have one. Add anything else that would change the design, and skip anything you can decide sensibly yourself.

1. **Who gets remembered?** Only signed-in visitors, or anonymous devices too? What happens to a device's memory when that person signs in (claiming), especially if the account already has memory with the same avatar?
2. **Consent.** Should memory only be built once the current terms are accepted? Does that mean enforcing consent on the server for the first time? What must the consent card and privacy notice now say, and does `CONSENT_TERMS_VERSION` move?
3. **What goes into memory, and when is it written?** After every turn, when a conversation goes quiet, or in a periodic batch? Which model does the summarising? How much does it cost per visitor, and how is it capped?
4. **How memory is used.** Is it only the summary injected into the persona prompt, or also structured fields (interests, open threads)? How big can it get before it has to be compressed?
5. **Memory is written from what visitors say, so it is a prompt-injection path.** A visitor could say something designed to be stored and later obeyed. How is remembered text framed in the prompt, and what is refused at write time?
6. **Visitor control.** Can a visitor see what an avatar remembers about them? Can they make it forget, for one avatar or for all of them?
7. **The avatar's owner.** Owners currently cannot read visitors' conversations, and the privacy notice promises that. Does the same promise hold for memory? I plan to add an owner view and a weekly email summary later, so the answer should not block that.
8. **Relationship level.** The stylesheet has a level indicator with a countdown. What does a level mean (message count like the reference, or something else), what are the thresholds, and what does the countdown count down to?
9. **Return reminders.** What triggers generating one (time since last visit, an open thread)? How is it delivered: shown in the app when the visitor returns, or sent by email with a link like the reference? If email, which provider, and how do unsubscribing and consent work? My recommendation to weigh: in-app first, with email later alongside the owner's weekly summary.
10. **Background work.** Where does reminder generation run: a timer inside the api process, a separate worker, or a scheduled job on the host? The api will be deployed to Fly, Railway or EC2, possibly with more than one instance.

## 4. Constraints that must keep holding

- **Anonymous visitors still work**, and signing in stays optional for talking.
- **Claiming still works.** If memory exists for a device, it moves with the threads, and it merges with any existing memory for the same account and avatar instead of overwriting it.
- **Isolation.** What a visitor tells one avatar never reaches another avatar's prompt, memory or reminders. One visitor's memory never reaches another visitor.
- **The persona is built server-side from the database.** Memory joins it as data inside api-owned framing, and the api's closing rules stay the last word in the prompt.
- **A failing memory never fails a turn**, the same way a failing voice never does. If summarising or loading memory fails, the reply still arrives.
- **Voice parity.** A spoken turn (`handlers/voice/chat-completions.ts`) reads and feeds memory exactly as a typed turn does.
- **The voice marker stays a signed token** with a `voice-session` purpose, and every token keeps its purpose claim.
- **The stylesheet leads the markup.** Grep `web/src/styles/` before writing CSS. `relationship.css` is already waiting. New CSS follows the existing conventions: flat rules, one class per element, and a component named after the class it owns.
- **Real data now exists.** My `yash` avatar and my user are in the local database. Don't modify or delete them, and delete any test data you create.

## 5. How I want the code written

This project will grow, so these points matter more than speed.

- **Readable first.** Names explain themselves: functions are verb phrases, booleans read as assertions, types describe shapes. No `data`, `info`, `item`, `handleStuff` or `temp`.
- **Reuse before adding.** `readCaller`, `findAvatarWithOwner`, `buildPersonaSystemPrompt`'s `PersonaContext`, `streamReply`, `buildChatModel`, the route/schema/handler split, `SettingsPanel` and `formatAbsoluteDate` already exist. Extend them, don't duplicate them.
- **No speculative code.** Nothing "for later", no abstraction with a single user, no options nobody passes.
- **Libraries.** If a safe, well-maintained npm package makes the code simpler (a scheduler, an email SDK), say which one and why before installing it. Keep the api fast and small.
- **Framework best practices.**
  - Next.js: server components by default; typed routes (run `bunx next typegen` after adding routes).
  - React: no `useEffect` for derived state; streaming state stays in the one reducer.
  - Fastify: every route has a JSON schema including responses; errors go through `@fastify/sensible`; `lib/` never imports fastify; env is read once in `plugins/env.ts`.
- **Comment the why, never the what.** Match the density and tone already in the codebase.

## 6. How to work

1. Read (section 1), then ask me the questions (section 3) and wait for answers.
2. Propose a plan in plain language: the data model and indexes, when memory is written and read, the prompt changes, routes, UI, background work, consent and privacy wording, and how it splits into phases that each ship on their own. Wait for my go-ahead.
3. Build **one phase at a time**.
4. Verify each phase for real, not only with typecheck:
   - Run `bun run typecheck` at the repo root, and `bun run lint && bun run build` in `web/` and `admin/`.
   - Run checks against the running api and the local MongoDB, **using a stub OpenAI-compatible model that records every system prompt**. `MULTI-PERSON.md` describes how that was done. Summarising must not burn the real Bedrock key during tests.
   - At minimum, prove:
     - memory from one visitor never reaches another;
     - memory with one avatar never reaches another avatar;
     - remembered text sits inside the framing, with the closing rules still last;
     - a failing summariser does not fail a turn;
     - claiming moves and merges memory;
     - a visitor who withdraws consent or asks to forget is actually forgotten;
     - reminders go to the right visitor and avatar, and only once;
     - typed and spoken turns behave the same.
   - Do a browser pass through every new piece of UI.
   - Delete the test data you create.
5. Keep `PLAN.md`, `README.md`, `RUNBOOK.md` and `CLAUDE.md` accurate as things change.
6. At the end, write `STAGE-5.md` in the repo root explaining what you built and **why**, decision by decision: what you chose, what you rejected, what you couldn't verify, anything you changed that I didn't ask for, and what's still open. `STAGE-4.md` and `MULTI-PERSON.md` are the tone and depth I'm after.

## 7. Things that will bite

- **Never run any git command.** No status, diff, add or commit. Leave changes in the working tree and tell me what changed.
- **`mongodb` is pinned to v6** because v7 crashes on Bun at import. A test script outside `api/` must import it from `api/node_modules/mongodb/lib/index.js`.
- **Bun rewrites `.env` values.** It expands `$name` even inside single quotes, which is why `MA_ADMIN_PASSWORD_HASH` is stored base64-encoded. Any new secret containing `$` needs the same treatment. **`bun --watch` keeps the environment it started with**: restart the api after changing `.env`.
- **CORS lists methods explicitly** (`api/plugins/cors.ts`: GET, HEAD, POST, PATCH). A new `DELETE` route will be blocked at the browser preflight until it's added. Direct `curl` checks won't catch this.
- **Runtime values in `shared/` need a subpath export** (like `@measagent/shared/avatars`). The package index re-exports types only.
- **Typed routes are on** in `web/` and `admin/`. A new page isn't linkable until `bunx next typegen` runs.
- **`aria-modal` hides the page from accessibility snapshots.** Check the DOM before assuming a render bug.
- **`scripts/voice-talk.sh`** mints a voice marker through the api. If what a spoken turn needs changes, update the script too.
- **The dev Mac has no working microphone by default.** Test live voice with `bun run talk`, not the browser mic.
- **Admin sign-in is rate limited** to 5 attempts per 15 minutes, per api process.
- **The typed-chat text-to-speech token is depleted** (`STAGE-2.5.md`), so typed replies arrive as text plus a `voice_unavailable` notice. That is expected, not a bug.
