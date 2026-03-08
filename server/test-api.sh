#!/bin/bash
# Test Express+Lowdb API - run: pnpm install && node server/index.js (in another terminal)
# Then: bash server/test-api.sh

BASE="http://localhost:4001/api"
echo "=== Testing Express+Lowdb API at $BASE ==="

echo ""
echo "1. GET /api/state (initial)"
curl -s "$BASE/state" | head -c 200
echo "..."

echo ""
echo ""
echo "2. POST /api/accounts/login (create account testuser)"
curl -s -X POST "$BASE/accounts/login" \
  -H "Content-Type: application/json" \
  -d '{"id":"testuser","pin":"1234","mode":"create","state":{"skills":[],"tasks":[],"goals":[],"user":null,"settings":null}}' | jq . 2>/dev/null || cat

echo ""
echo "3. GET /api/collections/accounts/testuser"
curl -s "$BASE/collections/accounts/testuser" | jq '.state' 2>/dev/null | head -5 || cat

echo ""
echo "4. POST /api/collections/accounts (upsert with state)"
curl -s -X POST "$BASE/collections/accounts" \
  -H "Content-Type: application/json" \
  -d '{"id":"testuser","pin":"1234","state":{"skills":[],"tasks":[{"id":"t1","title":"Test task"}],"goals":[],"user":null,"settings":null}}' | jq . 2>/dev/null || cat

echo ""
echo "5. GET /api/collections/accounts/testuser (verify saved)"
curl -s "$BASE/collections/accounts/testuser" | jq '.state.tasks' 2>/dev/null || cat

echo ""
echo "6. Check db.json exists"
ls -la server/db.json 2>/dev/null || echo "db.json not found (check server dir)"

echo ""
echo "=== Done ==="
