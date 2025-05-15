import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Calendar as CalendarIcon,
  Download,
  FileBarChart,
  Filter,
  Search,
  Activity,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  UserLogEntry,
  getLogs,
  getUserLogs,
  getLogsByAction,
  getLogsByResourceType,
  addLogEntry,
} from "@/services/userLogs";
import { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

const USER_ACTIONS = [
  "login",
  "logout",
  "create",
  "update",
  "delete",
  "read",
  "export",
  "import",
];

const RESOURCE_TYPES = ["lead", "user", "document", "chat", "settings", "system"];

const UserLogs = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [logs, setLogs] = useState<UserLogEntry[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<UserLogEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedResourceType, setSelectedResourceType] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let result;
      
      // Apply filters if any
      if (selectedAction && selectedAction !== "all") {
        result = await getLogsByAction(selectedAction);
      } else if (selectedResourceType && selectedResourceType !== "all") {
        result = await getLogsByResourceType(selectedResourceType);
      } else if (selectedUser) {
        result = await getUserLogs(selectedUser);
      } else {
        result = await getLogs();
      }
      
      // Apply date filtering client-side if needed
      let filteredLogs = result.items;
      
      if (startDate) {
        filteredLogs = filteredLogs.filter(log => {
          const logDate = log.timestamp instanceof Date 
            ? log.timestamp 
            : new Date(log.timestamp);
          return logDate >= startDate;
        });
      }
      
      if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        filteredLogs = filteredLogs.filter(log => {
          const logDate = log.timestamp instanceof Date 
            ? log.timestamp 
            : new Date(log.timestamp);
          return logDate < nextDay;
        });
      }
      
      // Apply search term filtering client-side
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.userName.toLowerCase().includes(term) ||
          log.description.toLowerCase().includes(term) ||
          log.ipAddress.toLowerCase().includes(term)
        );
      }
      
      setLogs(filteredLogs);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLogs();
  }, [selectedAction, selectedResourceType, selectedUser, startDate, endDate]);
  
  const handleLoadMore = async () => {
    if (!lastDoc || !hasMore) return;
    
    setIsLoading(true);
    try {
      let result;
      
      if (selectedAction) {
        result = await getLogsByAction(selectedAction, 20, lastDoc);
      } else if (selectedResourceType) {
        result = await getLogsByResourceType(selectedResourceType, 20, lastDoc);
      } else if (selectedUser) {
        result = await getUserLogs(selectedUser, 20, lastDoc);
      } else {
        result = await getLogs(20, lastDoc);
      }
      
      setLogs(prev => [...prev, ...result.items]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Error loading more logs:", error);
      toast({
        title: "Error",
        description: "Failed to load more logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = () => {
    fetchLogs();
  };
  
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedAction("all");
    setSelectedResourceType("all");
    setSelectedUser("");
    setStartDate(undefined);
    setEndDate(undefined);
  };
  
  const handleExportLogs = () => {
    try {
      // Convert logs to CSV
      const headers = "ID,User ID,User Name,Action,Resource Type,Resource ID,Description,IP Address,User Agent,Timestamp\n";
      const rows = logs.map(log => {
        let timestamp: Date;
        if (log.timestamp instanceof Date) {
          timestamp = log.timestamp;
        } else if (log.timestamp && typeof (log.timestamp as any).toDate === 'function') {
          timestamp = (log.timestamp as any).toDate();
        } else {
          timestamp = new Date(log.timestamp as any);
        }
        return [
          log.id || '',
          log.userId,
          log.userName,
          log.action,
          log.resourceType,
          log.resourceId || '',
          `"${log.description.replace(/"/g, '""')}"`, // Escape quotes in CSV
          log.ipAddress,
          `"${log.userAgent.replace(/"/g, '""')}"`,
          timestamp.toISOString()
        ].join(',');
      }).join('\n');
      
      const csv = headers + rows;
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `user_logs_${new Date().toISOString()}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting logs:", error);
      toast({
        title: "Error",
        description: "Failed to export logs",
        variant: "destructive",
      });
    }
  };
  
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'login':
        return 'bg-green-500';
      case 'logout':
        return 'bg-yellow-500';
      case 'create':
        return 'bg-blue-500';
      case 'update':
        return 'bg-purple-500';
      case 'delete':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getResourceTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'lead':
        return 'bg-blue-500';
      case 'user':
        return 'bg-green-500';
      case 'document':
        return 'bg-yellow-500';
      case 'chat':
        return 'bg-purple-500';
      case 'settings':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Add a test function to create a log entry
  const createTestLog = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const testLogId = await addLogEntry({
        userId: user.id,
        userName: user.name || user.email || "Test User",
        action: "test",
        resourceType: "system",
        description: "Test log entry",
        ipAddress: "127.0.0.1",
        userAgent: navigator.userAgent,
      });
      
      toast({
        title: "Test Log Created",
        description: `Created test log with ID: ${testLogId}`,
      });
      
      // Refresh logs
      await fetchLogs();
    } catch (error) {
      console.error("Error creating test log:", error);
      toast({
        title: "Error",
        description: "Failed to create test log. See console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AppLayout requiredRole="admin">
      <SEO title="User Logs | crmX" />
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">User Activity Logs</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={createTestLog}>
              Create Test Log
            </Button>
            <Button variant="outline" onClick={handleExportLogs}>
              <Download className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filter Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Search</label>
                <div className="flex">
                  <Input
                    placeholder="Search user, description, IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-r-none"
                  />
                  <Button
                    onClick={handleSearch}
                    className="rounded-l-none"
                    variant="secondary"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Action</label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {USER_ACTIONS.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Resource Type</label>
                <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableCaption>
                {isLoading ? (
                  "Loading user logs..."
                ) : logs.length === 0 ? (
                  "No logs found"
                ) : (
                  "User activity logs"
                )}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && logs.length === 0 ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No logs found for the selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    let timestamp: Date;
                    if (log.timestamp instanceof Date) {
                      timestamp = log.timestamp;
                    } else if (log.timestamp && typeof (log.timestamp as any).toDate === 'function') {
                      timestamp = (log.timestamp as any).toDate();
                    } else {
                      timestamp = new Date(log.timestamp as any);
                    }
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1 text-gray-500" />
                            {log.userName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getResourceTypeBadgeColor(log.resourceType)}>
                            {log.resourceType}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.description}
                        </TableCell>
                        <TableCell>{log.ipAddress}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(timestamp, "PPP")}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(timestamp, "p")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={selectedLog?.id === log.id && showDetails} onOpenChange={(open) => {
                            if (!open) setShowDetails(false);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedLog(log);
                                  setShowDetails(true);
                                }}
                              >
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Log Details</DialogTitle>
                                <DialogDescription>
                                  Detailed information about this user activity log.
                                </DialogDescription>
                              </DialogHeader>
                              {selectedLog && (
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-2">
                                    <div className="text-sm font-medium">User:</div>
                                    <div className="col-span-3">{selectedLog.userName}</div>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-2">
                                    <div className="text-sm font-medium">User ID:</div>
                                    <div className="col-span-3 text-xs font-mono">
                                      {selectedLog.userId}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-2">
                                    <div className="text-sm font-medium">Action:</div>
                                    <div className="col-span-3">
                                      <Badge className={getActionBadgeColor(selectedLog.action)}>
                                        {selectedLog.action}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-2">
                                    <div className="text-sm font-medium">Resource:</div>
                                    <div className="col-span-3">
                                      <Badge className={getResourceTypeBadgeColor(selectedLog.resourceType)}>
                                        {selectedLog.resourceType}
                                      </Badge>
                                      {selectedLog.resourceId && (
                                        <span className="ml-2 text-xs font-mono">
                                          {selectedLog.resourceId}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 items-start gap-2">
                                    <div className="text-sm font-medium">Description:</div>
                                    <div className="col-span-3">{selectedLog.description}</div>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-2">
                                    <div className="text-sm font-medium">IP Address:</div>
                                    <div className="col-span-3">{selectedLog.ipAddress}</div>
                                  </div>
                                  <div className="grid grid-cols-4 items-start gap-2">
                                    <div className="text-sm font-medium">User Agent:</div>
                                    <div className="col-span-3 text-xs break-words">
                                      {selectedLog.userAgent}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-2">
                                    <div className="text-sm font-medium">Timestamp:</div>
                                    <div className="col-span-3">
                                      {format(
                                        selectedLog.timestamp instanceof Date
                                          ? selectedLog.timestamp
                                          : (selectedLog.timestamp && typeof (selectedLog.timestamp as any).toDate === 'function')
                                            ? (selectedLog.timestamp as any).toDate()
                                            : new Date(selectedLog.timestamp as any),
                                        "PPPp"
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default UserLogs; 