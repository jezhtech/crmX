import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from "@/services/userService";
import { getLeadsByUser } from "@/services/leadService";
import { Lead } from "@/types/lead";
import { PieChart, Phone, Mail, Calendar, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import LeadStatusBadge from "../leads/LeadStatusBadge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

const STAGE_COLORS = {
  new: "#e5e7eb",
  contacted: "#dbeafe",
  qualified: "#fef3c7",
  proposal: "#dcfce7",
  project: "#f3e8ff"
};

const UserDetailDialog = ({ open, onOpenChange, user }: UserDetailDialogProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserLeads = async () => {
      if (!open || !user) return;
      
      setIsLoading(true);
      try {
        const userLeads = await getLeadsByUser(user.id);
        setLeads(userLeads);
      } catch (error) {
        console.error("Error fetching user leads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserLeads();
  }, [user, open]);

  // Prepare chart data
  const leadStatusData = [
    { name: "New", value: leads.filter(lead => lead.stage === "new").length, color: STAGE_COLORS.new },
    { name: "Contacted", value: leads.filter(lead => lead.stage === "contacted").length, color: STAGE_COLORS.contacted },
    { name: "Qualified", value: leads.filter(lead => lead.stage === "qualified").length, color: STAGE_COLORS.qualified },
    { name: "Proposal", value: leads.filter(lead => lead.stage === "proposal").length, color: STAGE_COLORS.proposal },
    { name: "Project", value: leads.filter(lead => lead.stage === "project").length, color: STAGE_COLORS.project },
  ].filter(item => item.value > 0);
  
  // Calculate performance metrics
  const totalLeads = leads.length;
  const projectLeads = leads.filter(lead => lead.stage === "project").length;
  const conversionRate = totalLeads > 0 ? (projectLeads / totalLeads) * 100 : 0;
  const totalEarnings = leads
    .filter(lead => lead.stage === "project")
    .reduce((sum, lead) => sum + (lead.value * 0.1), 0);
  
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            User Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-6">Loading user data...</div>
        ) : (
          <div className="overflow-hidden flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="col-span-1 bg-gray-50 p-4 rounded-lg">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                    <span className="text-xl font-semibold">{user.name?.charAt(0) || "U"}</span>
                  </div>
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full mb-2 mt-1 bg-purple-100 text-purple-800">
                    {user.role}
                  </span>
                  
                  <div className="w-full mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{user.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">
                        Joined: {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-gray-500" />
                      <span className={`${user.active ? "text-green-700" : "text-red-700"}`}>
                        {user.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center mb-1">
                      <DollarSign className="h-5 w-5 text-gray-400 mr-1" />
                      <h3 className="font-medium">Earnings</h3>
                    </div>
                    <p className="text-2xl font-semibold">{formatCurrency(totalEarnings)}</p>
                    <p className="text-sm text-gray-500">10% commission on projects</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center mb-1">
                      <CheckCircle2 className="h-5 w-5 text-gray-400 mr-1" />
                      <h3 className="font-medium">Conversion Rate</h3>
                    </div>
                    <p className="text-2xl font-semibold">{conversionRate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">{projectLeads} of {totalLeads} leads to projects</p>
                  </div>
                </div>
                
                <div className="mt-4 bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center mb-2">
                    <PieChart className="h-5 w-5 text-gray-400 mr-1" />
                    <h3 className="font-medium">Lead Distribution</h3>
                  </div>
                  
                  {leadStatusData.length > 0 ? (
                    <div className="h-[180px]">
                      {leadStatusData.length === 1 ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div 
                            className="w-32 h-32 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: leadStatusData[0].color }}
                          >
                            <div className="w-16 h-16 bg-white rounded-full"></div>
                          </div>
                          <p className="mt-2 font-medium">
                            {leadStatusData[0].name}: {leadStatusData[0].value} leads (100%)
                          </p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={leadStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {leadStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} leads`, "Count"]} />
                            <Legend />
                          </RePieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  ) : (
                    <p className="text-center py-10 text-gray-500">No lead data available</p>
                  )}
                </div>
              </div>
            </div>
            
            <Tabs defaultValue="leads" className="w-full">
              <TabsList>
                <TabsTrigger value="leads">Recent Leads</TabsTrigger>
                <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="leads" className="mt-2">
                <ScrollArea className="h-[250px]">
                  {recentLeads.length > 0 ? (
                    <div className="space-y-3">
                      {recentLeads.map(lead => (
                        <div key={lead.id} className="p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{lead.name}</h4>
                            <LeadStatusBadge stage={lead.stage} />
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            <span>{lead.company}</span>
                            <span className="mx-2">•</span>
                            <span>{formatCurrency(lead.value)}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Last updated {format(new Date(lead.updatedAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-10 text-gray-500">No leads found for this user</p>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="performance" className="mt-2">
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3 p-1">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="font-medium">Activity Overview</h4>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-500">Total Leads</p>
                          <p className="text-lg font-medium">{totalLeads}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Qualified Leads</p>
                          <p className="text-lg font-medium">
                            {leads.filter(lead => ["qualified", "proposal", "project"].includes(lead.stage)).length}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Active Leads</p>
                          <p className="text-lg font-medium">
                            {leads.filter(lead => lead.stage !== "project").length}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Converted Projects</p>
                          <p className="text-lg font-medium">{projectLeads}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="font-medium">Lead Stage Breakdown</h4>
                      <div className="mt-3 space-y-2">
                        {Object.entries(STAGE_COLORS).map(([stage, color]) => {
                          const count = leads.filter(lead => lead.stage === stage).length;
                          const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
                          
                          return (
                            <div key={stage}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize">{stage}</span>
                                <span>{count} ({percentage.toFixed(1)}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full" 
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: color 
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="font-medium">Financial Performance</h4>
                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Total Lead Value</p>
                          <p className="text-lg font-medium">
                            {formatCurrency(leads.reduce((sum, lead) => sum + lead.value, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Project Value</p>
                          <p className="text-lg font-medium">
                            {formatCurrency(leads
                              .filter(lead => lead.stage === "project")
                              .reduce((sum, lead) => sum + lead.value, 0)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Earnings (10% Commission)</p>
                          <p className="text-lg font-medium">{formatCurrency(totalEarnings)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailDialog; 