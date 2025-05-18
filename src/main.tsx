import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/firebase' // Import Firebase configuration
import { initializeUsers } from './scripts/initUsers' 
import { testFirestore } from './lib/firebase'
import { enforceHttps } from './lib/httpsRedirect'

// Enforce HTTPS for all non-localhost connections
enforceHttps();

// Test Firebase connection
testFirestore().then(success => {
  console.log("Firestore connection test result:", success ? "Success" : "Failed");
});

// Attempt to initialize users on application start
initializeUsers().catch(error => {
  console.error('Failed to initialize users:', error);
});

// Register Firebase Storage Proxy Service Worker (this is the key fix for CORS issues)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register the storage proxy service worker first
    navigator.serviceWorker.register('/firebase-storage-proxy.js', {
      scope: '/',
      type: 'module',
      updateViaCache: 'none'
    })
      .then(registration => {
        console.log('Firebase Storage Proxy Service Worker registered: ', registration);
      })
      .catch(error => {
        console.error('Firebase Storage Proxy Service Worker registration failed: ', error);
      });
    
    // Register the main service worker
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Main Service Worker registered: ', registration);
      })
      .catch(error => {
        console.log('Main Service Worker registration failed: ', error);
      });
  });
}

// Log protocol being used
console.log(`Protocol: ${window.location.protocol}`);
console.log(`Running in secure context: ${window.isSecureContext}`);

createRoot(document.getElementById("root")!).render(<App />);
