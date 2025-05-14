
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Edit, Trash, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import LeadStatusBadge from "./LeadStatusBadge";
import LeadNotes from "./LeadNotes";
import { getLeadById } from "@/services/mockData";
import { formatCurrency } from "@/lib/utils";

const LeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const baseUrl = isAdmin ? "/admin/leads" : "/leads";
  
  const [lead, setLead] = useState(id ? getLeadById(id) : undefined);
  
  if (!lead) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-2">Lead not found</h2>
        <p className="text-gray-500 mb-4">The lead you're looking for doesn't exist or has been removed.</p>
        <Button
          variant="outline"
          onClick={() => navigate(baseUrl)}
          className="mx-auto"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(baseUrl)}
              className="p-0 h-auto hover:bg-transparent"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
            <LeadStatusBadge stage={lead.stage} />
          </div>
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          <p className="text-gray-500">{lead.company}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {isAdmin && (
            <Button variant="outline" className="text-red-500 hover:text-red-700">
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Contact Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p>{lead.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p>{lead.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Lead Details</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Potential Value</p>
                        <p className="font-medium">{formatCurrency(lead.value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Created On</p>
                        <p>{new Date(lead.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <LeadNotes leadId={lead.id} notes={lead.notes} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="font-medium mb-4">Lead Actions</h3>
            <div className="space-y-2">
              <Button className="w-full bg-crm-purple hover:bg-crm-purple-dark">
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              <Button variant="outline" className="w-full">
                Update Stage
              </Button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg shadow-sm">
            <h3 className="font-medium mb-2">Lead Activity</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {[...lead.notes]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3)
                .map((note, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-3 py-1">
                    <p className="text-xs text-gray-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm truncate">{note.content}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
