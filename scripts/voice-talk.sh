#!/usr/bin/env bash
#
# Talk to the avatar from the terminal, against a real conversation.
#
# The route marker is a token the api signs, and it names a thread the caller
# has proved it owns — a hand-written one is refused outright. So this finds a
# real conversation in Mongo, asks the api for a marker as that conversation's
# owner, and hands it to s2s.
#
# The failure it exists to prevent is a quiet one: with a bad marker s2s still
# reports `<response completed>`, just with no words in it.
#
# Usage:
#   bun run talk              # newest conversation
#   bun run talk <threadId>   # a specific one

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

S2S_HOME="${S2S_HOME:-$HOME/projects/sui/sui-sentinal/speech-to-speech}"
S2S_BIN="$S2S_HOME/.venv/bin/speech-to-speech"
S2S_URL="${S2S_URL:-ws://127.0.0.1:8766/v1/realtime}"
MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27018/measagent}"
API_URL="${API_URL:-http://127.0.0.1:3010}"

die() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }
log() { printf '\033[1;34m▸\033[0m %s\n' "$*"; }

[[ -x "$S2S_BIN" ]] || die "No speech-to-speech at $S2S_BIN (set S2S_HOME)"
command -v mongoexport >/dev/null || die 'mongoexport not found (mongodb-database-tools)'

REQUESTED_THREAD="${1:-}"

# Pull the thread and its owner together: the api matches on both, so taking the
# userId from anywhere else just moves the error.
read -r THREAD_ID USER_ID <<<"$(
  if [[ -n "$REQUESTED_THREAD" ]]; then
    mongoexport --uri "$MONGO_URI" --collection threads --quiet \
      --query "{\"_id\":\"$REQUESTED_THREAD\"}" --limit 1
  else
    # Threads from before avatars existed have no avatarId, and the api cannot
    # build a persona for them — so the newest one that has an avatar.
    mongoexport --uri "$MONGO_URI" --collection threads --quiet \
      --query '{"avatarId":{"$exists":true}}' --sort '{lastMessageAt:-1}' --limit 1
  fi | python3 -c '
import json, sys
line = sys.stdin.readline().strip()
if not line:
    sys.exit(1)
thread = json.loads(line)
print(thread["_id"], thread["userId"])
'
)" || die 'No such conversation. Send one message in the web app first.'

log "Thread $THREAD_ID"
log "Owner  $USER_ID"

# Identify as the thread's owner so the api will mint a marker for it. An
# anonymous owner is just a header; a signed-in one needs the same session token
# a real sign-in would have issued, signed here with the api's own secret.
if [[ "$USER_ID" == device:* ]]; then
  IDENTITY_HEADER="x-device-id: ${USER_ID#device:}"
else
  SESSION_SECRET="$(grep -E '^MA_SESSION_SECRET=' "$ROOT/api/.env" | cut -d= -f2- | tr -d '"')"
  [[ -n "$SESSION_SECRET" ]] || die 'MA_SESSION_SECRET is empty in api/.env, so no session token can be signed'
  IDENTITY_HEADER="authorization: Bearer $(python3 -c '
import base64, hashlib, hmac, json, sys, time

def encode(raw):
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()

def compact(claims):
    return encode(json.dumps(claims, separators=(",", ":")).encode())

now = int(time.time())
signing_input = compact({"alg": "HS256", "typ": "JWT"}) + "." + compact(
    {"sub": sys.argv[1], "purpose": "session", "iat": now, "exp": now + 3600}
)
signature = hmac.new(sys.argv[2].encode(), signing_input.encode(), hashlib.sha256).digest()
print(signing_input + "." + encode(signature))
' "$USER_ID" "$SESSION_SECRET")"
fi

ROUTE_MARKER="$(
  curl -fsS -X POST "$API_URL/v1/voice/sessions" \
    -H 'content-type: application/json' -H "$IDENTITY_HEADER" \
    -d "{\"chatId\":\"$THREAD_ID\"}" |
  python3 -c 'import json, sys; print(json.load(sys.stdin)["routeMarker"])'
)" || die "The api would not mint a marker for that conversation. Is it running on $API_URL?"

log 'Talk when you see "Connected." — Ctrl-C to stop.'
echo

exec "$S2S_BIN" talk --url "$S2S_URL" --instructions "$ROUTE_MARKER"
