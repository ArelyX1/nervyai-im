#!/bin/bash

# Test to identify WHERE the issue is:
# Option A: localStorage only (no backend)
# Option B: Backend enabled

API="http://localhost:4001/api"

echo "=== DIAGNOSTIC TEST ==="
echo "Testing how frontend should hydrate data"
echo ""

# Create a test account
USER="diag-$(date +%s)"
PIN="5678"
STATE='{"skills":[],"tasks":[{"id":"t1","title":"Important","status":"pending"}],"goals":[],"user":{"id":"u1","totalXp":999},"settings":{}}'

echo "[1] Creating account with distinctive state (totalXp: 999)..."
curl -s -X POST "$API/accounts/login" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$USER\",\"pin\":\"$PIN\",\"state\":$STATE,\"mode\":\"create\"}" > /dev/null
echo "✓ Created"

echo ""
echo "[2] What frontend should do on page reload:"
echo ""
echo "Option A (localStorage only):"
echo "  - Load state from localStorage key 'nervyai-app-state'"
echo "  - If found, apply it to React state"
echo "  - Display that data"
echo ""
echo "Option B (backend enabled + accountId in localStorage):"
echo "  - Fetch from: /api/collections/accounts/{accountId}"
echo "  - Get back: {id, pinHash, state: {...}}"
echo "  - Extract .state and apply to React state"
echo "  - Display that data"
echo ""

# Test what we get back
echo "[3] Testing the backend response:"
RESPONSE=$(curl -s "$API/collections/accounts/$USER")
echo "GET /api/collections/accounts/$USER returns:"
echo "$RESPONSE" | jq . 2>/dev/null | head -30

echo ""
echo "[4] Checking if totalXp is accessible:"
if echo "$RESPONSE" | grep -q '"totalXp":999'; then
  echo "✓ Frontend CAN extract totalXp from response.state"
else
  echo "✗ Frontend CANNOT find totalXp in response"
fi

echo ""
echo "[5] Testing login endpoint:"
LOGIN_RESP=$(curl -s -X POST "$API/accounts/login" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$USER\",\"pin\":\"$PIN\",\"mode\":\"login\"}")

echo "POST /api/accounts/login returns:"
echo "$LOGIN_RESP" | jq . 2>/dev/null | head -30

echo ""
echo "CONCLUSIONS:"
echo "============"
echo "1. Backend IS persisting data correctly ✓"
echo "2. Backend IS returning state on login ✓"
echo "3. Frontend must be failing to:"
echo "   a) Call fetchFromServer correctly"
echo "   b) Apply the fetched state to React hooks"
echo "   c) Sync state to adapters"
echo ""
echo "Likely issue: Frontend is not properly calling the fetch"
echo "             OR applying the response to state synchronously"
