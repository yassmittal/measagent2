# Stage 2.5 — investigated, then dropped

Written 2026-09-12. Kept so nobody re-derives this.

`../ROADMAP.md` §6.1 planned a Stage 2.5: swap Kokoro for ElevenLabs, stream synthesis
into the browser, and eventually clone Yash's voice. **It is not being built.**
Voice cloning turned out not to be a requirement, and cloning was the only thing
that justified a paid provider — what remained was streaming latency and a
replay button, which do not add up to a stage.

Four things were found on the way, and they are the reason this file exists.

### 1. Typed chat is mute, and the token is genuinely dead

Not a stale doc. Called directly on 2026-09-12:

```
FAILED: You have depleted your monthly included credits.
```

So every typed reply emits `voice_unavailable` and arrives as text only. The
pipeline behind it is built and tested and is waiting on nothing but a working
token.

Three ways to close it, cheapest first: **top up HuggingFace** (zero code);
**do nothing** (voice mode is the flow in use, and the downgrade is graceful);
**run a local TTS inside the api** (free, but real work, and it would tie the
api to one Mac, which kills deploying it to Fly or Railway later).

### 2. There are two voices, and neither was chosen

Hold-to-speak never touches our api's TTS. `scripts/dev-stack.sh` starts the
speech-to-speech service with `--tts facebookMMS`, which does its own synthesis
locally. So the avatar sounds like one thing when you type and another when you
speak.

That service's own boot log recommends `qwen3`, `pocket` or `kokoro` on macOS,
and all of those handlers exist in its repo. Changing that one flag is the
cheapest available improvement to the voice you actually hear. It has **no**
ElevenLabs handler, so matching the two modes through ElevenLabs would have
meant writing one in a second repo.

### 3. The replay endpoint in `../ROADMAP.md` §13 does not exist

`POST /v1/chats/:chatId/turns/:turnId/tts` is described there as shipped. It is
not in `api/routes/v1/chats/index.ts` — only send and load are. Its CSS is
still in place (`.msg-action-replay.is-playing`, `.is-loading`), so whenever a
replay button is wanted, the styling is waiting and only the route is missing.

### 4. The streaming player already exists

`web/public/worklets/audio-playback.js` plays queued PCM frames and is already
used by live voice. Any future streaming TTS should ask its provider for raw
PCM and feed that worklet, rather than the `MediaSource` route `../ROADMAP.md` §6.1
assumed — no decoder, no `MediaSource`, and it works in Safari.
