#!/bin/bash

# Quick setup and test script for NervyAI
# This sets up Node.js environment and starts both servers

echo "🚀 NervyAI Setup & Launch"
echo "========================="
echo ""

# Step 1: Setup Node version
echo "📦 Setting up Node.js..."
nvm use latest 2>/dev/null || true
NODE_VERSION=$(node --version)
echo "✅ Node: $NODE_VERSION"
echo ""

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   Installing frontend dependencies..."
    npm install --quiet 2>&1 | tail -2
fi

if [ ! -d "server/node_modules" ]; then
    echo "   Installing server dependencies..."
    cd server && npm install --quiet 2>&1 && cd ..
    echo "   ✅ Server dependencies ready"
fi
echo "✅ Dependencies installed"
echo ""

# Step 3: Display port information
echo "🌐 Service Information"
echo "====================="
echo ""
echo "Backend API:"
echo "  URL: http://localhost:4001/api"
echo "  Database: server/db.json"
echo ""
echo "Frontend App:"
echo "  URL: http://localhost:3000"
echo ""

# Step 4: Instructions for starting
echo "🚀 To Start Services:"
echo "====================="
echo ""
echo "Terminal 1 - Backend:"
echo "  $ npm run backend"
echo ""
echo "Terminal 2 - Frontend:"
echo "  $ export PATH=\"/home/arelyxl/.local/share/nvm/v25.6.1/bin:\$PATH\""
echo "  $ npm run dev"
echo ""
echo "Or use this script to start both:"
echo "  $ ./start-servers.sh"
echo ""

# Step 5: Test options
echo "🧪 Testing Options"
echo "=================="
echo ""
echo "Backend tests (verify persistence at API level):"
echo "  $ bash quick-test.sh            # 3-step quick test"
echo "  $ bash workflow-test.sh         # Full workflow test"
echo "  $ bash final-test.sh            # Comprehensive test"
echo "  $ bash diagnostic.sh            # Diagnostic info"
echo ""
echo "Frontend tests (verify UI):"
echo "  1. Open http://localhost:3000"
echo "  2. Create account (e.g., 'testuser' / '1234')"
echo "  3. Add a task and complete it"
echo "  4. Wait 20 seconds for autosave"
echo "  5. Refresh page (Ctrl+R)"
echo "  6. Should show your task still there"
echo ""

echo "📚 Documentation:"
echo "  README-PERSISTENCE.md   - Complete guide"
echo "  PERSISTENCE_FIX.md      - Technical details"
echo ""

echo "✅ Setup complete! Ready to launch NervyAI"
echo ""
