#!/bin/bash

echo "Updating Firebase Storage CORS configuration for HTTP origins..."

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

# Get current IP address
IP=$(curl -s ifconfig.me)
echo "Your current IP address: $IP"

# Create a temporary CORS config file with HTTP origins
cat > cors-config-http.json << EOL
[
  {
    "origin": [
      "*", 
      "http://${IP}:8080",
      "http://${IP}:3000",
      "http://${IP}:5173",
      "http://localhost:3000", 
      "http://localhost:5173",
      "http://localhost:8080",
      "http://192.168.0.181:8080"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type", 
      "Content-Length", 
      "Authorization", 
      "User-Agent", 
      "x-goog-resumable", 
      "Content-Disposition",
      "Accept",
      "Origin",
      "X-Requested-With",
      "Access-Control-Allow-Origin",
      "ETag",
      "Cache-Control"
    ]
  }
]
EOL

# Update the CORS configuration
echo "Uploading CORS configuration with HTTP origins..."
firebase storage:cors update cors-config-http.json

echo "CORS configuration updated successfully!"
echo "Your HTTP origin ($IP) has been added to allowed origins list."
echo ""
echo "If you're still having issues:"
echo "  1. Clear your browser cache or use incognito mode"
echo "  2. Restart your development server"
echo "  3. Try the upload again" 