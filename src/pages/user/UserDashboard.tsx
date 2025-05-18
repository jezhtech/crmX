import { useState, useEffect } from "react";
import { 
  FileText, 
  DollarSign, 
  BarChart3,
  Check,
  Plus,
  PieChart
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import LeadsByStageChart from "@/components/dashboard/LeadsByStageChart";
import RecentLeads from "@/components/dashboard/RecentLeads";
import { getLeadsByUser } from "@/services/leadService";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Lead, LeadStage } from "@/types/lead";
import { useToast } from "@/hooks/use-toast";
import AddLeadDialog from "@/components/leads/AddLeadDialog";
import SEO from "@/components/SEO";

const UserDashboard = () => {
  const { user } = useAuth();
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
    
    console.log("Dashboard: Attempting to fetch leads for user ID:", user.id);
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedLeads = await getLeadsByUser(user.id);
      console.log("Dashboard: Leads fetched successfully:", fetchedLeads.length);
      setLeads(fetchedLeads);
    } catch (error) {
      console.error("Dashboard: Error fetching leads:", error);
      setError("Failed to load dashboard data. Please try again later.");
      toast({
        title: "Error loading dashboard",
        description: "There was a problem loading your leads",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    console.log("UserDashboard component mounted, user:", user?.id);
    fetchLeads();
  }, [user]);
  
  const handleAddLead = () => {
    setDialogOpen(true);
  };
  
  const handleLeadAdded = () => {
    console.log("Lead added, refreshing dashboard");
    fetchLeads();
  };
  
  // Calculate statistics
  const totalLeads = leads.length;
  const totalActiveLeads = leads.filter(lead => lead.stage !== 'rejected').length;
  const activeLeads = leads.filter(lead => lead.stage !== 'project' && lead.stage !== 'rejected').length;
  
  // Calculate lead counts by stage
  const leadCountsByStage = {
    new: leads.filter(lead => lead.stage === 'new').length,
    contacted: leads.filter(lead => lead.stage === 'contacted').length,
    qualified: leads.filter(lead => lead.stage === 'qualified').length,
    proposal: leads.filter(lead => lead.stage === 'proposal').length,
    project: leads.filter(lead => lead.stage === 'project').length,
    rejected: leads.filter(lead => lead.stage === 'rejected').length,
  };
  
  // Calculate earnings (10% of value for leads in 'project' stage)
  const myEarnings = leads
    .filter(lead => lead.stage === 'project')
    .reduce((sum, lead) => sum + (lead.value * 0.1), 0);
  
  const qualifiedLeads = leads.filter(lead => 
    ["qualified", "proposal", "project"].includes(lead.stage)
  ).length;
  
  const conversionRate = totalActiveLeads > 0 
    ? Math.round((qualifiedLeads / totalActiveLeads) * 100)
    : 0;
  
  return (
    <AppLayout requiredRole="user">
      <SEO 
        title="Dashboard"
        description="View your leads, performance metrics, and sales pipeline at a glance"
        keywords="lead management, dashboard, CRM analytics, sales pipeline"
        canonicalUrl="https://crmx.jezx.in/dashboard"
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Your Dashboard</h1>
            <p className="text-gray-500">
              Overview of your leads and performance
            </p>
          </div>
          <Button 
            className="bg-jezx-cyan hover:bg-jezx-cyan-dark"
            onClick={handleAddLead}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading dashboard...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard 
                title="Total Leads" 
                value={totalLeads}
                icon={<FileText size={24} />}
              />
              <StatsCard 
                title="Active Leads" 
                value={activeLeads}
                icon={<BarChart3 size={24} />}
              />
              <StatsCard 
                title="My Earnings" 
                value={formatCurrency(myEarnings)}
                description="10% of confirmed projects"
                icon={<DollarSign size={24} />}
              />
              <StatsCard 
                title="Conversion Rate" 
                value={`${conversionRate}%`}
                description="Qualified to total leads"
                icon={<PieChart size={24} />}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium col-span-full mb-2">Lead Status Count</h3>
              <StatsCard 
                title="New" 
                value={leadCountsByStage.new}
                variant="compact"
              />
              <StatsCard 
                title="Contacted" 
                value={leadCountsByStage.contacted}
                variant="compact"
              />
              <StatsCard 
                title="Qualified" 
                value={leadCountsByStage.qualified}
                variant="compact"
              />
              <StatsCard 
                title="Proposal" 
                value={leadCountsByStage.proposal}
                variant="compact"
              />
              <StatsCard 
                title="Project" 
                value={leadCountsByStage.project}
                variant="compact"
              />
              <StatsCard 
                title="Rejected" 
                value={leadCountsByStage.rejected}
                variant="compact"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LeadsByStageChart leads={leads} />
              <RecentLeads leads={leads} />
            </div>
          </>
        )}
        
        <AddLeadDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          onLeadAdded={handleLeadAdded}
        />
      </div>
    </AppLayout>
  );
};

export default UserDashboard;
