#!/bin/bash

# Comprehensive persistence testing script
# Tests: create account → add data → save → restart → verify data loads

set -e

BACKEND_URL="http://localhost:4001/api"
FRONTEND_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test user credentials
TEST_USER="testuser-$(date +%s)"
TEST_PIN="1234"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}NervyAI Persistence Testing Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to log and execute curl commands
function api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}→ $description${NC}"
    echo -e "  ${method} ${BACKEND_URL}${endpoint}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -X "$method" "${BACKEND_URL}${endpoint}" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -X "$method" "${BACKEND_URL}${endpoint}" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    echo -e "  Response: ${response:0:200}..."
    echo "$response"
}

# ==================== TEST 1: CREATE ACCOUNT ====================
echo -e "${BLUE}[TEST 1] Creating account...${NC}"

account_data=$(cat <<EOF
{
  "id": "$TEST_USER",
  "pin": "$TEST_PIN",
  "state": {
    "skills": [],
    "tasks": [],
    "goals": [],
    "user": {
      "id": "user-1",
      "name": "Test User",
      "avatar": "🚀",
      "totalXp": 100,
      "currentLevel": 1,
      "currentStreak": 5,
      "longestStreak": 10
    },
    "settings": {
      "theme": "dark",
      "notifications": true,
      "lang": "es"
    }
  },
  "mode": "create"
}
EOF
)

response=$(api_call "POST" "/accounts/login" "$account_data" "Creating test account")

if echo "$response" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓ Account created successfully${NC}"
else
    echo -e "${RED}✗ Failed to create account${NC}"
    echo "$response"
    exit 1
fi

echo ""

# ==================== TEST 2: VERIFY ACCOUNT WAS SAVED ====================
echo -e "${BLUE}[TEST 2] Verifying account was saved to backend...${NC}"

response=$(api_call "GET" "/collections/accounts/$TEST_USER" "" "Fetching saved account")

if echo "$response" | grep -q "\"id\""; then
    echo -e "${GREEN}✓ Account found in backend${NC}"
    echo -e "  Account content: ${response:0:300}..."
else
    echo -e "${RED}✗ Account not found in backend${NC}"
    echo "$response"
    exit 1
fi

echo ""

# ==================== TEST 3: LOGIN AGAIN ====================
echo -e "${BLUE}[TEST 3] Logging in again to verify state is returned...${NC}"

login_data=$(cat <<EOF
{
  "id": "$TEST_USER",
  "pin": "$TEST_PIN",
  "mode": "login"
}
EOF
)

response=$(api_call "POST" "/accounts/login" "$login_data" "Logging in again")

if echo "$response" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓ Login successful${NC}"
    
    # Check if state is returned
    if echo "$response" | grep -q '"state"'; then
        echo -e "${GREEN}✓ State returned in login response${NC}"
        # Extract and display state
        state=$(echo "$response" | grep -o '"state":[^}]*}' | head -1)
        echo -e "  State snippet: ${state:0:200}..."
    else
        echo -e "${YELLOW}⚠ No state returned in login response${NC}"
        echo -e "  Full response: $response"
    fi
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$response"
    exit 1
fi

echo ""

# ==================== TEST 4: SAVE MODIFIED STATE ====================
echo -e "${BLUE}[TEST 4] Modifying and saving account data...${NC}"

modified_state=$(cat <<EOF
{
  "id": "$TEST_USER",
  "pin": "$TEST_PIN",
  "state": {
    "skills": [
      {
        "id": "test-skill",
        "name": "Test Skill",
        "xp": 500
      }
    ],
    "tasks": [
      {
        "id": "task-1",
        "title": "Test Task",
        "completed": true
      }
    ],
    "goals": [],
    "user": {
      "id": "user-1",
      "name": "Test User",
      "avatar": "🚀",
      "totalXp": 600,
      "currentLevel": 2,
      "currentStreak": 6,
      "longestStreak": 10
    },
    "settings": {
      "theme": "dark",
      "notifications": true,
      "lang": "es"
    }
  }
}
EOF
)

response=$(api_call "POST" "/collections/accounts" "$modified_state" "Saving modified account data")

if echo "$response" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓ Modified state saved successfully${NC}"
else
    echo -e "${RED}✗ Failed to save modified state${NC}"
    echo "$response"
    exit 1
fi

echo ""

# ==================== TEST 5: FETCH SAVED STATE ====================
echo -e "${BLUE}[TEST 5] Fetching the saved state from backend...${NC}"

response=$(api_call "GET" "/collections/accounts/$TEST_USER" "" "Fetching account with modified state")

if echo "$response" | grep -q '"totalXp":600'; then
    echo -e "${GREEN}✓ Modified data persisted correctly (totalXp: 600)${NC}"
else
    echo -e "${YELLOW}⚠ Modified data not found in backend${NC}"
    echo -e "  Full account: ${response:0:500}..."
fi

echo ""

# ==================== TEST 6: LOGIN AFTER RESTART ====================
echo -e "${BLUE}[TEST 6] Simulating restart: logging in again to get modified state...${NC}"

login_data=$(cat <<EOF
{
  "id": "$TEST_USER",
  "pin": "$TEST_PIN",
  "mode": "login"
}
EOF
)

response=$(api_call "POST" "/accounts/login" "$login_data" "Final login to verify state persists")

if echo "$response" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓ Login successful${NC}"
    
    if echo "$response" | grep -q '"totalXp":600'; then
        echo -e "${GREEN}✓✓✓ SUCCESS! State persisted through restart${NC}"
        echo -e "${GREEN}Modified data loaded: totalXp=600, tasks found${NC}"
    else
        echo -e "${RED}✗ FAILED! State NOT persisted${NC}"
        echo -e "  Response: ${response:0:300}..."
    fi
else
    echo -e "${RED}✗ Final login failed${NC}"
    echo "$response"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Complete${NC}"
echo -e "${BLUE}========================================${NC}"

