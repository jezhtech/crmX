import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import SEO from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { addLogEntry, getLogs } from "@/services/userLogs";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TestLogs = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // Test direct Firestore write
  const testDirectFirestore = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setResults([...results, "🔄 Testing direct Firestore write..."]);
      
      // Attempt to write directly to Firestore
      const docRef = await addDoc(collection(db, "test_logs"), {
        userId: user.id,
        userName: user.name || user.email || "Test User",
        message: "Test direct Firestore write",
        timestamp: serverTimestamp()
      });
      
      setResults([...results, `✅ Direct Firestore write successful! Doc ID: ${docRef.id}`]);
      toast({
        title: "Success",
        description: "Direct Firestore write successful",
      });
    } catch (error) {
      console.error("Error in direct Firestore write:", error);
      setResults([...results, `❌ Error in direct Firestore write: ${error instanceof Error ? error.message : String(error)}`]);
      toast({
        title: "Error",
        description: "Failed direct Firestore write. See console and results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Test log entry creation using our service
  const testLogEntryService = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setResults([...results, "🔄 Testing log entry service..."]);
      
      // Attempt to create a log via our service
      const logId = await addLogEntry({
        userId: user.id,
        userName: user.name || user.email || "Test User",
        action: "test",
        resourceType: "system",
        description: "Test log via service",
        ipAddress: "127.0.0.1",
        userAgent: navigator.userAgent,
      });
      
      setResults([...results, `✅ Log entry service successful! Log ID: ${logId}`]);
      toast({
        title: "Success",
        description: "Log entry created successfully",
      });
    } catch (error) {
      console.error("Error in log entry service:", error);
      setResults([...results, `❌ Error in log entry service: ${error instanceof Error ? error.message : String(error)}`]);
      toast({
        title: "Error",
        description: "Failed to create log entry. See console and results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Test log retrieval
  const testLogRetrieval = async () => {
    try {
      setLoading(true);
      setResults([...results, "🔄 Testing log retrieval..."]);
      
      // Attempt to fetch logs
      const logsResult = await getLogs();
      
      setResults([...results, `✅ Retrieved ${logsResult.items.length} logs`]);
      logsResult.items.forEach((log, i) => {
        if (i < 5) { // Only show first 5 logs to avoid clutter
          setResults([...results, `📝 Log ${i+1}: ${log.action} by ${log.userName} - ${log.description}`]);
        }
      });
      
      if (logsResult.items.length === 0) {
        setResults([...results, "⚠️ No logs found in database"]);
      }
      
      toast({
        title: "Success",
        description: `Retrieved ${logsResult.items.length} logs`,
      });
    } catch (error) {
      console.error("Error retrieving logs:", error);
      setResults([...results, `❌ Error retrieving logs: ${error instanceof Error ? error.message : String(error)}`]);
      toast({
        title: "Error",
        description: "Failed to retrieve logs. See console and results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Test direct log collection read
  const testDirectLogRead = async () => {
    try {
      setLoading(true);
      setResults([...results, "🔄 Testing direct log collection read..."]);
      
      // Attempt to directly read from the logs collection
      const querySnapshot = await getDocs(collection(db, "user_logs"));
      
      setResults([...results, `✅ Direct read successful. Found ${querySnapshot.size} documents`]);
      
      if (querySnapshot.empty) {
        setResults([...results, "⚠️ No logs found in user_logs collection"]);
      } else {
        // Fix: Convert to array first, then map with index
        const docsArray = querySnapshot.docs;
        
        // Only show first 3 logs
        docsArray.slice(0, 3).forEach((doc, index) => {
          const data = doc.data();
          setResults(prev => [
            ...prev, 
            `📄 Doc ${index+1}: ${doc.id} - ${data.action || 'N/A'} - ${data.description || 'N/A'}`
          ]);
        });
      }
      
      toast({
        title: "Success",
        description: `Direct read found ${querySnapshot.size} logs`,
      });
    } catch (error) {
      console.error("Error in direct log read:", error);
      setResults([...results, `❌ Error in direct log read: ${error instanceof Error ? error.message : String(error)}`]);
      toast({
        title: "Error",
        description: "Failed to read logs directly. See console and results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear results
  const clearResults = () => {
    setResults([]);
  };

  return (
    <AppLayout requiredRole="admin">
      <SEO title="Test Logs | crmX" />
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Logging Test & Debug</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Firestore Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testDirectFirestore} 
                disabled={loading}
                className="w-full"
              >
                Test Direct Firestore Write
              </Button>
              
              <Button 
                onClick={testDirectLogRead} 
                disabled={loading}
                className="w-full"
              >
                Test Direct Log Collection Read
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Test Logging Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testLogEntryService} 
                disabled={loading}
                className="w-full"
              >
                Test Log Entry Creation
              </Button>
              
              <Button 
                onClick={testLogRetrieval} 
                disabled={loading}
                className="w-full"
              >
                Test Log Retrieval
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
              {results.length === 0 ? (
                <div className="text-muted-foreground text-center">
                  No test results yet. Run a test to see output here.
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <div key={index} className="border-b border-muted-foreground/20 pb-1">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TestLogs; 