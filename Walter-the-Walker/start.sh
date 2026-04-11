#!/bin/bash
# Start backend in background
cd /home/runner/workspace/backend && python3 -m uvicorn server:app --host localhost --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
cd /home/runner/workspace/frontend && PORT=5000 HOST=0.0.0.0 npm start
