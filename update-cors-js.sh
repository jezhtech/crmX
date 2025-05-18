#!/bin/bash

echo "Installing required dependencies..."
npm install firebase-admin --save-dev

echo "Running CORS update script..."
node updateCorsWithJavascript.js 