#!/bin/bash

echo "Updating Firebase Storage CORS configuration using gsutil..."

# Get your Firebase storage bucket name from firebase.ts
BUCKET="crmx-aac39.appspot.com"
echo "Storage bucket: $BUCKET"

# Get current IP address
IP=$(curl -s ifconfig.me)
echo "Your current IP address: $IP"

# Create cors-config.json with updated origins
cat > cors-config-gsutil.json << EOL
[
  {
    "origin": [
      "*", 
      "http://${IP}:8080",
      "https://${IP}:8080",
      "http://192.168.0.181:8080",
      "https://192.168.0.181:8080",
      "http://localhost:3000", 
      "https://localhost:3000",
      "http://localhost:5173",
      "https://localhost:5173",
      "http://localhost:8080",
      "https://localhost:8080"
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

# Update CORS configuration using gsutil
echo "Setting CORS configuration for gs://$BUCKET"
gsutil cors set cors-config-gsutil.json gs://$BUCKET

echo ""
echo "CORS configuration updated successfully!"
echo "Your IP ($IP) has been added to allowed origins list."
echo ""
echo "If you're still having issues:"
echo "  1. Clear your browser cache or use incognito mode"
echo "  2. Restart your development server"
echo "  3. Try the upload again" 