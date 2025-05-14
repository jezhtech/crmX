import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Generic function to get all documents from a collection
export const getCollection = async (collectionName: string) => {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Function to get a single document by ID
export const getDocument = async (collectionName: string, docId: string) => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } else {
    return null;
  }
};

// Function to add a new document to a collection
export const addDocument = async (collectionName: string, data: any) => {
  const collectionRef = collection(db, collectionName);
  const docRef = await addDoc(collectionRef, data);
  return docRef.id;
};

// Function to update a document
export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, data);
  return true;
};

// Function to delete a document
export const deleteDocument = async (collectionName: string, docId: string) => {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
  return true;
};

// Function to query documents with conditions
export const queryDocuments = async (collectionName: string, conditions: any[], sortBy?: { field: string, direction: 'asc' | 'desc' }) => {
  const collectionRef = collection(db, collectionName);
  
  let q = query(collectionRef);
  
  // Add all where conditions
  conditions.forEach(condition => {
    q = query(q, where(condition.field, condition.operator, condition.value));
  });
  
  // Add sorting if provided
  if (sortBy) {
    q = query(q, orderBy(sortBy.field, sortBy.direction));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}; 