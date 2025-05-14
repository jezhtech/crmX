
import { Lead, LeadStage, Note } from "../types/lead";
import { User } from "../types/auth";

// Mock Users
export const mockUsers: Omit<User, "role">[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@crmx.com",
    avatar: "",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@crmx.com",
    avatar: "",
  },
  {
    id: "3",
    name: "Robert Johnson",
    email: "robert@crmx.com",
    avatar: "",
  }
];

// Generate random mock leads
const generateMockLeads = (): Lead[] => {
  const stages: LeadStage[] = ["new", "contacted", "qualified", "proposal", "project"];
  const companies = ["Acme Inc", "Globex Corp", "Initech", "Stark Industries", "Wayne Enterprises", "Umbrella Corp"];
  
  return Array(15).fill(null).map((_, index) => {
    const stageIndex = Math.floor(Math.random() * stages.length);
    const userId = mockUsers[Math.floor(Math.random() * mockUsers.length)].id;
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    const notes: Note[] = Array(Math.floor(Math.random() * 3) + 1).fill(null).map((_, i) => {
      const noteDate = new Date();
      noteDate.setDate(noteDate.getDate() - i);
      
      return {
        id: `note-${index}-${i}`,
        content: `This is a note about the lead. Follow-up ${i + 1} completed.`,
        createdBy: userId,
        createdAt: noteDate.toISOString()
      };
    });
    
    return {
      id: `lead-${index + 1}`,
      name: `Contact ${index + 1}`,
      company: companies[Math.floor(Math.random() * companies.length)],
      email: `contact${index + 1}@example.com`,
      phone: `+1 (555) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
      stage: stages[stageIndex],
      value: Math.floor(1000 + Math.random() * 50000),
      assignedTo: userId,
      createdAt: date.toISOString(),
      updatedAt: new Date().toISOString(),
      notes: notes
    };
  });
};

export const mockLeads = generateMockLeads();

export const getLeadsByUser = (userId: string): Lead[] => {
  return mockLeads.filter(lead => lead.assignedTo === userId);
};

export const getAllLeads = (): Lead[] => {
  return mockLeads;
};

export const getLeadById = (id: string): Lead | undefined => {
  return mockLeads.find(lead => lead.id === id);
};
