# RUNBOOK — running meAsAgent end to end

How to start the whole thing, and how a conversation actually travels through it.
`../README.md` is setup and architecture; `../CLAUDE.md` is conventions; this file is
"I have not touched this in three weeks, how do I run it and explain it".

---

## Run it

```bash
bun run stack
```

That is the whole thing. It starts MongoDB, the api, the web app and the
speech-to-speech service **in the right order**, waits for each one, and tears
down what it started on `Ctrl-C`.

```bash
bun run stack --no-voice   # text chat only; skips speech-to-speech
bun run db:stop            # stack leaves Mongo running on purpose
tail -f .dev/*.log         # live logs for every service
```

If the s2s checkout is somewhere else:

```bash
S2S_HOME=~/path/to/speech-to-speech bun run stack
```

First voice boot is slow — it downloads and warms the Whisper weights. After
that they are cached.

---

## What is running

Four processes. Only the first three are this repo.

| Process | Port | What it is |
|---|---|---|
| MongoDB | 27018 | project-local, data in `.mongo/` — not your machine-wide mongod |
| api | 3010 | Fastify on Bun: persona, history, persistence, the model |
| web | 3000 | Next.js chat UI |
| speech-to-speech | 8766 | separate repo: microphone, VAD, Whisper STT, TTS |
| admin *(optional)* | 3020 | `bun run dev:admin` — not started by `stack`; only needed to review avatars |

### Order matters, and this is the one thing that bites

**The api must be answering before speech-to-speech starts.** On boot, s2s warms
up its language-model backend by POSTing to `http://127.0.0.1:3010/v1/chat/completions`.
If nothing answers, it retries six times and exits with:

```
Warming up ChatCompletionsApiModelHandler
Retrying request to /chat/completions in 0.49 seconds
...
openai.APIConnectionError: Connection error.
```

That traceback means *"the api was not up"*, nothing more. `bun run stack`
exists so the order is not something you have to remember.

```
mongo ──► api ──► (wait for /health) ──┬──► web
                                       └──► speech-to-speech
```

---

## Flow 1 — a typed message

```
browser ──POST /v1/chats (SSE)──► api ──► Bedrock
                                   │
                                   ├─► MongoDB   (thread + both messages)
                                   └─► Kokoro/HF (spoken reply)
```

1. The browser POSTs to `/v1/chats` with the text, the `avatarId` of the page it
   is on, and who it is: a session token if signed in, an `x-device-id` header if
   not.
2. The api loads that avatar and its owner (a paused avatar is a 409), finds the
   thread by caller **and** avatar or creates one, then writes **both** messages up front:
   the user's, and an empty assistant message with status `resolving`. Writing
   the reply's id before the model has said anything is what lets the UI keep a
   half-finished reply if the turn is stopped.
3. It builds the persona system prompt from the avatar document
   (`lib/chat/persona.ts` — the owner's notes in labelled sections, then what
   this avatar remembers about this visitor inside `<visitor_memory>`, the api's
   rules last), loads recent history from Mongo, and streams from Bedrock.
   Memory is read only for a signed-in visitor who has accepted the terms, and
   if reading it fails the turn goes ahead without it.
4. The response is **Server-Sent Events**, but read with a plain `fetch` reader,
   not `EventSource` — the request needs a POST body and a custom header, and
   `EventSource` can send neither. Event shapes live in `shared/src/stream.ts`:

   ```
   turn_started → delta → delta → … → turn_completed
                    ↑
              audio_delta spans interleaved, closed by audio_done
   ```
5. Sentences are sent to text-to-speech as they complete, so the avatar starts
   speaking before the answer has finished generating. **A failing voice never
   fails a turn** — every failure path downgrades to `voice_unavailable` and the
   text still arrives.
6. Once the reply is stored, the api notes the turn for memory
   (`handlers/chats/turn-memory.ts`): the visitor's `relationship` with this
   avatar is marked due for summarising once the conversation goes quiet, and any
   reminder scheduled for them is cancelled, because they are here.
7. In the browser, every one of those events lands in a single reducer
   (`state/conversation-reducer.ts`). One reducer, not several `useState`s, so
   nothing can disagree about the same turn.

---

## Flow 2 — a spoken message

This is a **different pipeline**, and the important part is who owns what:
**s2s owns the audio, the api owns the conversation.**

```
mic ──ws :8766/v1/realtime──► speech-to-speech
                                   │  VAD (silero + smart-turn)
                                   │  STT (mlx-whisper, local)
                                   ▼
                              transcript
                                   │
              POST /v1/chat/completions (Bearer MA_S2S_API_KEY)
                                   ▼
                                  api ──► Bedrock
                                   │  ├─► MongoDB (same thread as typed chat)
                                   ▼
                            reply text
                                   │
                                   ▼
                        TTS ──audio over ws──► speaker
```

The api is dressed up as an **OpenAI-compatible chat-completions endpoint**, so
s2s can treat it as an ordinary language model. That is the whole trick: s2s
needs no knowledge of threads, personas or Mongo.

### The `ma-route:` marker

