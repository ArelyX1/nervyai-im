#!/bin/bash

# Simulate the user's workflow:
# 1. Create account
# 2. Make changes (add task, complete it for XP)
# 3. Wait for autosave
# 4. Close and reopen (by logging in again)
# 5. Check if data persisted

API="http://localhost:4001/api"
USER="workflow-test-$(date +%s)"
PIN="1234"

echo "=== WORKFLOW TEST ==="
echo "User: $USER"
echo ""

# Step 1: Create account with initial state
echo "[1] Creating account..."
INIT_STATE='{
  "skills": [{
    "id": "skill1",
    "name": "Test Skill",
    "level": 0,
    "xpCurrent": 100,
    "xpRequired": 1000
  }],
  "tasks": [{
    "id": "task1",
    "title": "Test Task",
    "status": "pending",
    "skillCategoryId": "category1"
  }],
  "goals": [],
  "user": {
    "id": "user1",
    "name": "Test User",
    "totalXp": 100,
    "currentLevel": 1
  },
  "settings": {}
}'

CREATE=$(curl -s -X POST "$API/accounts/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$USER\",
    \"pin\": \"$PIN\",
    \"state\": $INIT_STATE,
    \"mode\": \"create\"
  }")

echo "$CREATE" | grep -q '"ok":true' && echo "✓ Account created" || echo "✗ FAIL"
echo ""

# Step 2: Verify account is saved with initial state
echo "[2] Verifying initial data saved..."
SAVED=$(curl -s "$API/collections/accounts/$USER")
echo "$SAVED" | grep -q '"totalXp":100' && echo "✓ Initial data saved" || echo "✗ FAIL"
echo ""

# Step 3: Simulate changes (update task status, increase XP)
echo "[3] Simulating data changes (completing task, increasing XP)..."
CHANGED_STATE='{
  "skills": [{
    "id": "skill1",
    "name": "Test Skill",
    "level": 1,
    "xpCurrent": 550,
    "xpRequired": 1000
  }],
  "tasks": [{
    "id": "task1",
    "title": "Test Task",
    "status": "completed",
    "skillCategoryId": "category1",
    "completedAt": "'$(date -I)'"
  }],
  "goals": [],
  "user": {
    "id": "user1",
    "name": "Test User",
    "totalXp": 550,
    "currentLevel": 1,
    "currentStreak": 1
  },
  "settings": {}
}'

UPDATE=$(curl -s -X POST "$API/collections/accounts" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$USER\",
    \"state\": $CHANGED_STATE
  }")

echo "$UPDATE" | grep -q '"ok":true' && echo "✓ Changes saved" || echo "✗ FAIL"
echo ""

# Step 4: Verify changes persisted
echo "[4] Verifying changes persisted to backend..."
PERSISTED=$(curl -s "$API/collections/accounts/$USER")
if echo "$PERSISTED" | grep -q '"totalXp":550'; then
  echo "✓ Changes persisted (totalXp: 550, status: completed)"
  if echo "$PERSISTED" | grep -q '"status":"completed"'; then
    echo "  ✓ Task marked as completed"
  fi
else
  echo "✗ FAIL - Changes NOT persisted"
  echo "  Response: $(echo $PERSISTED | head -c 200)..."
fi
echo ""

# Step 5: Simulate "closing and reopening" - login again
echo "[5] Simulating restart: logging in again..."
LOGIN=$(curl -s -X POST "$API/accounts/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$USER\",
    \"pin\": \"$PIN\",
    \"mode\": \"login\"
  }")

echo "[LOGIN RESPONSE]"
echo "$LOGIN" | head -c 600
echo ""
echo ""

# Step 6: Check if state was returned on login
if echo "$LOGIN" | grep -q '"totalXp":550'; then
  echo "✓✓✓ SUCCESS! Data persisted through workflow!"
  echo "  - Initial totalXp: 100 → Final totalXp: 550"
  echo "  - Task completed: Yes"
  echo "  Data is PROPERLY PERSISTED"
else
  echo "✗✗✗ PROBLEM! Data lost on login"
  if echo "$LOGIN" | grep -q '"totalXp":100'; then
    echo "  - Got initial data (100 XP) instead of changes (550 XP)"
  else
    echo "  - Got no XP or wrong data"
  fi
  echo "  Data is NOT PROPERLY RESTORED"
fi
