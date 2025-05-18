// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDocs, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { getFunctions } from "firebase/functions";

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
const functions = getFunctions(app);

// Initialize Storage with custom settings to fix CORS issues
const storageCorsSettings = {
  cors: [{
    origin: ['*'],
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
      'X-Requested-With'
    ]
  }]
};

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

    // Get current origin for CORS settings
    const origin = window.location.origin;
    console.log("Current origin:", origin);
    
    // Upload with retry mechanism
    let attempt = 0;
    const maxAttempts = 3;
    let uploadResult;
    
    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`Upload attempt ${attempt}/${maxAttempts}`);
        
        // Add special metadata to help with CORS - using wildcard origin and explicit HTTP origins
        const enhancedMetadata = {
          contentType: file.type,
          customMetadata: {
            ...(metadata?.customMetadata || {}),
            'x-cors-bypass': 'true',
            'access-control-allow-origin': '*',
            'allow_origin': '*',
            'http-origin': origin
          },
          // Add explicit CORS headers for the upload
          cors: {
            origin: ['*', origin, 'http://192.168.0.181:8080', 'http://localhost:3000', 'http://localhost:5173'],
            responseHeader: [
              'Content-Type', 
              'Authorization', 
              'Content-Length', 
              'User-Agent', 
              'x-goog-resumable', 
              'Content-Disposition',
              'Accept',
              'Origin',
              'X-Requested-With',
              'Access-Control-Allow-Origin',
              'ETag'
            ],
            method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
            maxAgeSeconds: 3600
          }
        };
        
        // Try uploadBytes with enhanced metadata
        console.log("Attempting upload with enhanced metadata");
        uploadResult = await uploadBytes(storageRef, blob, enhancedMetadata);
        console.log("Upload successful:", uploadResult.ref.fullPath);
        break; // Success, exit loop
      } catch (err) {
        console.warn(`Upload attempt ${attempt} failed:`, err);
        
        // If we're on the last attempt, try a different approach for HTTP origins
        if (attempt >= maxAttempts - 1 && origin.startsWith('http:')) {
          try {
            console.log("Trying alternative upload approach for HTTP origin");
            // Simpler metadata for the last attempt
            const simpleMetadata = {
              contentType: file.type,
            };
            
            // Try uploadBytesResumable as a fallback for HTTP origins
            const uploadTask = uploadBytesResumable(storageRef, blob, simpleMetadata);
            const snapshot = await uploadTask;
            uploadResult = snapshot;
            console.log("Alternative upload approach successful");
            break;
          } catch (alternativeErr) {
            console.error("Alternative upload approach failed:", alternativeErr);
          }
        }
        
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

// Alternative upload method using fetch directly (better CORS support)
const fetchUploadFile = async (path: string, file: File, metadata?: any) => {
  try {
    console.log("Starting direct fetch upload method for path:", path);
    
    // Create a full URL for the upload
    const bucket = firebaseConfig.storageBucket;
    const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?name=${encodeURIComponent(path)}`;
    
    console.log("Using upload URL:", uploadUrl);
    
    // Prepare headers for the request
    const headers = new Headers();
    headers.append('Content-Type', file.type);
    headers.append('X-Goog-Upload-Protocol', 'resumable');
    headers.append('X-Goog-Upload-Command', 'start');
    
    // Add CORS-related headers
    headers.append('Origin', window.location.origin);
    headers.append('Access-Control-Request-Method', 'POST');
    headers.append('Access-Control-Request-Headers', 'Content-Type, X-Goog-Upload-Protocol, X-Goog-Upload-Command');
    
    // Upload the file using fetch API
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: headers,
      body: file,
      mode: 'cors',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
    }
    
    // Parse the response to get the file URL
    const data = await response.json();
    console.log("Upload response:", data);
    
    // Get the download URL
    let downloadUrl = data.mediaLink;
    if (!downloadUrl) {
      downloadUrl = `https://storage.googleapis.com/${bucket}/${encodeURIComponent(path)}`;
    }
    
    return {
      success: true,
      url: downloadUrl,
      metadata: data
    };
  } catch (error) {
    console.error("Error in fetchUploadFile:", error);
    return {
      success: false,
      error,
      usedMethod: 'fetch'
    };
  }
};

// Modify the enhancedUploadFile function to include the fetch upload method
const enhancedUploadFile = async (path: string, file: File, metadata?: any, useLocalFallback = true) => {
  console.log("Enhanced upload for file:", file.name, "to path:", path);
  
  // First try the normal Firebase upload
  try {
    const result = await safeUploadFile(path, file, metadata);
    if (result.success) {
      console.log("Standard upload succeeded");
      return result;
    }
    
    console.log("Standard upload failed, trying fetch method");
    // If that fails, try the fetch method
    const fetchResult = await fetchUploadFile(path, file, metadata);
    if (fetchResult.success) {
      console.log("Fetch upload succeeded");
      return fetchResult;
    }
    
    // If that also fails and local fallback is enabled, use localStorage
    if (useLocalFallback) {
      console.log("All remote methods failed, using local storage fallback");
      return await localStorageFallback(file);
    }
    
    return { success: false, error: "All upload methods failed" };
  } catch (error) {
    console.error("Error in enhancedUploadFile:", error);
    
    // Try local fallback if enabled
    if (useLocalFallback) {
      console.log("Error occurred, using local storage fallback");
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
  functions,
  testFirestore,
  safeUploadFile, 
  enhancedUploadFile, 
  localStorageFallback 
}; 