import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lead } from "@/types/lead";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateLead, addNoteToLead } from "@/services/leadService";
import { createStatusChangeNotification } from "@/services/notificationService";
import { sendProjectStatusEmail } from "@/services/emailService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UpdateStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onStatusUpdated?: () => void;
}

const formSchema = z.object({
  stage: z.enum(["new", "contacted", "qualified", "proposal", "project", "rejected"])
});

const statusLabels = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  project: "Project",
  rejected: "Rejected"
};

const UpdateStatusDialog = ({ open, onOpenChange, lead, onStatusUpdated }: UpdateStatusDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stage: lead.stage || "new",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.id) {
      toast.error("You must be logged in to update lead status");
      return;
    }

    // Only proceed if the status is actually changing
    if (values.stage === lead.stage) {
      toast.info("Status remains unchanged");
      onOpenChange(false);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Update the lead status
      await updateLead(lead.id, { stage: values.stage });
      
      // Add a note about the status change
      const noteContent = `Status changed from ${statusLabels[lead.stage]} to ${statusLabels[values.stage]}`;
      await addNoteToLead(lead.id, noteContent, user.id);
      
      // Create a notification for admins
      await createStatusChangeNotification(
        lead,
        statusLabels[lead.stage],
        statusLabels[values.stage],
        user.name || user.email || "Unknown user"
      );
      
      // Send email notification if status changed to "project"
      if (values.stage === "project") {
        try {
          const updaterName = user.name || user.email || "Unknown user";
          await sendProjectStatusEmail(lead, updaterName);
          console.log("Project status email sent successfully");
        } catch (emailError) {
          console.error("Failed to send project status email:", emailError);
          // We don't want to fail the whole operation if just the email fails
          toast.error("Status updated but email notification failed");
        }
      }
      
      toast.success("Lead status updated successfully");
      if (onStatusUpdated) onStatusUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast.error("Failed to update lead status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Update Lead Status</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Status"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateStatusDialog; 