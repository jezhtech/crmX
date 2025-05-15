import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  where,
  serverTimestamp,
  Timestamp,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";

// Define the log entry interface
export interface UserLogEntry {
  id?: string;
  userId: string;
  userName: string;
  action: string; // login, create, update, delete, etc.
  resourceType: string; // lead, user, document, chat, etc.
  resourceId?: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date | Timestamp;
}

// Collection name
const LOGS_COLLECTION = "user_logs";

// Function to add a new log entry
export const addLogEntry = async (entry: Omit<UserLogEntry, "timestamp" | "id">): Promise<string> => {
  try {
    // Only include resourceId if defined
    const logData: any = {
      ...entry,
      timestamp: serverTimestamp(),
    };
    if (entry.resourceId !== undefined) {
      logData.resourceId = entry.resourceId;
    }
    const docRef = await addDoc(collection(db, LOGS_COLLECTION), logData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding log entry:", error);
    throw error;
  }
};

// Function to get client IP address
export const getClientIP = async (): Promise<string> => {
  try {
    // Try to fetch from public API
    try {
      const response = await fetch('https://api.ipify.org?format=json', { 
        mode: 'cors',
        cache: 'no-cache'
      });
      if (response.ok) {
        const data = await response.json();
        return data.ip;
      }
    } catch (error) {
      console.warn("Could not get IP from external service:", error);
    }
    
    // Fallback to localhost if fetch fails
    return "127.0.0.1";
  } catch (error) {
    console.error("Error getting IP address:", error);
    return "unknown";
  }
};

// Function to log user actions with IP address
export const logUserAction = async (
  userId: string,
  userName: string,
  action: string,
  resourceType: string,
  description: string,
  resourceId?: string
): Promise<void> => {
  try {
    console.log(`Logging action: ${action} for user: ${userId}`);
    const ipAddress = await getClientIP();
    const userAgent = window.navigator.userAgent;
    
    // Prepare log entry data
    const logData: any = {
      userId,
      userName,
      action,
      resourceType,
      description,
      ipAddress,
      userAgent,
    };
    
    // Only add resourceId if it exists
    if (resourceId) {
      logData.resourceId = resourceId;
    }
    
    // Add the log entry
    const docId = await addLogEntry(logData);
    console.log(`Log entry created with ID: ${docId}`);
  } catch (error) {
    console.error("Error logging user action:", error);
  }
};

// Interface for pagination
export interface PaginatedResult<T> {
  items: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

// Function to get paginated logs
export const getLogs = async (
  pageSize = 20, 
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<PaginatedResult<UserLogEntry>> => {
  try {
    let logsQuery = query(
      collection(db, LOGS_COLLECTION),
      orderBy("timestamp", "desc"),
      limit(pageSize + 1) // Get one extra to check if there are more
    );

    if (startAfterDoc) {
      logsQuery = query(logsQuery, startAfter(startAfterDoc));
    }

    const snapshot = await getDocs(logsQuery);
    const logs: UserLogEntry[] = [];
    let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    
    // Check if we have more items
    const hasMore = snapshot.size > pageSize;
    
    // Process only the requested page size
    const docsToProcess = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    
    docsToProcess.forEach((doc) => {
      const data = doc.data();
      lastDoc = doc;
      
      // Convert Firestore timestamp to Date if needed
      let timestamp: Date | Timestamp;
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        timestamp = data.timestamp.toDate();
      } else {
        timestamp = new Date();
      }
      
      logs.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: timestamp,
      });
    });
    
    return {
      items: logs,
      lastDoc,
      hasMore,
    };
  } catch (error) {
    console.error("Error fetching logs:", error);
    throw error;
  }
};

// Function to get logs for a specific user
export const getUserLogs = async (
  userId: string,
  pageSize = 20,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<PaginatedResult<UserLogEntry>> => {
  try {
    let logsQuery = query(
      collection(db, LOGS_COLLECTION),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(pageSize + 1)
    );

    if (startAfterDoc) {
      logsQuery = query(logsQuery, startAfter(startAfterDoc));
    }

    const snapshot = await getDocs(logsQuery);
    const logs: UserLogEntry[] = [];
    let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    
    const hasMore = snapshot.size > pageSize;
    const docsToProcess = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    
    docsToProcess.forEach((doc) => {
      const data = doc.data();
      lastDoc = doc;
      
      let timestamp: Date | Timestamp;
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        timestamp = data.timestamp.toDate();
      } else {
        timestamp = new Date();
      }
      
      logs.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: timestamp,
      });
    });
    
    return {
      items: logs,
      lastDoc,
      hasMore,
    };
  } catch (error) {
    console.error("Error fetching user logs:", error);
    throw error;
  }
};

// Function to filter logs by action type
export const getLogsByAction = async (
  action: string,
  pageSize = 20,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<PaginatedResult<UserLogEntry>> => {
  try {
    let logsQuery = query(
      collection(db, LOGS_COLLECTION),
      where("action", "==", action),
      orderBy("timestamp", "desc"),
      limit(pageSize + 1)
    );

    if (startAfterDoc) {
      logsQuery = query(logsQuery, startAfter(startAfterDoc));
    }

    const snapshot = await getDocs(logsQuery);
    const logs: UserLogEntry[] = [];
    let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    
    const hasMore = snapshot.size > pageSize;
    const docsToProcess = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    
    docsToProcess.forEach((doc) => {
      const data = doc.data();
      lastDoc = doc;
      
      let timestamp: Date | Timestamp;
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        timestamp = data.timestamp.toDate();
      } else {
        timestamp = new Date();
      }
      
      logs.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: timestamp,
      });
    });
    
    return {
      items: logs,
      lastDoc,
      hasMore,
    };
  } catch (error) {
    console.error("Error fetching logs by action:", error);
    throw error;
  }
};

// Function to get logs by resource type
export const getLogsByResourceType = async (
  resourceType: string,
  pageSize = 20,
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<PaginatedResult<UserLogEntry>> => {
  try {
    let logsQuery = query(
      collection(db, LOGS_COLLECTION),
      where("resourceType", "==", resourceType),
      orderBy("timestamp", "desc"),
      limit(pageSize + 1)
    );

    if (startAfterDoc) {
      logsQuery = query(logsQuery, startAfter(startAfterDoc));
    }

    const snapshot = await getDocs(logsQuery);
    const logs: UserLogEntry[] = [];
    let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
    
    const hasMore = snapshot.size > pageSize;
    const docsToProcess = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    
    docsToProcess.forEach((doc) => {
      const data = doc.data();
      lastDoc = doc;
      
      let timestamp: Date | Timestamp;
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        timestamp = data.timestamp.toDate();
      } else {
        timestamp = new Date();
      }
      
      logs.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        description: data.description,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: timestamp,
      });
    });
    
    return {
      items: logs,
      lastDoc,
      hasMore,
    };
  } catch (error) {
    console.error("Error fetching logs by resource type:", error);
    throw error;
  }
}; 