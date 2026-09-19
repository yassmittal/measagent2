# Stage 4 — Google sign-in, per-account conversations, consent

Built 2026-09-12. This file is the reasoning; `../ROADMAP.md` §14 is the short record
and `../../README.md` § *Signing in* is how to run it.

---

## The five decisions that shaped this

### 1. Sign-in is an offer, not a gate

`../ROADMAP.md` §11 said the only pre-chat screen would be the sign-in, and there is a
`.auth-screen` layer in the stylesheet built for exactly that. You chose the
other way, and I think it is the right one: a wall would have made the
anonymous-claiming path — the thing §5 shaped the whole data model around —
dead code, and it stops anyone trying the product without a Google account.

So anonymous chat still works exactly as it did. Signing in **claims** that
device's conversations onto the account, and the thread says so afterwards
(`ThreadClaimedNotice`) rather than moving them quietly.

The claim itself is `lib/chat/thread-ownership.ts`, and it is the five-line
`updateMany` the plan predicted. Messages are claimed before threads, because
reads are authorised against the *thread*: if the second update fails, the
conversation simply stays anonymous and the next sign-in retries it. The other
order would hand over a thread whose messages still pointed at the old owner.

### 2. A signed session token, not a sessions collection

The only thing a request needs to establish is which owner is calling, and a
signature answers that with no database read per message.

What it costs: signing out cannot be enforced server-side. A copied token stays
valid until it expires. That is why the lifetime is 30 days rather than
indefinite, and why `plugins/auth.ts` carries a comment saying it is the file
that grows a denylist if revocation ever matters. For a chat surface with no
destructive actions in it, that trade is fine; if this ever gains "delete my
account" or payments, revisit it.

### 3. `Authorization: Bearer`, not a cookie

The api is on a different origin from the web app — deliberately, since the
browser calls it directly and there is no proxy. A cookie that works across
those origins has to be `SameSite=None`, which is precisely the behaviour
browsers are in the middle of removing. A bearer header sidesteps the whole
question. The token lives in `localStorage`, and it is the **only** thing stored
there: the profile behind it is re-read from the api on every load, so an
expired token cannot leave a name on screen that no request can actually use.

### 4. The live-voice marker had to become a token

This one was not on the Stage 4 list, and I did it anyway. Two reasons.

**It was already broken by sign-in.** `useLiveVoice.ts` hardcoded
`userId: 'device:' + deviceId` into the marker. The moment someone signed in,
their thread's owner became `google:…` and every spoken turn would have failed
its ownership lookup — silently, because a failed voice turn returns a response
with no words in it.

**And the fix exposes the real problem.** The browser opens the realtime session
itself, so anything it can read in that marker it can also write. An owner id
the caller chooses is not an owner id. Before accounts that was a shrug; with
accounts it is a way to read someone else's conversation by naming it.

So: `POST /v1/voice/sessions` proves ownership once, while a real caller is on
the other end of the request, and returns a marker the api signed.
`chat-completions.ts` verifies it. A hand-written marker is now a 401 — which is
why `scripts/voice-talk.sh` changed too: it now asks the api for a marker
instead of assembling one, for both anonymous and signed-in owners.

### 5. Consent is per account, versioned, and not enforced

Consent is a statement about a person, and an anonymous browser has nobody to
attach one to — so it is a field on the user document, asked once after sign-in.

The version accepted is stored with the timestamp. Without it, a stored
acceptance would be a claim that someone agreed to whatever the wording says
*today*. Bumping `CONSENT_TERMS_VERSION` makes every stored acceptance read as
unaccepted and re-asks everyone. That rule lives in one place
(`lib/auth/user-profile.ts`) so no screen can treat a stale consent as valid
while another does not.

