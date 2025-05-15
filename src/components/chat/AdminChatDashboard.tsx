import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, UserCircle, Upload, File, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  ChatMessage as ChatMessageType, 
  TrainingDocument,
  addTrainingDocument,
  getTrainingDocuments
} from "@/services/chatAssistant";
import ChatMessage from "./ChatMessage";

interface UserChatInfo {
  userId: string;
  userName: string;
  lastMessage: string;
  lastTimestamp: Date;
  unreadCount: number;
}

const AdminChatDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("chats");
  const [userChats, setUserChats] = useState<UserChatInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Training document states
  const [documents, setDocuments] = useState<TrainingDocument[]>([]);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [documentCategory, setDocumentCategory] = useState("general");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only admins can access this component
  if (!user || user.role !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You don't have permission to access this page.</p>
        </CardContent>
      </Card>
    );
  }

  // Load list of users who have chats
  useEffect(() => {
    const fetchUserChats = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching user chats for admin dashboard");
        // Get all unique users who have chat messages
        const chatCollection = collection(db, "chat_messages");
        const userChatsQuery = query(chatCollection, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(userChatsQuery);
        
        console.log("Chat messages snapshot size:", querySnapshot.size);
        
        const userMap = new Map<string, UserChatInfo>();
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("Chat message data:", data);
          
          if (data.userId && !userMap.has(data.userId)) {
            userMap.set(data.userId, {
              userId: data.userId,
              userName: data.userName || "Unknown User",
              lastMessage: data.content || "",
              lastTimestamp: data.timestamp?.toDate?.() || new Date(),
              unreadCount: 0 // We'll count unread messages in a separate query
            });
          }
        });
        
        const chatUsers = Array.from(userMap.values());
        console.log("Unique chat users found:", chatUsers.length);
        setUserChats(chatUsers);
        
        // If we have users and none is selected, select the first one
        if (chatUsers.length > 0 && !selectedUser) {
          setSelectedUser(chatUsers[0].userId);
        }
      } catch (error) {
        console.error("Error fetching user chats:", error);
        toast({
          title: "Error",
          description: "Failed to load user chats",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserChats();
    
    // Set up real-time listener for new chats
    const chatCollection = collection(db, "chat_messages");
    const recentChatsQuery = query(chatCollection, orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(recentChatsQuery, (snapshot) => {
      console.log("Real-time chat update, changes:", snapshot.docChanges().length);
      
      const userMap = new Map<string, UserChatInfo>();
      
      // First, preserve existing users to maintain selection
      userChats.forEach(chat => {
        userMap.set(chat.userId, chat);
      });
      
      // Then update with any new data
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data.userId) {
          const existingUser = userMap.get(data.userId);
          
          // If this is a new message from an existing user, update the last message
          if (existingUser && data.timestamp) {
            const messageTime = data.timestamp.toDate?.() || new Date();
            const existingTime = existingUser.lastTimestamp instanceof Date 
              ? existingUser.lastTimestamp 
              : new Date(0);
              
            // Only update if this message is newer
            if (messageTime > existingTime) {
              userMap.set(data.userId, {
                ...existingUser,
                lastMessage: data.content || "",
                lastTimestamp: messageTime,
              });
            }
          } 
          // If this is a new user, add them
          else if (!existingUser) {
            userMap.set(data.userId, {
              userId: data.userId,
              userName: data.userName || "Unknown User",
              lastMessage: data.content || "",
              lastTimestamp: data.timestamp?.toDate?.() || new Date(),
              unreadCount: 0
            });
          }
        }
      });
      
      const updatedUsers = Array.from(userMap.values());
      console.log("Updated user list:", updatedUsers.length);
      setUserChats(updatedUsers);
    });
    
    return () => unsubscribe();
  }, [toast]);

  // Load training documents
  useEffect(() => {
    if (activeTab === "training") {
      loadTrainingDocuments();
    }
  }, [activeTab]);

  // Load selected user's chat messages
  useEffect(() => {
    if (!selectedUser) return;
    
    console.log("Loading chat messages for user:", selectedUser);
    setIsLoading(true);
    
    const chatCollection = collection(db, "chat_messages");
    const userChatsQuery = query(
      chatCollection,
      where("userId", "==", selectedUser),
      orderBy("timestamp", "asc")
    );
    
    const unsubscribe = onSnapshot(userChatsQuery, (snapshot) => {
      console.log("User chat update, docs:", snapshot.size);
      const chatMessages: ChatMessageType[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Explicitly handle Firestore timestamps
        let timestamp: Date | Timestamp;
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
          timestamp = data.timestamp.toDate();
        } else {
          timestamp = new Date();
        }
        
        chatMessages.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          role: data.role,
          content: data.content,
          timestamp: timestamp
        });
      });
      
      // Sort messages chronologically
      chatMessages.sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
        return timeA - timeB;
      });
      
      console.log("Processed chat messages:", chatMessages.length);
      setMessages(chatMessages);
      setIsLoading(false);
    }, (error) => {
      console.error("Error in chat subscription:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    });
    
    return () => unsubscribe();
  }, [selectedUser, toast]);

  // Load training documents
  const loadTrainingDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await getTrainingDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading training documents:", error);
      toast({
        title: "Error",
        description: "Failed to load training documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send reply to user
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim() || !selectedUser) return;
    
    try {
      await addDoc(collection(db, "chat_messages"), {
        userId: selectedUser,
        role: "assistant",
        content: replyText.trim(),
        timestamp: serverTimestamp()
      });
      
      setReplyText("");
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Add new training document
  const handleAddTrainingDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentTitle.trim() || !documentContent.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both title and content for the document",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const doc: Omit<TrainingDocument, "timestamp" | "id"> = {
        title: documentTitle,
        content: documentContent,
        category: documentCategory,
      };
      
      await addTrainingDocument(doc, selectedFile || undefined);
      
      toast({
        title: "Document added",
        description: "Training document has been added successfully",
      });
      
      // Reset form
      setDocumentTitle("");
      setDocumentContent("");
      setDocumentCategory("general");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Reload documents
      loadTrainingDocuments();
    } catch (error) {
      console.error("Error adding training document:", error);
      toast({
        title: "Error",
        description: "Failed to add training document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader className="px-6 py-4">
        <Tabs defaultValue="chats" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chats">User Chats</TabsTrigger>
            <TabsTrigger value="training">Chatbot Training</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100%-4rem)]">
        <TabsContent value="chats" className="h-full m-0">
          <div className="grid grid-cols-12 h-full">
            {/* User List Sidebar */}
            <div className="col-span-3 border-r h-full">
              <div className="p-4 border-b">
                <Input 
                  placeholder="Search users..." 
                  className="w-full"
                />
              </div>
              <ScrollArea className="h-[calc(100%-4rem)]">
                <div className="p-2 space-y-1">
                  {userChats.map((userChat) => (
                    <button
                      key={userChat.userId}
                      className={`w-full text-left p-3 rounded-md flex items-center space-x-3 hover:bg-accent group transition-colors
                        ${selectedUser === userChat.userId ? 'bg-accent' : ''}`}
                      onClick={() => setSelectedUser(userChat.userId)}
                    >
                      <Avatar>
                        <UserCircle className="h-full w-full" />
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{userChat.userName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {userChat.lastMessage}
                        </p>
                      </div>
                      {userChat.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {userChat.unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                  
                  {userChats.length === 0 && !isLoading && (
                    <div className="p-4 text-center text-muted-foreground">
                      No user chats found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            
            {/* Chat Area */}
            <div className="col-span-9 flex flex-col h-full">
              {selectedUser ? (
                <>
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">
                      {userChats.find(u => u.userId === selectedUser)?.userName || "User"}
                    </h3>
                  </div>
                  
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message, index) => (
                        <ChatMessage key={message.id || index} message={message} />
                      ))}
                      
                      {messages.length === 0 && (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          No messages yet
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  
                  <div className="p-4 border-t mt-auto">
                    <form onSubmit={handleSendReply} className="flex gap-2">
                      <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!replyText.trim()}>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Select a user to view their chat
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="training" className="h-full m-0 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Document List */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Training Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-24rem)]">
                  {documents.length > 0 ? (
                    <div className="space-y-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="p-4 border rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{doc.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                Category: {doc.category}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <p className="text-sm line-clamp-2">{doc.content}</p>
                          {doc.fileName && (
                            <div className="mt-2 flex items-center text-sm text-muted-foreground">
                              <File className="h-3 w-3 mr-1" />
                              {doc.fileName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <p>No training documents yet</p>
                      <p className="text-sm">Add documents to train your chatbot</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Add Document Form */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Add Training Document</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddTrainingDocument} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      value={documentTitle}
                      onChange={(e) => setDocumentTitle(e.target.value)}
                      placeholder="E.g., Product Features Overview"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={documentCategory} onValueChange={setDocumentCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Information</SelectItem>
                        <SelectItem value="pricing">Pricing</SelectItem>
                        <SelectItem value="features">Features</SelectItem>
                        <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                        <SelectItem value="faq">FAQ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content">Document Content</Label>
                    <Textarea
                      id="content"
                      value={documentContent}
                      onChange={(e) => setDocumentContent(e.target.value)}
                      placeholder="Enter detailed information about your product or service..."
                      rows={10}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="file">Attach File (Optional)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="file"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Browse
                      </Button>
                    </div>
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Adding Document..." : "Add Training Document"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </CardContent>
    </Card>
  );
};

export default AdminChatDashboard; 