s2s has one process-global backend URL and no per-session routing channel — so
how does the api know *which conversation* a request belongs to?

The client smuggles it through the realtime session's `instructions` field:

```
ma-route: <a token the api signed>
```

It arrives as a line in a system message. `lib/voice/route-marker.ts` pulls the
token out; `handlers/voice/chat-completions.ts` verifies it and loads the thread
it names.

**The marker is a signed token, not readable JSON, and that is the point.** The
browser opens the realtime session itself, so anything it could read in that
string it could also write — and an owner id the caller chooses is not an owner
id. Ownership is proved once, at `POST /v1/voice/sessions`, and the marker only
says that it was proved. A hand-written marker now gets a 401.

Two consequences worth knowing:

- **Nothing else in the incoming `messages` is trusted.** The persona prompt is
  rebuilt server-side every turn from the avatar the thread belongs to, re-read
  each turn so pausing or editing an avatar takes effect mid-session, and history is read from Mongo — s2s only
  supplies the latest transcript. So a spoken turn and a typed turn land in the
  same thread with the same persona — and the same memory, read and recorded by
  the same `turn-memory.ts` the typed path uses.
- **A request with no marker is the warmup.** The handler answers
  `"Hello! I'm ready."` without touching the database. That is exactly the call
  that fails when the api is down.

The thread must already exist — the marker cannot be minted for a conversation
that is not there, and the handler looks it up again by thread and owner. It must
also belong to an avatar: conversations from before avatars existed have no
`avatarId`, and `bun run talk` skips them. So
send one message before talking. Markers expire after two hours
(`VOICE_SESSION_LIFETIME`), which is a voice session's length, not a sign-in's.

---

## Flow 3 — holding the button in the browser

Same pipeline as Flow 2. The browser is just another realtime client, so the
words land in the same thread as typed ones.

```
hold  ──► session opens once (mic permission + handshake), microphone ON
speak ──► partial transcripts ──► ghost text in the composer input
release──► microphone stays ON for a 1.2s tail  ← the service needs this
      ──► service closes the turn, transcribes, calls the api, speaks the reply
      ──► reply audio plays; its transcript streams into the thread
```

**Why the socket is opened once and kept.** Opening it costs a microphone
permission prompt and a service handshake. Paying that on every press would make
the second press as slow as the first, so `useLiveVoice` connects on the first
hold and afterwards only toggles whether the microphone's audio is *sent*
(`LiveVoiceClient.setMicrophoneEnabled`).

**Why releasing does not cut the audio dead.** The service decides for itself
when a turn has ended, by hearing the silence that follows speech. If the audio
stopped the instant the button came up, it would sit waiting for an ending that
never arrives. So the microphone stays open for `TURN_TAIL_MS` (1.2s) after
release — that silence *is* the end-of-turn signal. The microphone also closes
early the moment the avatar starts speaking, so it never hears itself.

**Where the words go.**

| Event from the service | What the UI does |
|---|---|
| user transcript, partial | ghost text in the composer input |
| user transcript, final | becomes a real message bubble in the thread |
| assistant transcript, partial | streams into the live turn, like a typed reply |
| assistant transcript, final | re-reads the thread from the api |

That last step matters: a spoken turn is written to MongoDB by the **api**, on
behalf of the voice service — not by the browser. So the browser shows the words
optimistically as they arrive, then re-reads the thread to replace them with
what was actually stored. Reload the page and a spoken conversation is all there.

The Stop button does not appear on a spoken turn. Stopping a typed turn means
aborting an HTTP request this browser owns; a spoken turn belongs to the voice
service, so there is nothing here to abort.

---

## Flow 4 — between conversations

Nothing is summarised during a turn. A timer inside the api
(`plugins/background-jobs.ts`, every `MA_JOB_INTERVAL_SECONDS`) runs two passes,
and each piece of work is claimed with a lease on the `relationships` document
first, so any number of api instances can run them without doing anything twice.

```
memory pass    relationships where memoryDueAt has passed (the conversation went quiet)
                 ├─ visitor has not accepted the terms → nothing, cleared
                 ├─ daily budget spent (20 per visitor) → tried again tomorrow
                 └─ unread messages → memory writer (MEMORY_MODEL) → memory stored,
                    messages marked memorizedAt; open threads schedule a reminder
reminder pass  relationships where reminderDueAt has passed (away 24h with open threads)
                 ├─ came back since, or avatar paused → rescheduled or cleared
                 └─ the avatar writes one follow-up in its own persona → returnReminders
```

The visitor's next visit to that avatar calls `POST /v1/reminders/return`, which
claims the reminder atomically and adds it to their latest conversation as a
message tagged "While you were away". A reminder not delivered within 14 days
lapses.

A failing writer stores nothing and marks nothing read; the relationship is tried
again after another quiet period. The failure is only in the log:

```
Memory pass failed for a relationship; it will be retried
Return reminder failed for a relationship; it will be retried
```

A third pass runs after those two, **only when `MA_RESEND_API_KEY` and
`MA_EMAIL_FROM` are set**:

