import React, { useState, useEffect } from "react";
import { Search, FileText, Download, Plus, Trash2, Filter, X, Upload, FileUp, Tag, Info, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { 
  Document,
  DocumentType,
  getAllDocuments, 
  uploadDocument, 
  deleteDocument,
  getDocumentsByLead
} from "@/services/documentService";
import { getLeadById, getAllLeads } from "@/services/leadService";
import { Lead } from "@/types/lead";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { db, storage, safeUploadFile, enhancedUploadFile } from '@/lib/firebase';
import { Progress } from "@/components/ui/progress";

// Form validation schema
const uploadFormSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  file: z.any().refine(file => file && file instanceof File, "File is required"),
  type: z.string().min(1, "Document type is required"),
  leadId: z.string().min(1, "Lead is required"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof uploadFormSchema>;

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'contract', label: 'Contract' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'project_closure', label: 'Project Closure' },
  { value: 'project_details', label: 'Project Details' },
  { value: 'client_document', label: 'Client Document' },
  { value: 'other', label: 'Other' }
];

// Add a type definition for upload results
interface UploadResult {
  success: boolean;
  url?: string;
  ref?: any;
  error?: any;
  isLocal?: boolean;
  metadata?: any;
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: 32 }}>
          <h2>Something went wrong in AdminDocuments:</h2>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Define the DocumentList component
