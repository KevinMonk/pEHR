#!/bin/bash

# Kill any existing Electron processes
pkill -f electron

# Clean up old data
rm -rf ~/pEHR-*

echo "Starting fresh Electron instance with dev tools..."
npm run electron-dev