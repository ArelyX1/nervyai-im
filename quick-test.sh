#!/bin/bash

# Standalone persistence test - very simple version
TESTUSER="test-$(date +%s)"
PIN="1234"

echo "Step 1: Creating account $TESTUSER with data..."
RESP1=$(curl -s -X POST http://localhost:4001/api/accounts/login \
  -H "Content-Type: application/json" \
  -d "{\"id\": \"$TESTUSER\", \"pin\": \"$PIN\", \"state\": {\"skills\": [], \"tasks\": [{\"id\": \"task1\", \"title\": \"Test\"}], \"goals\": [], \"user\": {\"id\": \"u1\", \"totalXp\": 777}, \"settings\": {}}, \"mode\": \"create\"}")

echo "$RESP1" | grep -q '"ok":true' && echo "✓ Created" || echo "✗ Failed"; echo ""

echo "Step 2: Fetching from backend..."
RESP2=$(curl -s -X GET "http://localhost:4001/api/collections/accounts/$TESTUSER")
echo "$RESP2" | grep -q '"totalXp":777' && echo "✓ Data saved (totalXp: 777)" || echo "✗ Data NOT saved"; echo ""

echo "Step 3: Login again (like restarting app)..."
RESP3=$(curl -s -X POST http://localhost:4001/api/accounts/login \
  -H "Content-Type: application/json" \
  -d "{\"id\": \"$TESTUSER\", \"pin\": \"$PIN\", \"mode\": \"login\"}")

echo "$RESP3" | grep -q '"totalXp":777' && echo "✓✓✓ SUCCESS! Data persists after login!" || echo "✗ FAIL! Data lost"
echo ""
echo "Raw login response (first 500 chars):"
echo "$RESP3" | head -c 500
echo ""
