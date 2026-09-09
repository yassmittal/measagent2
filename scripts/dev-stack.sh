#!/usr/bin/env bash
#
# Bring the whole stack up in one command, in the one order that works.
#
# The order is not cosmetic. The speech-to-speech service warms up its language
# model at boot by calling POST /v1/chat/completions on this project's api — so
# if the api is not already answering, s2s retries a few times and exits. Most
# "voice is broken" reports are really "s2s was started first".
#
#   mongo ──► api ──► (wait for /health) ──┬──► web
#                                          └──► speech-to-speech
#
# Usage:
#   bun run stack              everything, including voice
#   bun run stack --no-voice   skip speech-to-speech (no mic, text chat only)
#
# The s2s service lives in a different repo; point S2S_HOME at it if yours is
# not in the default place.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT/.dev"

S2S_HOME="${S2S_HOME:-$HOME/projects/sui/sui-sentinal/speech-to-speech}"
S2S_PORT="${S2S_PORT:-8766}"
# Exported below so the api server and this script's health check can never
# disagree about where the api is supposed to be.
API_PORT="${API_PORT:-3010}"
WEB_PORT="${WEB_PORT:-3000}"

WITH_VOICE=1
[[ "${1:-}" == "--no-voice" ]] && WITH_VOICE=0

mkdir -p "$RUN_DIR"
CHILD_PIDS=()

is_listening() { lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

log()  { printf '\033[1;34m▸\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!\033[0m %s\n' "$*"; }

shutdown() {
  # Nothing was ours to start, so there is nothing to tear down.
  (( ${#CHILD_PIDS[@]} == 0 )) && return

  echo
  log 'Shutting down…'
  for pid in "${CHILD_PIDS[@]:-}"; do
    [[ -n "$pid" ]] && kill "$pid" 2>/dev/null || true
  done
  # Mongo is left running on purpose: it is cheap, holds the conversation
  # history, and `bun run db:stop` is the deliberate way to put it away.
  wait 2>/dev/null || true
  log 'Stopped. MongoDB is still up — `bun run db:stop` to stop it too.'
}
trap shutdown EXIT INT TERM

# Starts a background service and remembers its pid, unless its port is already
# taken — re-running this script must not produce two of anything. Returns
# non-zero when it left an existing service alone.
start_service() {
  local name="$1" port="$2" logfile="$3"
  shift 3

  if is_listening "$port"; then
    warn "$name already listening on :$port — leaving it alone"
    return 1
  fi

  log "Starting $name on :$port  (logs: ${logfile#"$ROOT"/})"
  "$@" >"$logfile" 2>&1 &
  CHILD_PIDS+=("$!")
}

wait_for_http() {
  local name="$1" url="$2" attempts="${3:-60}"
  for _ in $(seq 1 "$attempts"); do
    if curl -fs -o /dev/null --max-time 2 "$url"; then
      log "$name is up"
      return 0
    fi
    sleep 1
  done
  warn "$name did not come up — check its log above"
  return 1
}

# ── 1. Database ──────────────────────────────────────────────────────────────
log 'Starting MongoDB…'
"$ROOT/scripts/mongodb.sh" start

# ── 2. API ───────────────────────────────────────────────────────────────────
MA_PORT="$API_PORT" start_service 'api' "$API_PORT" "$RUN_DIR/api.log" \
  bun --filter '@measagent/api' dev || true
wait_for_http 'api' "http://127.0.0.1:$API_PORT/health"

# ── 3. Web ───────────────────────────────────────────────────────────────────
PORT="$WEB_PORT" start_service 'web' "$WEB_PORT" "$RUN_DIR/web.log" \
  bun --filter '@measagent/web' dev || true

# ── 4. Speech-to-speech ──────────────────────────────────────────────────────
# Started last, and only once the api answered, because its boot-time warmup
# call goes straight to the api.
if (( WITH_VOICE )); then
  S2S_BIN="$S2S_HOME/.venv/bin/speech-to-speech"

  if [[ ! -x "$S2S_BIN" ]]; then
    warn "No speech-to-speech at $S2S_BIN — starting without voice."
    warn 'Set S2S_HOME to its checkout, or pass --no-voice to silence this.'
  else
    # Read the shared secret from api/.env rather than repeating it here: the
    # api rejects the s2s service outright if the two ever drift apart.
    S2S_KEY="$(grep -E '^MA_S2S_API_KEY=' "$ROOT/api/.env" | cut -d= -f2- | tr -d '"')"
    if [[ -z "$S2S_KEY" ]]; then
      warn 'MA_S2S_API_KEY is empty in api/.env — s2s calls will be rejected.'
    fi

    if start_service 'speech-to-speech' "$S2S_PORT" "$RUN_DIR/s2s.log" \
      "$S2S_BIN" serve \
        --port "$S2S_PORT" \
        --stt mlx-audio-whisper \
        --mlx_audio_whisper_model_name mlx-community/whisper-large-v3-turbo-4bit \
        --tts facebookMMS \
        --facebook_mms_device cpu \
        --llm_backend chat-completions \
        --model_name measagent \
        --responses_api_base_url "http://127.0.0.1:$API_PORT/v1" \
        --responses_api_api_key "$S2S_KEY" \
        --responses_api_stream
    then
      # First boot downloads and warms the Whisper weights, which is slow;
      # after that they are cached and it is quick.
      log 'speech-to-speech is loading its models (slow on a cold cache)…'
    fi
  fi
fi

echo
log "Web    http://localhost:$WEB_PORT"
log "API    http://127.0.0.1:$API_PORT   (docs: /documentation)"
log "Mongo  mongodb://127.0.0.1:27018/measagent"
(( WITH_VOICE )) && log "Voice  ws://127.0.0.1:$S2S_PORT/v1/realtime"
echo
if (( ${#CHILD_PIDS[@]} == 0 )); then
  log 'Everything was already running — nothing left for this script to do.'
  exit 0
fi

log 'Ctrl-C to stop. Live logs:  tail -f .dev/*.log'

wait