```
weekly summary pass
  open         every avatar whose owner has the email on and accepted the terms:
               Monday 09:00 in their zone has passed, less than 24h ago → weeklySummaries doc
  summarizing  the week's visitors (findAvatarVisitors, busiest 20)
                 ├─ nobody talked → skipped
                 └─ one MEMORY_MODEL call per visitor, stored as each lands
  sending      re-check the owner still wants it → Resend (idempotency key = doc id)
                 └─ sent: per-visitor text dropped, "needs you" flags kept
```

To see where a week stands, look at `weeklySummaries` in Compass: `status`,
`attempts`, `nextAttemptAt` and `lastError`. The log says:

```
Weekly summary failed; it will be retried
Weekly summary failed for good
```

A week the api missed entirely (down for all of the 24 hours after it came due)
is skipped, not sent late.

---

## Testing voice without the browser

```bash
bun run talk              # newest conversation
bun run talk <threadId>   # a specific one
```

This finds a real conversation in Mongo, asks the api for a marker as that
conversation's owner, and hands it to s2s. **Do not hand-write the marker** —
the api will refuse it. And when a marker is wrong, the failure is silent from
the client's side: you get a response with no words in it:

```
USER: Hello, hello.
ASSISTANT: <response started>
ASSISTANT: <response completed>      ← no text, no <audio done>
```

The reason is only in `.dev/api.log` — either the marker did not verify:

```
Rejected a live voice route marker
```

or it verified but names a conversation that owner does not have:

```
Error: No thread <id> for <owner>
```

A working session has text and an `<audio done>` between those two lines:

```
Connected.
EVENT: session.updated
USER: Hello.
ASSISTANT: <response started>
ASSISTANT: Hey. What's on your mind?
ASSISTANT: <audio done>
ASSISTANT: <response completed>
```

Send one message to an avatar in the web app first, or there is no thread to talk into.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| s2s exits at boot, `APIConnectionError` | api was not running first — use `bun run stack` |
| s2s answers but nothing is saved | `ma-route:` marker missing or malformed — the api treated it as a warmup |
| api returns 401 to s2s | `MA_S2S_API_KEY` in `api/.env` ≠ `--responses_api_api_key` |
| `Rejected a live voice route marker` | hand-written or expired marker — use `bun run talk`, which gets a real one from the api |
| `No thread <id> for <owner>` | the marker verified but the conversation moved owner, or was merged into the account's conversation by a sign-in — open a new voice session |
| After signing in, an older conversation seems to be missing | it should not happen since claiming merges; conversations split before that fix stay split in the database (one per row in `threads` for the same `userId` + `avatarId`) |
| `Avatar <id> is not taking conversations` | the thread's avatar is paused, or the thread predates avatars |
| `/` shows no avatars | nothing is listed yet — approve one in the admin portal |
| An avatar page is a 404 | no avatar has that handle; handles are lowercase |
| Sending a message returns 409 | the avatar is paused |
| Admin sign-in says it is not configured | `MA_ADMIN_USERNAME` or `MA_ADMIN_PASSWORD_HASH` is empty in `api/.env` — or the api has not been restarted since you set them; `bun --watch` keeps the old environment |
| Admin sign-in says it is misconfigured | `MA_ADMIN_PASSWORD_HASH` is not the base64 value `bun run admin:hash-password` prints (a raw `$argon2…` hash is mangled by Bun's `.env` loading) |
| Admin sign-in says "too many attempts" | 5 tries in 15 minutes per address; restarting the api clears it locally |
| `<response completed>` with no text | same thing: bad marker. Check `.dev/api.log` |
| Reply arrives as text, no audio | `HF_TOKEN` missing or the TTS provider failed — by design the turn still succeeds |
| Web loads but every send fails | api down, or `NEXT_PUBLIC_API_BASE_URL` points somewhere else |
| The sign-in panel says it is not switched on | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is empty in `web/.env.local` |
| Sign-in returns 503 | `MA_GOOGLE_CLIENT_ID` or `MA_SESSION_SECRET` is empty in `api/.env` |
| Everyone is signed out at once | `MA_SESSION_SECRET` changed — every token signed with the old one is now invalid |
| An avatar never remembers anything | the visitor is anonymous or has not accepted the terms; or the conversation has not been quiet for `MA_MEMORY_QUIET_SECONDS` yet; or `BEDROCK_API_KEY` is empty, which stops the background passes entirely |
| `Memory pass failed for a relationship` | the memory writer errored or returned something other than the JSON memory — nothing was stored, it retries after a quiet period |
| `Memory budget spent for today` | that visitor has used 20 summaries today (`MEMORY_DAILY_SUMMARY_LIMIT`); it resumes after midnight UTC |
| No level beside the avatar's name | signed out, or the terms are not accepted — the level only shows while memory is on |
| Forgetting fails in the browser but works with `curl` | `DELETE` missing from the CORS methods in `api/plugins/cors.ts` |

`bun run stack` reads `MA_S2S_API_KEY` out of `api/.env` and passes it to s2s, so
the two cannot drift apart — that is why the key is not written in the command.
