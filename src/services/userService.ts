import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  Timestamp,
  setDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  getAuth, 
  updateProfile 
} from 'firebase/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt?: string;
  active: boolean;
}

interface UserInput {
  name: string;
  email: string;
  role: string;
  password: string;
}

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Safely handle timestamp fields
      const createdAt = data.createdAt 
        ? data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate().toISOString() 
          : data.createdAt
        : undefined;
      
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'user',
        avatar: data.avatar || '',
        createdAt,
        active: data.active !== false, // Default to true if not specified
      } as User;
    });
  } catch (error) {
    console.error('Error getting users:', error);
    throw new Error('Failed to fetch users');
  }
};

// Get a single user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    
    // Safely handle timestamp fields
    const createdAt = data.createdAt 
      ? data.createdAt instanceof Timestamp 
        ? data.createdAt.toDate().toISOString() 
        : data.createdAt
      : undefined;
    
    return {
      id: docSnap.id,
      name: data.name || '',
      email: data.email || '',
      role: data.role || 'user',
      avatar: data.avatar || '',
      createdAt,
      active: data.active !== false, // Default to true if not specified
    } as User;
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error('Failed to fetch user');
  }
};

// Update a user's active status
export const updateUserStatus = async (userId: string, active: boolean): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, { active });
  } catch (error) {
    console.error('Error updating user status:', error);
    throw new Error('Failed to update user status');
  }
};

// Update a user's role
export const updateUserRole = async (userId: string, role: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, { role });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error('Failed to update user role');
  }
}; 

// Add a new user
export const addUser = async (userData: UserInput): Promise<User> => {
  try {
    // Create the user in Firebase Authentication
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    // Update the user's display name
    await updateProfile(userCredential.user, {
      displayName: userData.name
    });
    
    // Create the user document in Firestore
    const userRef = doc(db, 'users', userCredential.user.uid);
    const userDoc = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      active: true,
      createdAt: serverTimestamp()
    };
    
    await setDoc(userRef, userDoc);
    
    // Return the newly created user
    return {
      id: userCredential.user.uid,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      active: true,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error adding user:', error);
    throw new Error('Failed to add user');
  }
}; 