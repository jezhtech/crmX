export type LeadStage = "new" | "contacted" | "qualified" | "proposal" | "project";

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  projectRequirementTitle: string;
  projectRequirementDetails: string;
  stage: LeadStage;
  value: number;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  notes: Note[];
}

export interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}
