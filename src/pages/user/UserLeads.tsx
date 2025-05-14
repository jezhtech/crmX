import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import LeadList from "@/components/leads/LeadList";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Lead } from "@/types/lead";
import { getLeadsByUser } from "@/services/leadService";
import AddLeadDialog from "@/components/leads/AddLeadDialog";
import { useToast } from "@/hooks/use-toast";

const UserLeads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const fetchLeads = async () => {
    if (!user) {
      console.log("No user found, cannot fetch leads");
      setIsLoading(false);
      return;
    }
    
    console.log("Attempting to fetch leads for user ID:", user.id);
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedLeads = await getLeadsByUser(user.id);
      console.log("Leads fetched successfully:", fetchedLeads.length);
      setLeads(fetchedLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      setError("Failed to load leads. Please try again later.");
      toast({
        title: "Error loading leads",
        description: "There was a problem loading your leads",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    console.log("UserLeads component mounted, user:", user?.id);
    fetchLeads();
  }, [user]);
  
  const handleAddLead = () => {
    setDialogOpen(true);
  };
  
  const handleLeadAdded = () => {
    console.log("Lead added, refreshing leads list");
    fetchLeads();
  };
  
  return (
    <AppLayout requiredRole="user">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Leads</h1>
        <Button 
          className="bg-jezx-cyan hover:bg-jezx-cyan-dark"
          onClick={handleAddLead}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading leads...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <LeadList leads={leads} />
      )}
      
      <AddLeadDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onLeadAdded={handleLeadAdded}
      />
    </AppLayout>
  );
};

export default UserLeads;