It is **not** enforced server-side: a signed-in person who has not accepted can
still send a message. Refusing would be theatre — nothing yet does anything with
what the consent covers (that is Stage 5's memory), and a hard block would add a
failure mode for no gain. Worth revisiting when memory lands.

---

## What is where

**api**

```
plugins/auth.ts                    registers the session-token signer
services/google-identity.ts        verifies Google's credential
lib/auth/owner-id.ts               device:… / google:… — the prefix scheme
lib/auth/user-profile.ts           stored user → what the browser may see
lib/chat/thread-ownership.ts       the claim
shared/identity.ts                 readCaller — the only place an owner is decided
handlers/auth/*.ts                 sign in, read the session
handlers/consent/*.ts              read, accept
handlers/chats/list-threads.ts     GET /v1/chats
handlers/voice/open-voice-session.ts   mints the signed marker
routes/v1/{auth,consent,voice}/    schema + delegate, as everything else here
```

**web**

```
state/SessionProvider.tsx          who is here; identityKey is the change signal
hooks/useGoogleSignInButton.ts     loads GIS on demand, renders Google's button
lib/auth/session-storage.ts        the token, and nothing else
lib/auth-client.ts                 sign in, read session, accept consent
lib/initial-thread.ts              which conversation to open, for this caller
lib/voice/session-client.ts        fetch the routing marker
components/ProfileMenu.tsx         the control in the corner and what it opens
components/SettingsPanel.tsx       the modal shell both bodies share
components/{SignInPrompt,AccountSettings}.tsx    those two bodies
components/ConsentCard.tsx         shown only when it is owed
components/ThreadClaimedNotice.tsx  says the conversations moved
components/LegalPage.tsx + app/{privacy,terms}   the two legal pages
```

Every one of these renders into CSS that was already in the stylesheet. The one
exception is nothing — no new CSS was written for Stage 4. `.auth-screen`,
`.profile-*`, `.settings-*`, `.consent-*`, `.migration-notice` and `.legal-*`
were all waiting, which is the stylesheet-leads-the-markup rule doing its job.

Two structural notes on the frontend:

- **`SessionProvider` wraps `ConversationProvider`**, because signing in changes
  whose conversation is on screen. `identityKey` is null until the session is
  known — a request made before that would go out as the wrong caller — and the
  reducer gained one action, `identity_changed`, which resets to the initial
  state. Nothing on screen survives a change of owner.
- **The signed-out UI is one step, the signed-in UI is two.** Signed out, the
  corner button opens the sign-in panel directly; a menu with one item in it is
  a door in front of a door. Signed in there is more than one thing to do, so
  the menu earns its place.

---

## What I verified, and what I could not

**23 automated checks** against the running api and the real database: anonymous
chat unchanged, cross-device isolation, 401s across the signed-out surface, a
forged bearer token, claiming and ownership after claiming (the bare device then
gets 404, another account gets 404), consent recorded and read back with its
version, voice markers granted to an owner and refused to a stranger, the
unmarked warmup still answered, and a hand-written marker refused.

**In a browser:** the sign-in panel with its honest "not switched on yet" state,
the consent card, accepting it, the profile menu with name and email, the
settings panel, and sign-out returning the app to anonymous with the token and
conversation pointer cleared. No console errors. `bun run talk` was exercised
with a stub in place of the speech service, for both an anonymous and a
signed-in owner.

**Not verified: a real Google credential**, because that needs the client id
from step 1. Everything up to Google's own check is exercised — a credential
Google did not issue is refused with a 401 and a logged warning, not a crash.
When you have the client id, the thing to try is: chat anonymously, sign in,
and confirm the conversation is still there with the notice above it.

`bun run typecheck`, `bun run lint` and `bun run build` are all clean in every
workspace. Test data I created was deleted afterwards; your 10 conversations are
untouched.

---

## Things I changed that you did not ask for

- **`scripts/voice-talk.sh`** — it hand-wrote the old marker, so the new api
  would have refused it. It now asks the api for one.
- **`../../README.md` API table** listed `POST /v1/chats/:chatId/turns/:turnId/tts`,
  which does not exist in the code. Removed. `../ROADMAP.md` §13 makes the same claim;
  `stage-2.5-dropped.md` records it rather than quietly rewriting history.
- **`stage-2.5-dropped.md`** trimmed to the four findings worth keeping.

## Still open

- **The "persona is Yash, and only Yash" line** in `../../CLAUDE.md` and `../ROADMAP.md`
  §3.4/§10 contradicts the multi-person direction you set. I have not touched
  those lines, because changing them is a product decision rather than a
  documentation fix. Nothing in Stage 4 hardcodes a person — the copy all reads
  from `lib/persona.ts` — so whenever the persona becomes per-user data, none of
  this needs revisiting.
- **No self-service deletion.** The privacy notice says deletion is by email and
  calls that a gap rather than dressing it up. It is the obvious next small
  piece of account work.
- **Nothing rate-limits sign-in.** Google's verification is the expensive call
  and it is one round trip per attempt. Worth a look before this is public.
