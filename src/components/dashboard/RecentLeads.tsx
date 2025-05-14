
import { Link } from "react-router-dom";
import { Lead } from "@/types/lead";
import { useAuth } from "@/contexts/AuthContext";
import LeadStatusBadge from "../leads/LeadStatusBadge";

interface RecentLeadsProps {
  leads: Lead[];
}

const RecentLeads = ({ leads }: RecentLeadsProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const baseUrl = isAdmin ? "/admin/leads" : "/leads";

  // Sort by most recent created date and take first 5
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Recent Leads</h3>
        <Link
          to={baseUrl}
          className="text-sm text-crm-purple hover:text-crm-purple-dark"
        >
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {recentLeads.length > 0 ? (
          recentLeads.map((lead) => (
            <div key={lead.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-md hover:bg-gray-50">
              <div>
                <Link
                  to={`${baseUrl}/${lead.id}`}
                  className="text-sm font-medium text-crm-purple hover:text-crm-purple-dark"
                >
                  {lead.name}
                </Link>
                <p className="text-xs text-gray-500">{lead.company}</p>
              </div>
              <LeadStatusBadge stage={lead.stage} />
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No leads yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentLeads;
