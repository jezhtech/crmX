import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage, safeUploadFile, enhancedUploadFile } from '../lib/firebase';

export type DocumentType = 
  | 'proposal' 
  | 'invoice' 
  | 'contract' 
  | 'receipt' 
  | 'project_closure' 
  | 'client_document' 
  | 'project_details'
  | 'other';

export interface Document {
  id: string;
  fileName: string;
  originalFileName?: string;
  fileUrl: string;
  fileSize: string;
  fileType: string;
  type: DocumentType;
  leadId: string;
  leadName: string;
  company: string;
  description?: string;
  tags?: string[];
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentInput {
  fileName: string;
  originalFileName?: string;
  file: File;
  type: DocumentType;
  leadId: string;
  leadName: string;
  company: string;
  description?: string;
  tags?: string[];
  uploadedBy: string;
}

// Define an interface for upload results
interface UploadResult {
  success: boolean;
  url?: string;
  ref?: any;
  error?: any;
  isLocal?: boolean;
  metadata?: any;
}

// Get all documents
export const getAllDocuments = async (): Promise<Document[]> => {
  try {
    console.log('Fetching all documents...');
    const docsRef = collection(db, 'documents');
    
    try {
      const querySnapshot = await getDocs(docsRef);
      console.log(`Found ${querySnapshot.size} documents`);
      
      const documents = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Safely handle timestamp fields
        const createdAt = data.createdAt 
          ? data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate().toISOString() 
            : data.createdAt
          : new Date().toISOString();
        
        const updatedAt = data.updatedAt
          ? data.updatedAt instanceof Timestamp 
            ? data.updatedAt.toDate().toISOString() 
            : data.updatedAt
          : new Date().toISOString();
        
        return {
          id: doc.id,
          fileName: data.fileName || '',
          fileUrl: data.fileUrl || '',
          fileSize: data.fileSize || '',
          fileType: data.fileType || '',
          type: data.type || 'other',
          leadId: data.leadId || '',
          leadName: data.leadName || '',
          company: data.company || '',
          description: data.description || '',
          tags: data.tags || [],
          uploadedBy: data.uploadedBy || '',
          createdAt,
          updatedAt
        } as Document;
      });
      
      console.log('Documents processed successfully:', documents.length);
      return documents;
    } catch (fetchError) {
      console.error('Error fetching documents from Firestore:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error getting documents:', error);
    throw new Error('Failed to fetch documents');
  }
};

// Get documents by lead ID
export const getDocumentsByLead = async (leadId: string): Promise<Document[]> => {
  try {
    const docsRef = collection(db, 'documents');
    const q = query(
      docsRef,
      where('leadId', '==', leadId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Safely handle timestamp fields
      const createdAt = data.createdAt 
        ? data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate().toISOString() 
          : data.createdAt
        : new Date().toISOString();
      
      const updatedAt = data.updatedAt
        ? data.updatedAt instanceof Timestamp 
          ? data.updatedAt.toDate().toISOString() 
          : data.updatedAt
        : new Date().toISOString();
      
      return {
        id: doc.id,
        fileName: data.fileName || '',
        fileUrl: data.fileUrl || '',
        fileSize: data.fileSize || '',
        fileType: data.fileType || '',
        type: data.type || 'other',
        leadId: data.leadId || '',
        leadName: data.leadName || '',
        company: data.company || '',
        description: data.description || '',
        tags: data.tags || [],
        uploadedBy: data.uploadedBy || '',
        createdAt,
        updatedAt
      } as Document;
    });
  } catch (error) {
    console.error('Error getting documents by lead:', error);
    throw new Error('Failed to fetch lead documents');
  }
};

// Get documents by type
export const getDocumentsByType = async (type: DocumentType): Promise<Document[]> => {
  try {
    const docsRef = collection(db, 'documents');
    const q = query(
      docsRef,
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Safely handle timestamp fields
      const createdAt = data.createdAt 
        ? data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate().toISOString() 
          : data.createdAt
        : new Date().toISOString();
      
      const updatedAt = data.updatedAt
        ? data.updatedAt instanceof Timestamp 
          ? data.updatedAt.toDate().toISOString() 
          : data.updatedAt
        : new Date().toISOString();
      
      return {
        id: doc.id,
        fileName: data.fileName || '',
        fileUrl: data.fileUrl || '',
        fileSize: data.fileSize || '',
        fileType: data.fileType || '',
        type: data.type || 'other',
        leadId: data.leadId || '',
        leadName: data.leadName || '',
        company: data.company || '',
        description: data.description || '',
        tags: data.tags || [],
        uploadedBy: data.uploadedBy || '',
        createdAt,
        updatedAt
      } as Document;
    });
  } catch (error) {
    console.error('Error getting documents by type:', error);
    throw new Error('Failed to fetch documents by type');
  }
};

