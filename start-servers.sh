#!/bin/bash

# Start both NervyAI servers in parallel
# Backend: http://localhost:4001
# Frontend: http://localhost:3000

echo "🚀 Starting NervyAI Services"
echo "============================"
echo ""

# Setup Node version
export PATH="/home/arelyxl/.local/share/nvm/v25.6.1/bin:$PATH"
NODE_VERSION=$(node --version)
echo "Node: $NODE_VERSION"
echo ""

# Function to handle Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting Backend (http://localhost:4001)..."
npm run backend &
BACKEND_PID=$!
sleep 2

# Start frontend
echo "Starting Frontend (http://localhost:3000)..."
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
sleep 5

echo ""
echo "✅ Both servers running!"
echo ""
echo "Services:"
echo "  Backend:  http://localhost:4001/api"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait $BACKEND_PID $FRONTEND_PID
