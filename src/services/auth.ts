import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types/auth';

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }
    
    const userData = userDoc.data();
    
    return {
      id: user.uid,
      email: user.email || '',
      name: userData.name || '',
      role: userData.role || 'user',
      avatar: userData.avatar || '',
    };
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Register a new user
export const registerUser = async (email: string, password: string, userData: Partial<User>): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name: userData.name || '',
      email: user.email,
      role: userData.role || 'user',
      avatar: userData.avatar || '',
      createdAt: new Date().toISOString(),
    });
    
    if (userData.name && user) {
      await updateProfile(user, {
        displayName: userData.name
      });
    }
    
    return {
      id: user.uid,
      email: user.email || '',
      name: userData.name || '',
      role: userData.role || 'user',
      avatar: userData.avatar || '',
    };
  } catch (error: any) {
    console.error('Error creating account:', error);
    throw new Error(error.message || 'Failed to create account');
  }
};

// Sign out
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error resetting password:', error);
    throw new Error(error.message || 'Failed to reset password');
  }
};

// Get current user
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      
      if (!user) {
        resolve(null);
        return;
      }
      
      try {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          resolve(null);
          return;
        }
        
        const userData = userDoc.data();
        
        resolve({
          id: user.uid,
          email: user.email || '',
          name: userData.name || '',
          role: userData.role || 'user',
          avatar: userData.avatar || '',
        });
      } catch (error) {
        console.error('Error getting user data:', error);
        resolve(null);
      }
    });
  });
}; 