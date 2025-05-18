const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with your service account
// Note: You need to download your Firebase service account key first
// from Firebase Console > Project Settings > Service Accounts > Generate New Private Key
async function updateCorsSettings() {
  try {
    // Check if service account file exists
    const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('Service account file not found at:', serviceAccountPath);
      console.log('Please download your Firebase service account key from Firebase Console:');
      console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
      console.log('2. Click "Generate New Private Key"');
      console.log('3. Save the file as "firebase-service-account.json" in the project root');
      process.exit(1);
    }

    // Initialize admin SDK
    const serviceAccount = require(serviceAccountPath);
    initializeApp({
      credential: cert(serviceAccount)
    });

    // Get IP address to add to CORS settings
    const getIP = require('child_process').execSync('curl -s ifconfig.me').toString().trim();
    console.log('Your current IP address:', getIP);

    // Create CORS configuration
    const corsConfig = [
      {
        origin: [
          '*',
          `http://${getIP}:8080`,
          `https://${getIP}:8080`,
          'http://192.168.0.181:8080',
          'https://192.168.0.181:8080',
          'http://localhost:3000',
          'https://localhost:3000',
          'http://localhost:5173',
          'https://localhost:5173',
          'http://localhost:8080',
          'https://localhost:8080',
          'http://localhost:8083',
          'https://localhost:8083'
        ],
        method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
        maxAgeSeconds: 3600,
        responseHeader: [
          'Content-Type',
          'Content-Length',
          'Authorization',
          'User-Agent',
          'x-goog-resumable',
          'Content-Disposition',
          'Accept',
          'Origin',
          'X-Requested-With',
          'Access-Control-Allow-Origin',
          'ETag',
          'Cache-Control'
        ]
      }
    ];

    // Update CORS settings
    const bucket = getStorage().bucket('crmx-aac39.appspot.com');
    console.log('Updating CORS settings for bucket:', bucket.name);
    
    await bucket.setCorsConfiguration(corsConfig);
    console.log('CORS settings updated successfully!');
  } catch (error) {
    console.error('Error updating CORS settings:', error);
  }
}

updateCorsSettings(); 