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
import { db } from '../lib/firebase';
import { Lead, LeadStage } from '../types/lead';

interface LeadInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  projectRequirementTitle: string;
  projectRequirementDetails: string;
  stage: LeadStage;
  value?: number;
}

// Add a new lead
export const addLead = async (leadData: LeadInput, userId: string): Promise<string> => {
  try {
    const leadCollection = collection(db, 'leads');
    const docRef = await addDoc(leadCollection, {
      ...leadData,
      assignedTo: userId,
      value: leadData.value || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      notes: []
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding lead:', error);
    throw new Error('Failed to add lead');
  }
};

// Get leads for a specific user
export const getLeadsByUser = async (userId: string): Promise<Lead[]> => {
  try {
    console.log('Fetching leads for user:', userId);
    const leadsRef = collection(db, 'leads');
    
    // First try a simple query without orderBy to see if that works
    const q = query(
      leadsRef,
      where('assignedTo', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('Query result count:', querySnapshot.size);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Safely handle timestamp fields that might be null
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
      
      // Ensure all required fields exist with default values if missing
      return {
        id: doc.id,
        name: data.name || '',
        company: data.company || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        projectRequirementTitle: data.projectRequirementTitle || '',
        projectRequirementDetails: data.projectRequirementDetails || '',
        stage: data.stage || 'new',
        value: data.value || 0,
        assignedTo: data.assignedTo || userId,
        createdAt,
        updatedAt,
        notes: data.notes || []
      } as Lead;
    });
  } catch (error) {
    console.error('Error getting leads:', error);
    throw new Error('Failed to fetch leads');
  }
};

// Get a single lead by ID
export const getLeadById = async (leadId: string): Promise<Lead | null> => {
  try {
    const docRef = doc(db, 'leads', leadId);
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
      : new Date().toISOString();
      
    const updatedAt = data.updatedAt
      ? data.updatedAt instanceof Timestamp 
        ? data.updatedAt.toDate().toISOString() 
        : data.updatedAt
      : new Date().toISOString();
    
    return {
      id: docSnap.id,
      name: data.name || '',
      company: data.company || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      projectRequirementTitle: data.projectRequirementTitle || '',
      projectRequirementDetails: data.projectRequirementDetails || '',
      stage: data.stage || 'new',
      value: data.value || 0,
      assignedTo: data.assignedTo || '',
      createdAt,
      updatedAt,
      notes: data.notes || []
    } as Lead;
  } catch (error) {
    console.error('Error getting lead:', error);
    throw new Error('Failed to fetch lead');
  }
};

// Update a lead
export const updateLead = async (leadId: string, leadData: Partial<LeadInput>): Promise<void> => {
  try {
    const docRef = doc(db, 'leads', leadId);
    await updateDoc(docRef, {
      ...leadData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    throw new Error('Failed to update lead');
  }
};

// Delete a lead
export const deleteLead = async (leadId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'leads', leadId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw new Error('Failed to delete lead');
  }
};

// Add a note to a lead
export const addNoteToLead = async (leadId: string, content: string, userId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'leads', leadId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Lead not found');
    }
    
    const data = docSnap.data();
    const notes = data.notes || [];
    
    const newNote = {
      id: `note-${Date.now()}`,
      content,
      createdBy: userId,
      createdAt: new Date().toISOString()
    };
    
    await updateDoc(docRef, {
      notes: [...notes, newNote],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding note:', error);
    throw new Error('Failed to add note');
  }
};

// Get all leads (for admin)
export const getAllLeads = async (): Promise<Lead[]> => {
  try {
    console.log('Fetching all leads');
    const leadsRef = collection(db, 'leads');
    const querySnapshot = await getDocs(leadsRef);
    
    console.log('Query result count:', querySnapshot.size);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Safely handle timestamp fields that might be null
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
      
      // Ensure all required fields exist with default values if missing
      return {
        id: doc.id,
        name: data.name || '',
        company: data.company || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        projectRequirementTitle: data.projectRequirementTitle || '',
        projectRequirementDetails: data.projectRequirementDetails || '',
        stage: data.stage || 'new',
        value: data.value || 0,
        assignedTo: data.assignedTo || '',
        createdAt,
        updatedAt,
        notes: data.notes || []
      } as Lead;
    });
  } catch (error) {
    console.error('Error getting all leads:', error);
    throw new Error('Failed to fetch leads');
  }
}; 