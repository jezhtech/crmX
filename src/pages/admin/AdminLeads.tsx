import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import LeadList from "@/components/leads/LeadList";
import { getAllLeads } from "@/services/leadService";
import { useToast } from "@/hooks/use-toast";
import { Lead, LeadStage } from "@/types/lead";
import { 
  Calendar,
  Filter, 
  FileDown, 
  X,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

// Function to export leads to Excel/CSV
const exportToExcel = (leads: Lead[]) => {
  // Create CSV content
  const headers = ['Name', 'Company', 'Email', 'Phone', 'Status', 'Value', 'Created Date', 'Updated Date'];
  const rows = leads.map(lead => [
    lead.name || '',
    lead.company || '',
    lead.email || '',
    lead.phone || '',
    lead.stage,
    lead.value.toString(),
    lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '',
    lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Leads_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to export leads to PDF
const exportToPDF = (leads: Lead[]) => {
  // Create a window to print from
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }
  
  const html = `
    <html>
      <head>
        <title>Leads Export</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .header { margin-bottom: 20px; }
          .status-new { background-color: #e5e7eb; border-radius: 4px; padding: 2px 6px; }
          .status-contacted { background-color: #dbeafe; border-radius: 4px; padding: 2px 6px; }
          .status-qualified { background-color: #fef3c7; border-radius: 4px; padding: 2px 6px; }
          .status-proposal { background-color: #dcfce7; border-radius: 4px; padding: 2px 6px; }
          .status-project { background-color: #f3e8ff; border-radius: 4px; padding: 2px 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Leads Export</h1>
          <p>Generated on ${format(new Date(), 'PPP')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Status</th>
              <th>Value</th>
              <th>Updated Date</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map(lead => `
              <tr>
                <td>${lead.name || ''}</td>
                <td>${lead.company || ''}</td>
                <td>${lead.email || ''}</td>
                <td><span class="status-${lead.stage}">${lead.stage}</span></td>
                <td>${formatCurrency(lead.value || 0)}</td>
                <td>${lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
  
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
  };
};

const AdminLeads = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<LeadStage | "all">("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [isFiltered, setIsFiltered] = useState(false);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const fetchedLeads = await getAllLeads();
      setLeads(fetchedLeads);
      setFilteredLeads(fetchedLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error loading leads",
        description: "There was a problem loading the leads data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [toast]);
  
  // Apply filters
  const applyFilters = () => {
    let filtered = [...leads];
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(lead => lead.stage === statusFilter);
    }
    
    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.updatedAt);
        return leadDate >= fromDate;
      });
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.updatedAt);
        return leadDate <= toDate;
      });
    }
    
    setFilteredLeads(filtered);
    setIsFiltered(statusFilter !== "all" || !!dateFrom || !!dateTo);
    setFilterOpen(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setFilteredLeads(leads);
    setIsFiltered(false);
  };
  
  return (
    <AppLayout requiredRole="admin">
      {isLoading ? (
        <div className="text-center py-8">Loading leads...</div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-semibold">Leads Management</h2>
            <div className="flex items-center gap-2">
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant={isFiltered ? "default" : "outline"} size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {isFiltered ? "Filters Applied" : "Filter"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h3 className="font-medium">Filter Leads</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value as LeadStage | "all")}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Date Range</Label>
                      <div className="flex items-center gap-2">
                        <div className="grid gap-1">
                          <Label htmlFor="from" className="text-xs">From</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="from"
                                variant="outline"
                                className="w-[130px] justify-start text-left font-normal"
                                size="sm"
                              >
                                {dateFrom ? (
                                  format(dateFrom, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={dateFrom}
                                onSelect={setDateFrom}
                                disabled={(date) =>
                                  dateTo ? date > dateTo : false
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="grid gap-1">
                          <Label htmlFor="to" className="text-xs">To</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="to"
                                variant="outline"
                                className="w-[130px] justify-start text-left font-normal"
                                size="sm"
                              >
                                {dateTo ? (
                                  format(dateTo, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <CalendarComponent
                                mode="single"
                                selected={dateTo}
                                onSelect={setDateTo}
                                disabled={(date) =>
                                  dateFrom ? date < dateFrom : false
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between pt-2">
                      <Button variant="ghost" size="sm" onClick={resetFilters}>
                        Reset
                      </Button>
                      <Button size="sm" onClick={applyFilters}>
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="space-y-1">
                    <h3 className="font-medium mb-2">Export Options</h3>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      size="sm"
                      onClick={() => exportToExcel(filteredLeads)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export to Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      size="sm"
                      onClick={() => exportToPDF(filteredLeads)}
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Export to PDF
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {isFiltered && (
            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded">
              <span className="text-sm text-muted-foreground">Filters:</span>
              <div className="flex flex-wrap gap-2">
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {statusFilter}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        setStatusFilter("all");
                        applyFilters();
                      }} 
                    />
                  </Badge>
                )}
                {dateFrom && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    From: {format(dateFrom, "MMM d, yyyy")}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        setDateFrom(undefined);
                        applyFilters();
                      }} 
                    />
                  </Badge>
                )}
                {dateTo && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    To: {format(dateTo, "MMM d, yyyy")}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        setDateTo(undefined);
                        applyFilters();
                      }} 
                    />
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs" 
                  onClick={resetFilters}
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
          
          <LeadList leads={filteredLeads} isAdmin={true} onLeadUpdated={fetchLeads} />
        </div>
      )}
    </AppLayout>
  );
};

export default AdminLeads;