const DocumentList = ({ documents, isLoading, onViewDocument, onViewLeadDocuments = undefined }) => {
  if (isLoading) {
    return <div className="py-8 text-center">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return <div className="py-8 text-center">No documents found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <FileText className="flex-shrink-0 h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm font-medium text-gray-900">{doc.fileName}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {doc.type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {onViewLeadDocuments ? (
                  <button 
                    onClick={() => onViewLeadDocuments(doc.leadId)}
                    className="hover:underline text-blue-600"
                  >
                    {doc.leadName} - {doc.company}
                  </button>
                ) : (
                  <span>{doc.leadName} - {doc.company}</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(doc.createdAt).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onViewDocument(doc)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminDocuments = () => {
  console.log("AdminDocuments: Component rendering started");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadFilter, setLeadFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState<"all" | DocumentType>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  
  // State for lead details view
  const [leadDocumentView, setLeadDocumentView] = useState(false);
  const [leadDocuments, setLeadDocuments] = useState<Document[]>([]);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [fileNameInput, setFileNameInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [uploadedFileRef, setUploadedFileRef] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      fileName: "",
      file: undefined,
      type: "",
      leadId: "",
      description: "",
      tags: [],
    }
  });

  // Fetch documents and leads data
  useEffect(() => {
    console.log("AdminDocuments: Fetching data started");
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log("AdminDocuments: Starting to fetch documents and leads");
        const [docsData, leadsData] = await Promise.all([
          getAllDocuments(),
          getAllLeads()
        ]);
        
        console.log(`AdminDocuments: Fetched ${docsData.length} documents and ${leadsData.length} leads`);
        setDocuments(docsData);
        setLeads(leadsData);
      } catch (error) {
        console.error("AdminDocuments: Error fetching data:", error);
        toast({
          title: "Error loading data",
          description: "Failed to load documents and leads",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        console.log("AdminDocuments: Finished fetching data");
      }
    };

    fetchData();
  }, [toast]);

  // Handle file selection and start upload
  const handleFileSelection = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Set file input and auto-populate filename
    setFileInput(file);
    const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
    setFileNameInput(nameWithoutExtension || file.name);
    
    // Don't start upload automatically - we'll do it during save
    console.log("File selected:", file.name, "size:", file.size);
    toast({
      title: 'File selected',
      description: 'File will be uploaded when you click Save Document',
    });
  };

  // Complete document creation with form data
  const completeDocumentCreation = async () => {
    if (!fileInput || !fileNameInput) {
      toast({
        title: 'Missing information',
        description: 'Please select a file and provide a display name',
        variant: 'destructive'
      });
      return;
    }
    
    setUploading(true);
    
    try {
      // Get form values
      const leadId = form.getValues("leadId") || "general";
      const docType = form.getValues("type") || "other";
      const description = form.getValues("description") || "";
      
      // Generate a unique ID for this document
      const documentId = uuidv4();
      console.log("Creating document with ID:", documentId);
      
      // 1. Upload the file using a simpler method
      console.log("Starting file upload for:", fileInput.name);
      
      // Create an extremely simple path structure
      const storageRef = ref(storage, `files/${documentId}`);
      
      // Perform a simple upload with minimal configuration
      const uploadTask = uploadBytes(storageRef, fileInput);
      console.log("Upload started...");
      
      const snapshot = await uploadTask;
      console.log("Upload completed", snapshot);
      
      // 2. Get the download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log("Download URL:", downloadUrl);
      
      // 3. Create the document in Firestore
      const docData = {
        id: documentId,
        fileName: fileNameInput,
        originalFileName: fileInput.name,
        fileUrl: downloadUrl,
        fileType: fileInput.type,
        fileSize: fileInput.size,
        leadId: leadId,
        leadName: leads.find(lead => lead.id === leadId)?.name || "General",
        company: leads.find(lead => lead.id === leadId)?.company || "General",
        type: docType as DocumentType,
        description: description,
        tags: customTags,
        uploadedBy: user?.id || "anonymous",
        createdAt: new Date().toISOString()
      };
      
      console.log("Saving document metadata:", docData);
      
      // Create document record in Firestore
      const docRef = await addDoc(collection(db, 'documents'), docData);
      console.log("Document saved with ID:", docRef.id);
      
      // Success notification
      toast({
        title: 'Document created',
        description: 'Document has been successfully created and saved',
      });
      
      // Reset form and state
      setAddDialogOpen(false);
      setFileInput(null);
      setFileNameInput("");
      setCustomTags([]);
      setUploadProgress(0);
      form.reset();
      
      // Refresh document list
      const docsData = await getAllDocuments();
      setDocuments(docsData);
    } catch (error) {
      console.error("Error creating document:", error);
      toast({
        title: 'Failed to create document',
        description: `Error: ${error.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;
    
    try {
      await deleteDocument(selectedDocument.id, selectedDocument.fileUrl);
      
      // Update local state
      setDocuments(prev => prev.filter(doc => doc.id !== selectedDocument.id));
      
      toast({
        title: "Document deleted",
        description: "Document has been deleted successfully",
      });
      
      // Close dialogs
      setConfirmDeleteOpen(false);
      setViewDialogOpen(false);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  // Handle adding new tag
  const handleAddTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      setCustomTags([...customTags, newTag.trim()]);
      setNewTag("");
    }
  };

  // Handle removing tag
  const handleRemoveTag = (tag: string) => {
    setCustomTags(customTags.filter(t => t !== tag));
  };

  // Handle viewing lead documents
  const handleViewLeadDocuments = async (lead: Lead) => {
    setIsLoading(true);
    try {
      const leadDocs = await getDocumentsByLead(lead.id);
      setLeadDocuments(leadDocs);
      setSelectedLead(lead);
      setLeadDocumentView(true);
    } catch (error) {
      console.error("Error fetching lead documents:", error);
      toast({
        title: "Error",
        description: "Failed to load lead documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to all documents view
  const handleBackToAllDocuments = () => {
    setLeadDocumentView(false);
    setSelectedLead(null);
  };

  // Filter documents based on search term, current tab, and lead filter
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesType = currentTab === "all" || doc.type === currentTab;
    const matchesLead = leadFilter === "all" || doc.leadId === leadFilter;
    
    return matchesSearch && matchesType && matchesLead;
  });

  // Add a simple document upload dialog
  const DirectUploadDialog = () => {
    // Simple local state for form fields
    const [localFile, setLocalFile] = useState<File | null>(null);
    const [localFileName, setLocalFileName] = useState("");
    const [localLeadId, setLocalLeadId] = useState("general");
    const [localDocType, setLocalDocType] = useState("");
    const [localDescription, setLocalDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    // Reset form when dialog opens
    useEffect(() => {
      if (addDialogOpen) {
        setLocalFile(null);
        setLocalFileName("");
        setLocalLeadId("general");
        setLocalDocType("");
        setLocalDescription("");
        setIsSaving(false);
      }
    }, [addDialogOpen]);
    
    // Handle file selection without starting upload
    const handleFileSelect = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Update local state only
      setLocalFile(file);
      
      // Auto-populate file name from file name without extension
      const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
      setLocalFileName(nameWithoutExtension || file.name);
    };
    
    // Handle upload and form submission in one step
    const handleUploadDocument = async (e) => {
      e.preventDefault();
      
      // Validate required fields
      if (!localFile) {
        toast({
          title: 'No file selected',
          description: 'Please select a file to upload',
          variant: 'destructive'
        });
        return;
      }
      
      if (!localFileName) {
        toast({
          title: 'Missing information',
          description: 'Please provide a display name for the document',
          variant: 'destructive'
        });
        return;
      }
      
      setIsSaving(true);
      
      try {
        // Generate a document ID - simpler format to avoid encoding issues
        const timestamp = Date.now();
        const documentId = `doc_${timestamp}`;
        console.log("Creating document with simple ID:", documentId);
        
        // 1. Create a very simple storage path - avoid special characters
        const simplePath = `documents/doc_${timestamp}`;
        console.log("Using simplified storage path:", simplePath);
        
        // 2. Use our enhanced upload function with local fallback
        console.log("Starting upload with fallback...");
        const uploadResult = await enhancedUploadFile(simplePath, localFile) as UploadResult;
        
        if (!uploadResult.success) {
          throw new Error("Upload failed: " + (uploadResult.error || "Unknown error"));
        }
        
        console.log("Upload completed successfully");
        
        // 3. Get the download URL from result
        const downloadUrl = uploadResult.url;
        console.log("Download URL:", downloadUrl);
        
        // Add a flag for local storage files to track and handle them differently
        const isLocalStorage = !!uploadResult.isLocal;
        
        // 4. Store the document metadata in Firestore
        console.log("Saving document metadata to Firestore...");
        const docData = {
          id: documentId,
          fileName: localFileName,
          originalFileName: localFile.name,
          fileUrl: downloadUrl,
          fileType: localFile.type || "",
          fileSize: localFile.size || 0,
          leadId: localLeadId || "general",
          leadName: leads.find(lead => lead.id === localLeadId)?.name || "General",
          company: leads.find(lead => lead.id === localLeadId)?.company || "General",
          type: localDocType || "other",
          description: localDescription || "",
          tags: [],
          uploadedBy: user?.id || "anonymous",
          createdAt: new Date().toISOString(),
          isLocalStorage: isLocalStorage, // Track if it's a local storage file
          localMetadata: isLocalStorage ? uploadResult.metadata : null
        };
        
        // Save to Firestore
        await addDoc(collection(db, 'documents'), docData);
        console.log("Document metadata saved to Firestore");
        
        // Show success message with info about local storage if applicable
        if (isLocalStorage) {
          toast({
            title: 'Document uploaded locally',
            description: 'Document saved in browser storage due to connection issues. It will be available until you close this browser window.',
          });
        } else {
          toast({
            title: 'Document uploaded',
            description: 'Document has been successfully uploaded and saved',
          });
        }
        
        // Close dialog and reset form
        setAddDialogOpen(false);
        
        // Refresh document list
        const docsData = await getAllDocuments();
        setDocuments(docsData);
      } catch (error) {
        console.error("Error uploading document:", error);
        toast({
          title: 'Upload failed',
          description: `Error: ${error.message || 'Unknown error'}`,
          variant: 'destructive'
        });
      } finally {
        setIsSaving(false);
      }
    };
    
    return (
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a document to the system
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUploadDocument} className="space-y-4">
            {/* File Selection */}
            <div className="space-y-2">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
                Select File
              </label>
              <input
                id="file-upload"
                type="file"
                className="block w-full border border-gray-300 rounded-md p-2"
                onChange={handleFileSelect}
                disabled={isSaving}
              />
              {localFile && (
                <p className="text-sm text-green-600">
                  Selected: {localFile.name}
                </p>
              )}
            </div>
            
            {/* Display Name */}
            <div className="space-y-2">
              <label htmlFor="display-name" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                id="display-name"
                type="text"
                className="block w-full border border-gray-300 rounded-md p-2"
                value={localFileName}
                onChange={(e) => setLocalFileName(e.target.value)}
                placeholder="Enter a name for this document"
                disabled={isSaving}
              />
            </div>
            
            {/* Lead Selection */}
            <div className="space-y-2">
              <label htmlFor="lead-select" className="block text-sm font-medium text-gray-700">
                Client
              </label>
              <select
                id="lead-select"
                className="block w-full border border-gray-300 rounded-md p-2"
                value={localLeadId}
                onChange={(e) => setLocalLeadId(e.target.value)}
                disabled={isSaving}
              >
                <option value="general">General</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} - {lead.company}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Document Type */}
            <div className="space-y-2">
              <label htmlFor="doc-type" className="block text-sm font-medium text-gray-700">
                Document Type
              </label>
              <select
                id="doc-type"
                className="block w-full border border-gray-300 rounded-md p-2"
                value={localDocType}
                onChange={(e) => setLocalDocType(e.target.value)}
                disabled={isSaving}
              >
                <option value="">Select document type</option>
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Description Field */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                className="block w-full border border-gray-300 rounded-md p-2 min-h-[80px]"
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                placeholder="Enter a description for this document"
                disabled={isSaving}
              />
            </div>
            
            <DialogFooter className="mt-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm"
                onClick={() => setAddDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isSaving || !localFile || !localFileName}
              >
                {isSaving ? 'Uploading...' : 'Upload Document'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Basic file change handler for the form
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("file", file);
      
      // Auto-fill filename from the file if empty
      if (!form.getValues("fileName")) {
        // Remove extension from filename
        const fileName = file.name.split('.').slice(0, -1).join('.');
        form.setValue("fileName", fileName);
      }
    }
  };

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    if (!user) return;
    
    try {
      const selectedLead = leads.find(lead => lead.id === data.leadId);
      
      if (!selectedLead) {
        toast({
          title: "Error",
          description: "Selected lead not found",
          variant: "destructive",
        });
        return;
      }
      
      const file = data.file as File;
      
      // Continue with document creation
      // ... rest of the function can be simplified to use the new upload method
      toast({
        title: "Form submitted",
        description: "Please use the normal upload dialog for now.",
      });
      setUploadDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to process form",
        variant: "destructive",
      });
    }
  };

  // Legacy handler for backward compatibility
  const handleAddDocument = () => {
    // Now we use the new process
    setAddDialogOpen(true);
  };

  return (
    <AppLayout requiredRole="admin">
      <ErrorBoundary>
      <div className="space-y-6">
          {leadDocumentView ? (
            // Lead documents view
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                  Documents for {selectedLead?.name} - {selectedLead?.company}
                </h1>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBackToAllDocuments}
                >
                  Back to All Documents
                </Button>
              </div>
        
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="search"
                    placeholder="Search lead documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple"
            />
          </div>
                <Button 
                  onClick={() => {
                    form.setValue("leadId", selectedLead?.id || "");
                    setUploadDialogOpen(true);
                  }}
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
        </div>
        
        <Tabs 
          defaultValue="all" 
          value={currentTab}
                onValueChange={(value) => setCurrentTab(value as "all" | DocumentType)}
          className="w-full"
        >
                <TabsList className="grid grid-cols-4 md:flex md:w-auto">
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="proposal">Proposals</TabsTrigger>
            <TabsTrigger value="invoice">Invoices</TabsTrigger>
            <TabsTrigger value="contract">Contracts</TabsTrigger>
                  <TabsTrigger value="receipt">Receipts</TabsTrigger>
                  <TabsTrigger value="project_closure">Closure</TabsTrigger>
                  <TabsTrigger value="project_details">Details</TabsTrigger>
                  <TabsTrigger value="client_document">Client Docs</TabsTrigger>
          </TabsList>
          
          <TabsContent value={currentTab} className="mt-4">
                  <DocumentList 
                    documents={leadDocuments.filter(doc => 
                      currentTab === "all" || doc.type === currentTab
                    )}
                    isLoading={isLoading}
                    onViewDocument={(doc) => {
                      setSelectedDocument(doc);
                      setViewDialogOpen(true);
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            // All documents view
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Document Management</h1>
                <Button 
                  onClick={() => {
                    // Open the simple upload dialog
                    setAddDialogOpen(true);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </div>
              
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="search"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple"
                  />
                </div>
                
                <Select
                  value={leadFilter}
                  onValueChange={setLeadFilter}
                >
                  <SelectTrigger className="w-full md:w-52">
                    <SelectValue placeholder="Filter by Lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leads</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} - {lead.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
              
              <Tabs 
                defaultValue="all" 
                value={currentTab}
                onValueChange={(value) => setCurrentTab(value as "all" | DocumentType)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 md:flex md:w-auto">
                  <TabsTrigger value="all">All Documents</TabsTrigger>
                  <TabsTrigger value="proposal">Proposals</TabsTrigger>
                  <TabsTrigger value="invoice">Invoices</TabsTrigger>
                  <TabsTrigger value="contract">Contracts</TabsTrigger>
                  <TabsTrigger value="receipt">Receipts</TabsTrigger>
                  <TabsTrigger value="project_closure">Closure</TabsTrigger>
                  <TabsTrigger value="project_details">Details</TabsTrigger>
                  <TabsTrigger value="client_document">Client Docs</TabsTrigger>
                </TabsList>
                
                <TabsContent value={currentTab} className="mt-4">
                  <DocumentList 
                    documents={filteredDocuments}
                    isLoading={isLoading}
                    onViewDocument={(doc) => {
                      setSelectedDocument(doc);
                      setViewDialogOpen(true);
                    }}
                    onViewLeadDocuments={(leadId) => {
                      const lead = leads.find(l => l.id === leadId);
                      if (lead) {
                        handleViewLeadDocuments(lead);
                      }
                    }}
                  />
          </TabsContent>
        </Tabs>
      </div>
          )}
        </div>

        {/* Upload Document Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a document associated with a lead
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="leadId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!!selectedLead}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a lead" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leads.map((lead) => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.name} - {lead.company}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <Input 
                          type="file"
                          onChange={onFileChange}
                          className="cursor-pointer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fileName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter document name" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter document description"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel>Tags (Optional)</FormLabel>
                  <div className="flex gap-2 flex-wrap mb-2">
                    {customTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="px-3 py-1">
                        {tag}
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddTag}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                <DialogFooter className="pt-4">
                  <div className="flex gap-2 w-full justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setUploadDialogOpen(false);
                        form.reset();
                        setCustomTags([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        type="button"
                        onClick={() => {
                          // Get the file from the form
                          const file = form.getValues("file");
                          if (!file) {
                            toast({
                              title: "Error",
                              description: "Please select a file to upload",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          // Set the file input and name for direct upload
                          setFileInput(file);
                          setFileNameInput(form.getValues("fileName") || file.name);
                          
                          // Call the simplified upload method
                          handleAddDocument();
                        }}
                      >
                        Quick Upload
                      </Button>
                      <Button type="submit">Upload with Details</Button>
                    </div>
                  </div>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View Document Dialog */}
        {selectedDocument && (
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>{selectedDocument.fileName}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Type</h4>
                    <p>{DOCUMENT_TYPES.find(t => t.value === selectedDocument.type)?.label || selectedDocument.type}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Lead</h4>
                    <p>{selectedDocument.leadName} - {selectedDocument.company}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Upload Date</h4>
                    <p>{new Date(selectedDocument.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Size</h4>
                    <p>{selectedDocument.fileSize}</p>
                  </div>
                </div>
                
                {selectedDocument.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="whitespace-pre-wrap">{selectedDocument.description}</p>
                  </div>
                )}
                
                {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Tags</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedDocument.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="border rounded-md p-6 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">{selectedDocument.fileName}</p>
                    <p className="text-sm text-gray-500">{selectedDocument.fileType}</p>
                    <div className="mt-4">
                      <a 
                        href={selectedDocument.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between">
                <Button 
                  variant="destructive" 
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Confirm Delete Dialog */}
        <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this document? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setConfirmDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteDocument}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Direct Upload Dialog */}
        <DirectUploadDialog />
      </ErrorBoundary>
    </AppLayout>
  );
};

export default AdminDocuments;