// Upload a new document
export const uploadDocument = async (documentData: DocumentInput): Promise<Document> => {
  try {
    console.log('Starting document upload:', documentData.fileName);
    
    // 1. Upload file to Firebase Storage using our enhanced method with fallback
    const file = documentData.file;
    
    // Use the original file name if provided, otherwise use the file's name
    const originalFileName = documentData.originalFileName || file.name;
    
    // Create a unique identifier but keep the original file name
    const referenceNumber = Date.now().toString();
    const storageFileName = `${referenceNumber}_${originalFileName}`;
    const storagePath = `documents/${storageFileName}`;
    
    console.log('Creating storage path:', storagePath);
    
    try {
      // Add metadata with content type
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'fileName': documentData.fileName,
          'originalFileName': originalFileName,
          'referenceNumber': referenceNumber
        }
      };
      
      // Use the enhanced upload method with fallback
      const uploadResult = await enhancedUploadFile(storagePath, file, metadata) as UploadResult;
      
      if (!uploadResult.success) {
        throw new Error("Upload failed: " + (uploadResult.error || "Unknown error"));
      }
      
      console.log('File uploaded successfully.');
      
      const fileUrl = uploadResult.url;
      console.log('Download URL obtained:', fileUrl);
      
      // Check if it's a local storage file
      const isLocalStorage = !!uploadResult.isLocal;
      
      // 2. Create document record in Firestore
      const docData: any = {
        fileName: documentData.fileName,
        originalFileName: originalFileName,
        fileUrl: fileUrl,
        fileSize: formatFileSize(file.size),
        fileType: file.type,
        type: documentData.type,
        leadId: documentData.leadId,
        leadName: documentData.leadName,
        company: documentData.company,
        description: documentData.description || '',
        tags: documentData.tags || [],
        uploadedBy: documentData.uploadedBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add local storage info if applicable
      if (isLocalStorage) {
        docData.isLocalStorage = true;
        docData.localMetadata = uploadResult.metadata;
      }
      
      console.log('Creating Firestore document with data:', docData);
      
      const docsRef = collection(db, 'documents');
      const docRef = await addDoc(docsRef, docData);
      console.log('Document created in Firestore with ID:', docRef.id);
      
      // 3. Return the created document
      return {
        id: docRef.id,
        ...docData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Document;
    } catch (uploadError) {
      console.error('Error during upload process:', uploadError);
      throw uploadError;
    }
  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error('Failed to upload document');
  }
};

// Delete a document
export const deleteDocument = async (docId: string, storageUrl: string): Promise<void> => {
  try {
    console.log('Attempting to delete document:', docId);
    console.log('Storage URL:', storageUrl);
    
    // Extract the path from the storage URL
    let storageRef;
    try {
      // If it's a full URL (https://...), we need to extract the path
      if (storageUrl.startsWith('https://')) {
        // Extract the path after the storage bucket
        const urlParts = storageUrl.split('o/')[1];
        if (urlParts) {
          const path = decodeURIComponent(urlParts.split('?')[0]);
          console.log('Extracted path from URL:', path);
          storageRef = ref(storage, path);
        } else {
          console.error('Invalid storage URL format, cannot extract path');
          storageRef = ref(storage, storageUrl);
        }
      } else {
        // It's already a path
        storageRef = ref(storage, storageUrl);
      }
      
      console.log('Storage reference created:', storageRef.fullPath);
      
      // 1. Delete the file from storage
      await deleteObject(storageRef);
      console.log('File deleted from storage');
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue to delete the document record even if storage deletion fails
    }
    
    // 2. Delete the document record from Firestore
    const docRef = doc(db, 'documents', docId);
    await deleteDoc(docRef);
    console.log('Document record deleted from Firestore');
  } catch (error) {
    console.error('Error deleting document:', error);
    throw new Error('Failed to delete document');
  }
};

// Update document metadata
export const updateDocumentMetadata = async (
  docId: string, 
  metadata: Partial<Omit<Document, 'id' | 'fileUrl' | 'fileSize' | 'fileType' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, 'documents', docId);
    await updateDoc(docRef, {
      ...metadata,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating document metadata:', error);
    throw new Error('Failed to update document metadata');
  }
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 