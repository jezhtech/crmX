import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Edit, 
  RefreshCw, 
  MessageSquarePlus, 
  Eye 
} from "lucide-react";
import { Lead } from "@/types/lead";
import { Button } from "@/components/ui/button";
import LeadStatusBadge from "./LeadStatusBadge";
import { formatCurrency } from "@/lib/utils";

// Import dialog components
import EditLeadDialog from "@/components/leads/EditLeadDialog";
import UpdateStatusDialog from "@/components/leads/UpdateStatusDialog";
import AddNoteDialog from "@/components/leads/AddNoteDialog";
import ViewLeadDialog from "@/components/leads/ViewLeadDialog";

interface LeadListProps {
  leads: Lead[];
  isAdmin?: boolean;
}

const LeadList = ({ leads, isAdmin = false }: LeadListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Lead | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const baseUrl = isAdmin ? "/admin/leads" : "/leads";

  // Filter leads by search term
  const filteredLeads = leads.filter(lead => 
    (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (!sortField) return 0;
    
    if (sortField === "value") {
      const aValue = a.value || 0;
      const bValue = b.value || 0;
      return sortDirection === "asc" 
        ? aValue - bValue 
        : bValue - aValue;
    }
    
    if (sortField === "createdAt" || sortField === "updatedAt") {
      const aTime = a[sortField] ? new Date(a[sortField]).getTime() : 0;
      const bTime = b[sortField] ? new Date(b[sortField]).getTime() : 0;
      return sortDirection === "asc"
        ? aTime - bTime
        : bTime - aTime;
    }
    
    const aValue = String(a[sortField] || '').toLowerCase();
    const bValue = String(b[sortField] || '').toLowerCase();
    
    return sortDirection === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New sort field
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleEditClick = (lead: Lead) => {
    setSelectedLead(lead);
    setEditDialogOpen(true);
  };

  const handleStatusClick = (lead: Lead) => {
    setSelectedLead(lead);
    setStatusDialogOpen(true);
  };

  const handleNoteClick = (lead: Lead) => {
    setSelectedLead(lead);
    setNoteDialogOpen(true);
  };

  const handleViewClick = (lead: Lead) => {
    setSelectedLead(lead);
    setViewDialogOpen(true);
  };

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No leads found</p>
        <p className="text-gray-500 mb-6">Click the "Add Lead" button to create your first lead</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Leads</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Name
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("company")}
                >
                  <div className="flex items-center">
                    Company
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("stage")}
                >
                  <div className="flex items-center">
                    Stage
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("value")}
                >
                  <div className="flex items-center">
                    Value
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("updatedAt")}
                >
                  <div className="flex items-center">
                    Last Updated
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedLeads.length > 0 ? (
                sortedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900 font-medium">
                        {lead.name || 'Unnamed Lead'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.company || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <LeadStatusBadge stage={lead.stage} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(lead.value || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-3">
                        <button 
                          onClick={() => handleEditClick(lead)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit Lead"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleStatusClick(lead)}
                          className="text-amber-600 hover:text-amber-800"
                          title="Update Status"
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button 
                          onClick={() => handleNoteClick(lead)}
                          className="text-green-600 hover:text-green-800"
                          title="Add Note"
                        >
                          <MessageSquarePlus size={16} />
                        </button>
                        <button 
                          onClick={() => handleViewClick(lead)}
                          className="text-purple-600 hover:text-purple-800"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No leads match your search' : 'No leads found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog components - temporarily commented out */}
      {selectedLead && (
        <>
          <EditLeadDialog 
            open={editDialogOpen} 
            onOpenChange={setEditDialogOpen} 
            lead={selectedLead} 
          />
          
          <UpdateStatusDialog 
            open={statusDialogOpen} 
            onOpenChange={setStatusDialogOpen} 
            lead={selectedLead} 
          />
          
          <AddNoteDialog 
            open={noteDialogOpen} 
            onOpenChange={setNoteDialogOpen} 
            lead={selectedLead} 
          />
          
          <ViewLeadDialog 
            open={viewDialogOpen} 
            onOpenChange={setViewDialogOpen} 
            lead={selectedLead} 
          />
        </>
      )}
    </div>
  );
};

export default LeadList;
