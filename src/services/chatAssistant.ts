import { db, storage, safeUploadFile } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  where,
  serverTimestamp,
  DocumentData,
  Timestamp,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface ChatMessage {
  id?: string;
  userId: string;
  userName?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date | Timestamp;
}

export interface TrainingDocument {
  id?: string;
  title: string;
  content: string;
  category: string;
  fileUrl?: string;
  fileName?: string;
  timestamp: Date | Timestamp;
}

// Collection names
const CHAT_COLLECTION = "chat_messages";
const TRAINING_DOCS_COLLECTION = "training_documents";
const NOTIFICATIONS_COLLECTION = "notifications";

// Add a new message to the chat
export const addChatMessage = async (message: Omit<ChatMessage, "timestamp" | "id">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, CHAT_COLLECTION), {
      ...message,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding chat message:", error);
    throw error;
  }
};

// Get chat history for a specific user
export const getUserChatHistory = async (userId: string, messageLimit = 50): Promise<ChatMessage[]> => {
  try {
    const q = query(
      collection(db, CHAT_COLLECTION),
      where("userId", "==", userId),
      orderBy("timestamp", "asc"),
      limit(messageLimit)
    );
    
    const querySnapshot = await getDocs(q);
    const messages: ChatMessage[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as DocumentData;
      messages.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp || new Date(), // Ensure there's always a timestamp
      });
    });
    
    return messages;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

// Subscribe to real-time chat updates
export const subscribeToUserChat = (userId: string, callback: (messages: ChatMessage[]) => void) => {
  const q = query(
    collection(db, CHAT_COLLECTION),
    where("userId", "==", userId),
    orderBy("timestamp", "asc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];
    
    snapshot.docChanges().forEach((change) => {
      // Log changes to help debug
      console.log("Change type:", change.type, "doc id:", change.doc.id);
    });
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Explicitly handle Firestore timestamps
      let timestamp: Date | Timestamp;
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        timestamp = data.timestamp.toDate();
      } else {
        timestamp = new Date();
      }
      
      messages.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        role: data.role,
        content: data.content,
        timestamp: timestamp,
      });
    });
    
    // Log the messages array to verify it's being populated correctly
    console.log("Real-time chat messages:", messages.length);
    
    // Sort messages by timestamp to ensure proper order
    messages.sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
      return timeA - timeB;
    });
    
    callback(messages);
  }, (error) => {
    console.error("Error subscribing to chat:", error);
  });
};

// Training document functions
export const addTrainingDocument = async (document: Omit<TrainingDocument, "timestamp" | "id">, file?: File): Promise<string> => {
  try {
    let fileUrl = "";
    let fileName = "";
    
    // Upload file if provided
    if (file) {
      const storagePath = `training_documents/${Date.now()}_${file.name}`;
      
      // Use our safer upload method
      const uploadResult = await safeUploadFile(storagePath, file);
      
      if (!uploadResult.success) {
        throw new Error("Upload failed: " + (uploadResult.error || "Unknown error"));
      }
      
      fileUrl = uploadResult.url;
      fileName = file.name;
    }
    
    const docRef = await addDoc(collection(db, TRAINING_DOCS_COLLECTION), {
      ...document,
      fileUrl,
      fileName,
      timestamp: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error adding training document:", error);
    throw error;
  }
};

export const getTrainingDocuments = async (): Promise<TrainingDocument[]> => {
  try {
    const q = query(
      collection(db, TRAINING_DOCS_COLLECTION),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const documents: TrainingDocument[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        title: data.title,
        content: data.content,
        category: data.category,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        timestamp: data.timestamp,
      });
    });
    
    return documents;
  } catch (error) {
    console.error("Error fetching training documents:", error);
    throw error;
  }
};

// Improved response generation - uses training documents
export const getAIResponse = async (query: string): Promise<string> => {
  const normalizedQuery = query.toLowerCase().trim();
  
  // First check predefined responses
  const predefinedResponse = getPredefinedResponse(normalizedQuery);
  if (predefinedResponse) return predefinedResponse;
  
  // Then try to find relevant training document
  try {
    const documents = await getTrainingDocuments();
    
    for (const doc of documents) {
      // Simple keyword matching for now
      if (doc.content.toLowerCase().includes(normalizedQuery) ||
          doc.title.toLowerCase().includes(normalizedQuery)) {
        // Extract relevant paragraphs
        const paragraphs = doc.content.split('\n\n');
        for (const paragraph of paragraphs) {
          if (paragraph.toLowerCase().includes(normalizedQuery)) {
            return paragraph;
          }
        }
        // If no specific paragraph matches, return whole document
        return `Based on our documentation: ${doc.content.substring(0, 500)}${doc.content.length > 500 ? '...' : ''}`;
      }
    }
    
    // Default response if no documents match
    return "I don't have specific information about that yet. Please contact our support team for more details at support@crmx.com or call +91-123-456-7890.";
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I'm having trouble accessing my knowledge base at the moment. Please try again later or contact our support team.";
  }
};

// Predefined responses for common questions
export const getPredefinedResponse = (query: string): string | null => {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Simple mapping of keywords to responses
  const responses: Record<string, string> = {
    "pricing": "Our CRM pricing starts at ₹999/month for the basic plan, ₹1999/month for the standard plan, and ₹2999/month for the premium plan. Each plan includes different features and user limits.",
    "features": "Our CRM includes lead management, contact management, sales pipeline tracking, email integration, task management, reporting and analytics, and mobile access.",
    "trial": "Yes! We offer a 14-day free trial with full access to all premium features. No credit card required to start.",
    "support": "We provide 24/7 customer support via chat, email, and phone for all paid plans. Basic plan users receive email support during business hours.",
    "integrations": "Our CRM integrates with popular tools including Gmail, Outlook, Slack, Zapier, Google Calendar, and many more.",
    "security": "We take security seriously. All data is encrypted in transit and at rest. We perform regular security audits and are compliant with industry standards.",
    "contact": "You can reach our sales team at sales@crmx.com or call us at +91-123-456-7890 during business hours.",
    "help": "I can answer questions about our pricing, features, integrations, support options, and more. Just ask away!",
  };
  
  // Check for keywords in the query
  for (const [keyword, response] of Object.entries(responses)) {
    if (normalizedQuery.includes(keyword)) {
      return response;
    }
  }
  
  // Default response if no keywords match
  return null;
};

// Notification functions
export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  timestamp: Date | Timestamp;
}

export const addNotification = async (notification: Omit<Notification, "timestamp" | "id" | "isRead">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notification,
      isRead: false,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding notification:", error);
    throw error;
  }
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    // Get notifications without composite index by not using orderBy with where
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        message: data.message,
        isRead: data.isRead,
        timestamp: data.timestamp,
      });
    });
    
    // Sort notifications client-side instead of using orderBy
    notifications.sort((a, b) => {
      const timeA = a.timestamp instanceof Date 
        ? a.timestamp.getTime() 
        : a.timestamp && typeof a.timestamp.toDate === 'function'
          ? a.timestamp.toDate().getTime()
          : 0;
      
      const timeB = b.timestamp instanceof Date 
        ? b.timestamp.getTime() 
        : b.timestamp && typeof b.timestamp.toDate === 'function'
          ? b.timestamp.toDate().getTime()
          : 0;
          
      return timeB - timeA; // descending order (newest first)
    });
    
    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION, notificationId), {
      isRead: true,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
  };
