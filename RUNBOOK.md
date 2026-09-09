# RUNBOOK — running meAsAgent end to end

How to start the whole thing, and how a conversation actually travels through it.
`README.md` is setup and architecture; `CLAUDE.md` is conventions; this file is
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

1. The browser POSTs to `/v1/chats` with the text and an `x-device-id` header.
   That header is who you are — there are no accounts yet, so a device id owns
   the thread.
2. The api finds or creates the thread, then writes **both** messages up front:
   the user's, and an empty assistant message with status `resolving`. Writing
   the reply's id before the model has said anything is what lets the UI keep a
   half-finished reply if the turn is stopped.
3. It rebuilds the persona system prompt from `lib/chat/persona.ts`, loads recent
   history from Mongo, and streams from Bedrock.
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
6. In the browser, every one of those events lands in a single reducer
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
ma-route: {"threadId":"…","userId":"device:…","sessionId":"…"}
```

It arrives as a line in a system message. `lib/voice/route-marker.ts` parses it;
`handlers/voice/chat-completions.ts` uses it to load the right thread.

Two consequences worth knowing:

- **Nothing else in the incoming `messages` is trusted.** The persona prompt is
  rebuilt server-side every turn and history is read from Mongo — s2s only
  supplies the latest transcript. So a spoken turn and a typed turn land in the
  same thread with the same persona.
- **A request with no marker is the warmup.** The handler answers
  `"Hello! I'm ready."` without touching the database. That is exactly the call
  that fails when the api is down.

The thread must already exist — the handler looks it up by `threadId` + `userId`
and errors if it is missing. So send one message before talking.

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

## Testing voice without the browser

```bash
bun run talk              # newest conversation
bun run talk <threadId>   # a specific one
```

This reads a real thread and its owner out of Mongo and builds the `ma-route:`
marker for you. **Do not hand-write the marker.** If it names a thread that does
not exist, the failure is silent from the client's side — you get a response
with no words in it:

```
USER: Hello, hello.
ASSISTANT: <response started>
ASSISTANT: <response completed>      ← no text, no <audio done>
```

The reason is only in `.dev/api.log`:

```
Error: No thread <id> for device:<id>
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

Send one message in the web app first, or there is no thread to talk into.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| s2s exits at boot, `APIConnectionError` | api was not running first — use `bun run stack` |
| s2s answers but nothing is saved | `ma-route:` marker missing or malformed — the api treated it as a warmup |
| api returns 401 to s2s | `MA_S2S_API_KEY` in `api/.env` ≠ `--responses_api_api_key` |
| `No thread <id> for device:<id>` | hand-written marker — use `bun run talk`, which reads a real one from Mongo |
| `<response completed>` with no text | same thing: bad marker. Check `.dev/api.log` |
| Reply arrives as text, no audio | `HF_TOKEN` missing or the TTS provider failed — by design the turn still succeeds |
| Web loads but every send fails | api down, or `NEXT_PUBLIC_API_BASE_URL` points somewhere else |

`bun run stack` reads `MA_S2S_API_KEY` out of `api/.env` and passes it to s2s, so
the two cannot drift apart — that is why the key is not written in the command.
