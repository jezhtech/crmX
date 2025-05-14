// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBRxy-x5wkhAOOXhbXUsP7vCQZBtCVhYf0",
  authDomain: "crmx-aac39.firebaseapp.com",
  projectId: "crmx-aac39",
  storageBucket: "crmx-aac39.appspot.com",
  messagingSenderId: "609821268308",
  appId: "1:609821268308:web:202ab8935305fd1e35d0c1",
  measurementId: "G-6VF6C1F2QR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Enable offline persistence when possible
try {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log("Offline persistence enabled");
    })
    .catch((err) => {
      console.error("Error enabling offline persistence:", err);
    });
} catch (error) {
  console.error("Error with IndexedDB:", error);
}

// Function to test Firestore access
export const testFirestore = async () => {
  try {
    console.log("Testing Firestore connection...");
    const testCollection = collection(db, "test_connection");
    const snapshot = await getDocs(testCollection);
    console.log("Connection successful, docs:", snapshot.size);
    return true;
  } catch (error) {
    console.error("Error testing Firestore connection:", error);
    return false;
  }
};

// Log Firebase initialization
console.log("Firebase initialized with project:", firebaseConfig.projectId);

export { app, analytics, db, auth, storage }; 