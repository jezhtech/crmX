import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lead } from "@/types/lead";
import LeadStatusBadge from "./LeadStatusBadge";
import { formatCurrency } from "@/lib/utils";

interface ViewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

const ViewLeadDialog = ({ open, onOpenChange, lead }: ViewLeadDialogProps) => {
  const fieldLabels = {
    name: "Name",
    company: "Company",
    email: "Email",
    phone: "Phone",
    stage: "Status",
    value: "Potential Value",
    createdAt: "Created",
    updatedAt: "Last Updated"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Lead Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(fieldLabels).map(([key, label]) => (
              <div key={key}>
                <h4 className="text-sm font-medium text-gray-500">{label}</h4>
                {key === 'stage' ? (
                  <LeadStatusBadge stage={lead[key]} />
                ) : key === 'value' ? (
                  <p>{formatCurrency(lead[key] || 0)}</p>
                ) : key === 'createdAt' || key === 'updatedAt' ? (
                  <p>{lead[key] ? new Date(lead[key]).toLocaleString() : 'N/A'}</p>
                ) : (
                  <p>{lead[key] || 'N/A'}</p>
                )}
              </div>
            ))}
          </div>
          
          {lead.notes && lead.notes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
              <div className="space-y-2">
                {lead.notes.map((note, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewLeadDialog; 