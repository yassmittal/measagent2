#!/usr/bin/env bash
#
# Talk to the avatar from the terminal, against a real conversation.
#
# The route marker has to name a thread that already exists, owned by the device
# that created it. Typing one by hand is the usual way to get
# "No thread <id> for <user>" back from the api — and the failure is quiet from
# the client's side: s2s still reports `<response completed>`, just with no
# words in it. So this reads a real thread straight out of Mongo.
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
    mongoexport --uri "$MONGO_URI" --collection threads --quiet \
      --sort '{lastMessageAt:-1}' --limit 1
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
log 'Talk when you see "Connected." — Ctrl-C to stop.'
echo

exec "$S2S_BIN" talk \
  --url "$S2S_URL" \
  --instructions "ma-route: $(python3 -c '
import json, sys, uuid
print(json.dumps({
    "threadId": sys.argv[1],
    "userId": sys.argv[2],
    "sessionId": str(uuid.uuid4()),
}))
' "$THREAD_ID" "$USER_ID")"
