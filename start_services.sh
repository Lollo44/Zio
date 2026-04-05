#!/bin/bash
# Script to run both backend and frontend for local network access

# Discover host IP
HOST_IP=$(hostname -I | awk '{print $1}')
if [ -z "$HOST_IP" ]; then
    HOST_IP="0.0.0.0"
fi
echo "Starting services on IP: $HOST_IP"

# 1. Start Backend on all interfaces (port 8000)
cd backend || exit 1
export DB_NAME="walter_db"
export MONGO_URL="mongodb://localhost:27017"
python3 -m uvicorn server:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# 2. Wait a moment for the backend to start
sleep 2

# 3. Start Frontend
# Set REACT_APP_BACKEND_URL to the host's actual IP so Android phones on the network can reach it
cd frontend || exit 1
export REACT_APP_BACKEND_URL="http://$HOST_IP:8000"
export REACT_APP_AUTH_DISABLED="true"
# Bind React to 0.0.0.0 so it's accessible externally
export HOST=0.0.0.0
export PORT=3000
npm install
npm start &
FRONTEND_PID=$!
cd ..

# Handle graceful shutdown
trap "kill $BACKEND_PID $FRONTEND_PID; exit 0" SIGINT SIGTERM
echo "Services running. Press Ctrl+C to stop."
echo "Frontend: http://$HOST_IP:3000"
echo "Backend: http://$HOST_IP:8000"
wait
