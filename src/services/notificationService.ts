import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Lead } from '../types/lead';

const NOTIFICATIONS_COLLECTION = "notifications";

export interface LeadNotification {
  id?: string;
  userId: string;
  leadId: string;
  leadName: string;
  title: string;
  message: string;
  type: 'new_lead' | 'status_change' | 'lead_update';
  isRead: boolean;
  timestamp: Date | Timestamp;
}

/**
 * Creates a notification for a new lead
 */
export const createNewLeadNotification = async (lead: Lead, createdBy: string): Promise<string> => {
  try {
    // Create notification for all admin users
    const notification = {
      userId: 'admin', // Special value to indicate this is for all admins
      leadId: lead.id,
      leadName: lead.name,
      title: 'New Lead Added',
      message: `${lead.name} from ${lead.company} has been added by ${createdBy}`,
      type: 'new_lead' as const,
      isRead: false,
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notification);
    return docRef.id;
  } catch (error) {
    console.error('Error creating lead notification:', error);
    throw new Error('Failed to create notification');
  }
};

/**
 * Creates a notification for a lead status change
 */
export const createStatusChangeNotification = async (
  lead: Lead, 
  oldStatus: string, 
  newStatus: string,
  updatedBy: string
): Promise<string> => {
  try {
    // Create notification for all admin users
    const notification = {
      userId: 'admin', // Special value to indicate this is for all admins
      leadId: lead.id,
      leadName: lead.name,
      title: 'Lead Status Changed',
      message: `${lead.name} status changed from ${oldStatus} to ${newStatus} by ${updatedBy}`,
      type: 'status_change' as const,
      isRead: false,
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notification);
    return docRef.id;
  } catch (error) {
    console.error('Error creating status change notification:', error);
    throw new Error('Failed to create notification');
  }
};

/**
 * Get all admin notifications (unfiltered by user)
 */
export const getAdminNotifications = async (): Promise<LeadNotification[]> => {
  try {
    // Query notifications for admin users
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", "admin")
    );
    
    const querySnapshot = await getDocs(q);
    const notifications: LeadNotification[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        leadId: data.leadId,
        leadName: data.leadName,
        title: data.title,
        message: data.message,
        type: data.type,
        isRead: data.isRead,
        timestamp: data.timestamp,
      });
    });
    
    // Sort notifications by timestamp (newest first)
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
    console.error('Error fetching admin notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
};

/**
 * Mark a notification as read
 */
export const markNotificationRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
};

/**
 * Mark all admin notifications as read
 */
export const markAllAdminNotificationsRead = async (): Promise<void> => {
  try {
    const notifications = await getAdminNotifications();
    
    // Only update unread notifications
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    // Update each notification
    const updatePromises = unreadNotifications.map(notification => 
      notification.id ? markNotificationRead(notification.id) : Promise.resolve()
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
}; 