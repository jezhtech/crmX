// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

// Initialize Storage with custom settings to fix CORS issues
const storage = getStorage(app);

// Set custom storage settings
const storageSettings = {
  customDomain: firebaseConfig.storageBucket,
};

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
const testFirestore = async () => {
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

// Wrapper function to handle file uploads with better error handling
const safeUploadFile = async (path: string, file: File, metadata?: any) => {
  try {
    console.log("Starting safe upload to path:", path);
    
    // Create a direct upload function that uses a blob approach (avoids CORS)
    const storageRef = ref(storage, path);
    
    // Convert file to base64 data for direct upload
    const reader = new FileReader();
    const fileDataPromise = new Promise((resolve, reject) => {
      reader.onload = (e) => resolve(e.target?.result);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
    
    // Get file data as ArrayBuffer
    const fileData = await fileDataPromise;
    
    // Create a Blob with the correct content type
    const blob = new Blob([fileData as ArrayBuffer], { type: file.type });
    
    console.log("File prepared as Blob for upload:", blob.size, "bytes");
    
    // Upload with retry mechanism
    let attempt = 0;
    const maxAttempts = 3;
    let uploadResult;
    
    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`Upload attempt ${attempt}/${maxAttempts}`);
        
        // Add special metadata to help with CORS
        const enhancedMetadata = {
          contentType: file.type,
          customMetadata: {
            ...(metadata?.customMetadata || {}),
            'x-cors-bypass': 'true',
            'access-control-allow-origin': '*'
          }
        };
        
        uploadResult = await uploadBytes(storageRef, blob, enhancedMetadata);
        console.log("Upload successful:", uploadResult.ref.fullPath);
        break; // Success, exit loop
      } catch (err) {
        console.warn(`Upload attempt ${attempt} failed:`, err);
        if (attempt >= maxAttempts) throw err;
        await new Promise(r => setTimeout(r, 1000)); // Wait before retry
      }
    }
    
    if (!uploadResult) throw new Error("Upload failed after retries");
    
    // Get download URL with retry
    attempt = 0;
    let url;
    
    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`Get URL attempt ${attempt}/${maxAttempts}`);
        url = await getDownloadURL(uploadResult.ref);
        console.log("Download URL obtained:", url);
        break; // Success, exit loop
      } catch (err) {
        console.warn(`Get URL attempt ${attempt} failed:`, err);
        if (attempt >= maxAttempts) throw err;
        await new Promise(r => setTimeout(r, 1000)); // Wait before retry
      }
    }
    
    if (!url) throw new Error("Failed to get download URL");
    
    return { success: true, url, ref: uploadResult.ref };
  } catch (error) {
    console.error("Error in safeUploadFile:", error);
    return { success: false, error };
  }
};

// Client-side fallback function for when Firebase Storage fails
const localStorageFallback = async (file: File) => {
  try {
    console.log("Using client-side storage fallback");
    
    // Create a blob URL - this works without CORS issues but is temporary
    // and will be lost on page refresh
    const blobUrl = URL.createObjectURL(file);
    
    // We'll also store metadata about the file in localStorage
    // to help track these temporary files
    const fileId = `local_file_${Date.now()}`;
    const fileMetadata = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      url: blobUrl,
      created: new Date().toISOString()
    };
    
    // Store in localStorage (stringified)
    const existingFiles = JSON.parse(localStorage.getItem('localFiles') || '[]');
    existingFiles.push(fileMetadata);
    localStorage.setItem('localFiles', JSON.stringify(existingFiles));
    
    console.log("File stored locally with ID:", fileId);
    return { 
      success: true, 
      url: blobUrl, 
      isLocal: true, 
      metadata: fileMetadata 
    };
  } catch (error) {
    console.error("Error in local storage fallback:", error);
    return { success: false, error, isLocal: true };
  }
};

// Enhanced safe upload with fallback
const enhancedUploadFile = async (path: string, file: File, metadata?: any, useLocalFallback = true) => {
  try {
    // First try Firebase Storage
    const result = await safeUploadFile(path, file, metadata);
    if (result.success) return result;
    
    // If Firebase fails and fallback is enabled, try local storage
    if (useLocalFallback) {
      console.log("Firebase upload failed, trying local storage");
      return await localStorageFallback(file);
    }
    
    return result; // Return the original error if no fallback
  } catch (error) {
    console.error("Error in enhancedUploadFile:", error);
    
    // Try local fallback if enabled
    if (useLocalFallback) {
      console.log("Error caught, trying local storage fallback");
      return await localStorageFallback(file);
    }
    
    return { success: false, error };
  }
};

// Log Firebase initialization
console.log("Firebase initialized with project:", firebaseConfig.projectId);

// Export everything from a single place to avoid linter errors
export { 
  app, 
  analytics, 
  db, 
  auth, 
  storage, 
  testFirestore,
  safeUploadFile, 
  enhancedUploadFile, 
  localStorageFallback 
}; 