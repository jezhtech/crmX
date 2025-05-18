import { useState, useEffect } from "react";
import { Bell, Search, User, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/branding/Logo";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { getUserNotifications, Notification, markNotificationAsRead } from "@/services/chatAssistant";
import { getAdminNotifications, markNotificationRead, markAllAdminNotificationsRead } from "@/services/notificationService";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load notifications when user logs in
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      // Get user notifications
      const userNotifications = await getUserNotifications(user.id);
      
      // If the user is an admin, also get admin-specific notifications
      let allNotifications = [...userNotifications];
      let adminLeadNotifications: any[] = [];
      
      if (user.role === 'admin') {
        adminLeadNotifications = await getAdminNotifications();
        setAdminNotifications(adminLeadNotifications);
        allNotifications = [...userNotifications, ...adminLeadNotifications];
      }
      
      setNotifications(userNotifications);
      
      // Count unread notifications from both sources
      const userUnreadCount = userNotifications.filter(n => !n.isRead).length;
      const adminUnreadCount = adminLeadNotifications.filter(n => !n.isRead).length;
      setUnreadCount(userUnreadCount + adminUnreadCount);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: string, isAdminNotification = false) => {
    try {
      if (isAdminNotification) {
        await markNotificationRead(notificationId);
        
        // Update admin notifications list
        setAdminNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, isRead: true } 
              : n
          )
        );
      } else {
        await markNotificationAsRead(notificationId);
        
        // Update user notifications list
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, isRead: true } 
              : n
          )
        );
      }
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      // If admin, mark all admin notifications as read
      if (user?.role === 'admin') {
        await markAllAdminNotificationsRead();
        setAdminNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
      }
      
      // Update unread count
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
  };

  return (
    <header className="border-b bg-white py-3 px-4 sm:px-6 shadow-sm w-full z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo size="small" variant="text" className="hidden sm:flex" />
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search..."
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-jezx-cyan focus:ring-1 focus:ring-jezx-cyan"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Popover open={showNotifications} onOpenChange={setShowNotifications}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-500 hover:text-jezx-cyan" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-medium">Notifications</h3>
                {(notifications.length > 0 || adminNotifications.length > 0) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              
              <ScrollArea className="h-80">
                {(notifications.length > 0 || adminNotifications.length > 0) ? (
                  <div>
                    {/* Admin Lead Notifications */}
                    {user?.role === 'admin' && adminNotifications.length > 0 && (
                      <>
                        <div className="px-4 py-2 bg-gray-50 border-b">
                          <p className="text-xs font-medium text-gray-500">LEAD NOTIFICATIONS</p>
                        </div>
                        {adminNotifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-medium">{notification.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {notification.timestamp instanceof Date 
                                    ? notification.timestamp.toLocaleString() 
                                    : notification.timestamp?.toDate 
                                      ? notification.timestamp.toDate().toLocaleString()
                                      : new Date().toLocaleString()}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => handleMarkAsRead(notification.id, true)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* User Notifications */}
                    {notifications.length > 0 && (
                      <>
                        {user?.role === 'admin' && adminNotifications.length > 0 && (
                          <div className="px-4 py-2 bg-gray-50 border-b">
                            <p className="text-xs font-medium text-gray-500">SYSTEM NOTIFICATIONS</p>
                          </div>
                        )}
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-medium">{notification.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {notification.timestamp instanceof Date 
                                    ? notification.timestamp.toLocaleString() 
                                    : notification.timestamp?.toDate 
                                      ? notification.timestamp.toDate().toLocaleString()
                                      : new Date().toLocaleString()}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => notification.id && handleMarkAsRead(notification.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500">
                    <Bell className="h-8 w-8 mb-2 text-gray-300" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <div className="relative">
            <button
              className="flex items-center gap-2"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="h-8 w-8 rounded-full bg-jezx-cyan flex items-center justify-center text-white">
                <User className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline-block font-medium">
                {user?.name}
              </span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 z-30 mt-2 w-48 rounded-md border border-gray-100 bg-white py-2 shadow-lg">
                <div className="px-4 py-2 text-sm text-gray-500">
                  {user?.email}
                </div>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
