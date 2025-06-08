#!/bin/bash

# Violette EasyA - Complete System Startup Script
echo "🚀 Starting Violette EasyA Complete System..."
echo ""

# Function to kill existing processes
cleanup() {
    echo "🧹 Cleaning up existing processes..."
    pkill -f "ai-server" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    sleep 2
}

# Cleanup existing processes
cleanup

echo "📋 Starting servers in the following order:"
echo "  1. AI Server (port 8000)"
echo "  2. Backend Server (port 8001)" 
echo "  3. Frontend (port 3000)"
echo ""

# Start AI Server
echo "🤖 Starting AI Server..."
npm run ai-server > logs/ai-server.log 2>&1 &
AI_PID=$!
echo "   AI Server PID: $AI_PID"

# Wait a moment
sleep 3

# Start Backend Server
echo "⚡ Starting Backend Server..."
PORT=8001 npm run backend:dev > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend Server PID: $BACKEND_PID"

# Wait a moment
sleep 3

# Start Frontend
echo "🎨 Starting Frontend..."
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Wait for all servers to start
echo ""
echo "⏳ Waiting for servers to start..."
sleep 10

# Test if servers are running
echo ""
echo "🔍 Checking server health..."

# Test AI Server
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ AI Server: Running on port 8000"
else
    echo "❌ AI Server: Failed to start"
fi

# Test Backend Server
if curl -s http://localhost:8001/health > /dev/null; then
    echo "✅ Backend Server: Running on port 8001"
else
    echo "❌ Backend Server: Failed to start"
fi

# Test Frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend: Running on port 3000"
else
    echo "❌ Frontend: Failed to start"
fi

echo ""
echo "🎉 System Status:"
echo "   Frontend:     http://localhost:3000"
echo "   AI Server:    http://localhost:8000"
echo "   Backend:      http://localhost:8001"
echo ""
echo "📝 Logs are saved in the logs/ directory:"
echo "   AI Server:    logs/ai-server.log"
echo "   Backend:      logs/backend.log"
echo "   Frontend:     logs/frontend.log"
echo ""
echo "🧪 Run complete system test:"
echo "   npm run test:complete"
echo ""
echo "⏹️  To stop all servers:"
echo "   kill $AI_PID $BACKEND_PID $FRONTEND_PID"
echo "   Or run: pkill -f 'ai-server|nodemon|next'"
echo ""
echo "Press Ctrl+C to stop this script (servers will continue running)"

# Keep script running
while true; do
    sleep 60
done 