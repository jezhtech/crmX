import { useState, useEffect } from "react";
import { 
  Users, 
  FileText, 
  DollarSign, 
  BarChart3,
  TrendingUp
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import AppLayout from "@/components/layout/AppLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import LeadsByStageChart from "@/components/dashboard/LeadsByStageChart";
import RecentLeads from "@/components/dashboard/RecentLeads";
import { getAllLeads } from "@/services/leadService";
import { getAllUsers } from "@/services/userService";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Lead, LeadStage } from "@/types/lead";
import { User } from "@/services/userService";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch both leads and users in parallel
        const [leadsData, usersData] = await Promise.all([
          getAllLeads(),
          getAllUsers()
        ]);
        
        setLeads(leadsData);
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error loading dashboard",
          description: "There was a problem loading the dashboard data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);
  
  // Calculate statistics
  const totalLeads = leads.length;
  const totalUsers = users.length;
  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const qualifiedLeads = leads.filter(lead => 
    ["qualified", "proposal", "project"].includes(lead.stage)
  ).length;
  
  // Calculate lead counts by stage
  const leadCountsByStage = {
    new: leads.filter(lead => lead.stage === 'new').length,
    contacted: leads.filter(lead => lead.stage === 'contacted').length,
    qualified: leads.filter(lead => lead.stage === 'qualified').length,
    proposal: leads.filter(lead => lead.stage === 'proposal').length,
    project: leads.filter(lead => lead.stage === 'project').length,
  };
  
  // Format data for revenue graph - group projects by month
  const revenueData = (() => {
    // Only include project stage leads for revenue
    const projectLeads = leads.filter(lead => lead.stage === 'project');
    
    // Group by month
    const monthlyData = projectLeads.reduce((acc, lead) => {
      const date = new Date(lead.updatedAt);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = { month: monthYear, revenue: 0, count: 0 };
      }
      
      acc[monthYear].revenue += lead.value;
      acc[monthYear].count += 1;
      
      return acc;
    }, {} as Record<string, { month: string; revenue: number; count: number }>);
    
    // Convert to array and sort by date
    return Object.values(monthlyData).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      
      const aDate = new Date(`${aMonth} 1, ${aYear}`);
      const bDate = new Date(`${bMonth} 1, ${bYear}`);
      
      return aDate.getTime() - bDate.getTime();
    });
  })();
  
  const conversionRate = totalLeads > 0 
    ? Math.round((qualifiedLeads / totalLeads) * 100) 
    : 0;
  
  return (
    <AppLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-gray-500">
            Overview of all leads and system performance
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading dashboard data...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard 
                title="Total Leads" 
                value={totalLeads}
                icon={<FileText size={24} />}
              />
              <StatsCard 
                title="Total Users" 
                value={totalUsers}
                icon={<Users size={24} />}
              />
              <StatsCard 
                title="Total Value" 
                value={formatCurrency(totalValue)}
                icon={<DollarSign size={24} />}
              />
              <StatsCard 
                title="Conversion Rate" 
                value={`${conversionRate}%`}
                icon={<BarChart3 size={24} />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 bg-white p-6 rounded-lg shadow-sm">
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
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-gray-500" />
                Revenue from Projects
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `${value} leads`}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'revenue') return [formatCurrency(value as number), 'Revenue'];
                        return [value, 'Projects Count'];
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                      name="Revenue"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone"
                      dataKey="count"
                      stroke="#82ca9d" 
                      name="Projects Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LeadsByStageChart leads={leads} />
              <RecentLeads leads={leads} />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
