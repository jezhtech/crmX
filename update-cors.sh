#!/bin/bash

echo "Updating Firebase Storage CORS configuration..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI is not installed. Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if the user is logged in
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "You're not logged in. Please login with: firebase login"
    exit 1
fi

# Update the CORS configuration
firebase storage:cors update cors-config.json

echo "CORS configuration updated successfully!"
echo "If you're still having issues, please make sure to:"
echo "  1. Set appropriate CORS settings in your hosting environment"
echo "  2. Rebuild and redeploy your application" 