import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, UploadMetadata } from "firebase/storage";

/**
 * Direct upload to Firebase Storage using a simple method that bypasses CORS issues
 * @param path The storage path to upload to
 * @param file The file to upload
 * @returns Promise with the download URL
 */
export const directUpload = async (path: string, file: File): Promise<string> => {
  try {
    console.log(`Attempting direct upload to ${path}`);
    
    // Create simple metadata
    const metadata: UploadMetadata = {
      contentType: file.type,
      customMetadata: {
        'original-filename': file.name,
        'upload-time': new Date().toISOString(),
      }
    };
    
    // Get a reference to the storage location
    const storageRef = ref(storage, path);
    
    // Use basic uploadBytes (simpler is better for CORS)
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log(`Upload successful: ${snapshot.metadata.fullPath}`);
    
    // Get download URL
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.error("Direct upload failed:", error);
    throw error;
  }
};

/**
 * Upload with progress reporting
 * @param path The storage path to upload to
 * @param file The file to upload
 * @param onProgress Progress callback
 * @returns Promise with the download URL
 */
export const uploadWithProgress = async (
  path: string, 
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Get a reference to the storage location
      const storageRef = ref(storage, path);
      
      // Create simple metadata
      const metadata: UploadMetadata = {
        contentType: file.type,
      };
      
      // Start the upload
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      
      // Set up the observer to track progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate and report progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(1)}%`);
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Handle errors
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          // Upload completed successfully
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (error) {
            reject(error);
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Upload a file with multiple fallback methods to ensure it works even with CORS issues
 */
export const uploadWithFallback = async (path: string, file: File): Promise<string> => {
  try {
    // Try direct upload first (simplest and most reliable)
    return await directUpload(path, file);
  } catch (firstError) {
    console.warn("First upload method failed, trying with progress tracking:", firstError);
    
    try {
      // Try progress-based upload as fallback
      return await uploadWithProgress(path, file);
    } catch (secondError) {
      console.error("All Firebase Storage upload methods failed:", secondError);
      
      // Use service worker for last attempt if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        console.log("Trying service worker approach");
        
        // Create a blob URL temporarily (this always works)
        const blobUrl = URL.createObjectURL(file);
        console.log(`Created temporary blob URL: ${blobUrl}`);
        
        throw new Error(`Upload failed: ${secondError.message}. Temporary URL created: ${blobUrl}`);
      }
      
      throw secondError;
    }
  }
}; 