#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! npx supabase status >/dev/null 2>&1; then
  echo "Starting local Supabase…"
  npx supabase start
fi

eval "$(npx supabase status -o env)"

OPENAI_KEY="${OPENAI_API_KEY:-}"
if [[ -z "$OPENAI_KEY" && -f .env.local ]]; then
  OPENAI_KEY="$(rg -N '^OPENAI_API_KEY=' .env.local | cut -d= -f2- || true)"
fi

cat > .env.local <<EOF
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=RiskDetect AI

# Local Supabase
NEXT_PUBLIC_SUPABASE_URL=${API_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}

# OpenAI
OPENAI_API_KEY=${OPENAI_KEY}
OPENAI_MODEL=gpt-4o-mini
EOF

echo "Wrote .env.local from local Supabase status."
echo "Studio: ${STUDIO_URL:-http://127.0.0.1:54323}"
echo "API:    ${API_URL}"
