
import { useState } from "react";
import { Note } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface LeadNotesProps {
  leadId: string;
  notes: Note[];
}

const LeadNotes = ({ leadId, notes }: LeadNotesProps) => {
  const { user } = useAuth();
  const [newNote, setNewNote] = useState("");
  const [localNotes, setLocalNotes] = useState<Note[]>(notes);
  
  const handleAddNote = () => {
    if (!newNote.trim() || !user) return;
    
    const newNoteObj: Note = {
      id: `note-${Date.now()}`,
      content: newNote,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };
    
    setLocalNotes([newNoteObj, ...localNotes]);
    setNewNote("");
  };
  
  // Sort notes by date (newest first)
  const sortedNotes = [...localNotes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Add Note</h3>
        <div className="space-y-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add your note here..."
            className="w-full min-h-[100px] border border-gray-300 rounded-md p-3 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple"
          ></textarea>
          <Button 
            onClick={handleAddNote} 
            disabled={!newNote.trim()}
            className="bg-crm-purple hover:bg-crm-purple-dark"
          >
            Add Note
          </Button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Notes History</h3>
        {sortedNotes.length > 0 ? (
          <div className="space-y-6">
            {sortedNotes.map((note) => (
              <div key={note.id} className="border-l-2 border-gray-200 pl-4">
                <p className="whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Added on {new Date(note.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No notes yet. Add your first note above.</p>
        )}
      </div>
    </div>
  );
};

export default LeadNotes;
