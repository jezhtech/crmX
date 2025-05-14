import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/firebase' // Import Firebase configuration
import { initializeUsers } from './scripts/initUsers' 
import { testFirestore } from './lib/firebase'

// Test Firebase connection
testFirestore().then(success => {
  console.log("Firestore connection test result:", success ? "Success" : "Failed");
});

// Attempt to initialize users on application start
initializeUsers().catch(error => {
  console.error('Failed to initialize users:', error);
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered: ', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed: ', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
