#!/usr/bin/env bash
# Quick curl smoke � sustally must be running on :3001 (fn optional on :3000).
set -euo pipefail

SUSTALLY="${SUSTALLY_BASE_URL:-http://127.0.0.1:3001}"
FN="${FN_BASE_URL:-http://127.0.0.1:3000}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SAMPLE="${ROOT}/sustally/samples/bharat-cement-FY2026.json"

echo "== Sustally API (${SUSTALLY}) =="

curl -sf "${SUSTALLY}/api/v1/factors?sector=cement" | head -c 120
echo ""
echo "OK factors"

curl -sf -X POST "${SUSTALLY}/api/v1/calculations/cement/calculate" \
  -H "Content-Type: application/json" \
  -d @"${SAMPLE}" | head -c 120
echo ""
echo "OK cement calculate"

ORIGIN_HEADER=$(curl -sI -X OPTIONS "${SUSTALLY}/api/assessments/book" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" | tr -d '\r' | grep -i access-control-allow-origin || true)
if [[ -z "${ORIGIN_HEADER}" ]]; then
  echo "WARN: CORS allow-origin not returned for assessments/book"
else
  echo "OK CORS ${ORIGIN_HEADER}"
fi

if curl -sf -o /dev/null "${FN}/"; then
  echo "== fn (${FN}) =="
  echo "OK home page"
else
  echo "SKIP fn not running at ${FN}"
fi

echo "Smoke finished."
