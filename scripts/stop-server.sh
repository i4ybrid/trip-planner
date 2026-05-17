#!/bin/bash

echo "Finding processes running on ports 3000 and 4000..."

# Find and display processes on port 3000
echo ""
echo "=== Processes on port 3000 ==="
lsof -ti:3000 2>/dev/null | while read pid; do
  if [ -n "$pid" ]; then
    process_name=$(ps -p "$pid" -o comm= 2>/dev/null)
    echo "PID $pid ($process_name) - killing..."
    kill "$pid" 2>/dev/null && echo "Stopped PID $pid" || echo "Failed to stop PID $pid"
  fi
done

# Find and display processes on port 4000
echo ""
echo "=== Processes on port 4000 ==="
lsof -ti:4000 2>/dev/null | while read pid; do
  if [ -n "$pid" ]; then
    process_name=$(ps -p "$pid" -o comm= 2>/dev/null)
    echo "PID $pid ($process_name) - killing..."
    kill "$pid" 2>/dev/null && echo "Stopped PID $pid" || echo "Failed to stop PID $pid"
  fi
done

echo ""
echo "Done."