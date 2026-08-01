#!/usr/bin/env sh
#
# import.sh - Import a SailPoint Identity Security Cloud (ISC) SP-Config bundle.
#
# Obtains an OAuth2 access token via the client-credentials grant, packages the
# config/ object JSON into an SP-Config bundle, and imports it into the target
# tenant via the ISC v3 REST API (/v3/sp-config/import) -- or, when available,
# via the SailPoint CLI (`sail spconfig import`).
#
# This is a TEMPLATE. Review it before running against a real tenant. Imports can
# CREATE and OVERWRITE tenant objects. Always run --dry-run first.
#
# Required environment variables (no real secrets live in this repo):
#   SAIL_BASE_URL      e.g. https://TENANT.api.identitynow.com
#   SAIL_CLIENT_ID     OAuth client id (PAT id or client-credentials client)
#   SAIL_CLIENT_SECRET OAuth client secret
#
# Usage:
#   ./import.sh --dry-run          # preview only: validate + request preview, no changes
#   ./import.sh                     # perform the import
#   CONFIG_DIR=../config ./import.sh --dry-run
#
set -eu

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CONFIG_DIR="${CONFIG_DIR:-$SCRIPT_DIR/../config}"
WORK_DIR="${WORK_DIR:-$(mktemp -d)}"
BUNDLE_ZIP="$WORK_DIR/spconfig-bundle.zip"
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    --dry-run|-n) DRY_RUN=1 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Unknown argument: $arg" >&2; exit 2 ;;
  esac
done

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------
: "${SAIL_BASE_URL:?Set SAIL_BASE_URL, e.g. https://TENANT.api.identitynow.com}"
: "${SAIL_CLIENT_ID:?Set SAIL_CLIENT_ID}"
: "${SAIL_CLIENT_SECRET:?Set SAIL_CLIENT_SECRET}"

command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 1; }

# Strip any trailing slash from the base URL.
BASE_URL=$(printf '%s' "$SAIL_BASE_URL" | sed 's:/*$::')

log() { printf '[import] %s\n' "$*" >&2; }

cleanup() { [ -n "${WORK_DIR:-}" ] && rm -rf "$WORK_DIR"; }
trap cleanup EXIT

# ---------------------------------------------------------------------------
# 1. Validate all config JSON parses
# ---------------------------------------------------------------------------
log "Validating JSON under $CONFIG_DIR ..."
found=0
for f in $(find "$CONFIG_DIR" -name '*.json' 2>/dev/null); do
  found=1
  if command -v node >/dev/null 2>&1; then
    node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$f" \
      || { echo "Invalid JSON: $f" >&2; exit 1; }
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$f" \
      || { echo "Invalid JSON: $f" >&2; exit 1; }
  fi
done
[ "$found" -eq 1 ] || { echo "No JSON found under $CONFIG_DIR" >&2; exit 1; }
log "JSON validation passed."

# ---------------------------------------------------------------------------
# 2. Obtain an OAuth2 access token (client-credentials grant)
#    POST {BASE_URL}/oauth/token
# ---------------------------------------------------------------------------
log "Requesting OAuth token from $BASE_URL/oauth/token ..."
TOKEN_RESPONSE=$(curl -sS -X POST "$BASE_URL/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=$SAIL_CLIENT_ID" \
  -d "client_secret=$SAIL_CLIENT_SECRET")

# Extract access_token without requiring jq.
ACCESS_TOKEN=$(printf '%s' "$TOKEN_RESPONSE" \
  | sed -n 's/.*"access_token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Failed to obtain access token. Response:" >&2
  printf '%s\n' "$TOKEN_RESPONSE" >&2
  exit 1
fi
log "Access token obtained."

AUTH_HEADER="Authorization: Bearer $ACCESS_TOKEN"

# ---------------------------------------------------------------------------
# 3. Prefer the SailPoint CLI if present (`sail spconfig import`)
# ---------------------------------------------------------------------------
if command -v sail >/dev/null 2>&1; then
  log "SailPoint CLI (sail) detected."
  if [ "$DRY_RUN" -eq 1 ]; then
    log "DRY RUN: would run 'sail spconfig import' against $BASE_URL"
    log "         (use per-object files under $CONFIG_DIR)"
    exit 0
  fi
  # The CLI reads its own auth config; see README for `sail configure`.
  sail spconfig import --dir "$CONFIG_DIR"
  exit $?
fi

# ---------------------------------------------------------------------------
# 4. Fallback: raw ISC v3 REST API
#    SP-Config import expects a ZIP bundle of exported objects.
# ---------------------------------------------------------------------------
log "SailPoint CLI not found; using ISC v3 REST API."
log "Building SP-Config bundle at $BUNDLE_ZIP ..."
( cd "$CONFIG_DIR" && zip -q -r "$BUNDLE_ZIP" . -i '*.json' )

if [ "$DRY_RUN" -eq 1 ]; then
  # options.dryRun=true asks ISC to compute and return what WOULD change,
  # without persisting anything.
  log "DRY RUN: POST $BASE_URL/v3/sp-config/import with options.dryRun=true"
  HTTP_CODE=$(curl -sS -o "$WORK_DIR/preview.json" -w '%{http_code}' \
    -X POST "$BASE_URL/v3/sp-config/import" \
    -H "$AUTH_HEADER" \
    -F 'options={"dryRun":true};type=application/json' \
    -F "data=@$BUNDLE_ZIP;type=application/zip")
  log "HTTP $HTTP_CODE. Preview job response:"
  cat "$WORK_DIR/preview.json" >&2 || true
  echo >&2
  log "Poll GET $BASE_URL/v3/sp-config/import/status/{id} for the async result."
  exit 0
fi

log "Importing SP-Config bundle: POST $BASE_URL/v3/sp-config/import ..."
HTTP_CODE=$(curl -sS -o "$WORK_DIR/import.json" -w '%{http_code}' \
  -X POST "$BASE_URL/v3/sp-config/import" \
  -H "$AUTH_HEADER" \
  -F 'options={"excludeTypes":[],"includeTypes":[]};type=application/json' \
  -F "data=@$BUNDLE_ZIP;type=application/zip")

log "HTTP $HTTP_CODE. Import job response:"
cat "$WORK_DIR/import.json" >&2 || true
echo >&2

case "$HTTP_CODE" in
  2*) log "Import job accepted. Poll GET $BASE_URL/v3/sp-config/import/status/{id} until COMPLETE." ;;
  *)  echo "Import request failed (HTTP $HTTP_CODE)." >&2; exit 1 ;;
esac
