import { useState, useEffect } from "react";
import { Search, Filter, Plus, ArrowUpDown, Edit, Eye, UserCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  getAllUsers, 
  User, 
  updateUserStatus, 
  updateUserRole,
  addUser 
} from "@/services/userService";
import { useToast } from "@/hooks/use-toast";
import UserDetailDialog from "./UserDetailDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

// Form schema for adding a new user
const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "user"]),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type UserFormData = z.infer<typeof userFormSchema>;

const UserList = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [sortField, setSortField] = useState<keyof User | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [addingRole, setAddingRole] = useState<"admin" | "user">("user");
  
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      password: "",
    },
  });
  
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error loading users",
          description: "There was a problem loading the users data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);
  
  // Filter users by search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = String(a[sortField]).toLowerCase();
    const bValue = String(b[sortField]).toLowerCase();
    
    return sortDirection === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });
  
  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New sort field
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await updateUserStatus(user.id, !user.active);
      // Update local state
      setUsers(users.map(u => 
        u.id === user.id ? {...u, active: !user.active} : u
      ));
      toast({
        title: "Status updated",
        description: `User ${user.name} is now ${!user.active ? "active" : "inactive"}`,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "Error updating status",
        description: "There was a problem updating the user status",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    // For now, just show a toast - could be expanded to open an edit dialog
    toast({
      title: "Edit user",
      description: `Editing user ${user.name}`,
    });
  };

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };
  
  const handleAddUserClick = (role: "admin" | "user") => {
    setAddingRole(role);
    form.setValue("role", role);
    setAddUserDialogOpen(true);
  };
  
  const onAddUserSubmit = async (data: UserFormData) => {
    try {
      // Note: addUser function needs to be implemented in userService.ts
      // This is a placeholder - you'll need to update the actual implementation
      await addUser({
        name: data.name,
        email: data.email,
        role: data.role,
        password: data.password,
      });
      
      toast({
        title: "User added",
        description: `${data.name} has been added as a ${data.role}`,
      });
      
      // Refresh user list
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
      
      // Close dialog and reset form
      setAddUserDialogOpen(false);
      form.reset();
      
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error adding user",
        description: "There was a problem adding the user",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Users</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleAddUserClick("user")}
            className="whitespace-nowrap"
          >
            <UserCircle className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button 
            size="sm"
            onClick={() => handleAddUserClick("admin")}
            className="bg-crm-purple hover:bg-crm-purple-dark whitespace-nowrap"
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : (
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
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center">
                      Email
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center">
                      Role
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("active")}
                  >
                    <div className="flex items-center">
                      Status
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedUsers.length > 0 ? (
                  sortedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === "admin" 
                              ? "bg-purple-100 text-purple-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.active 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <button 
                            onClick={() => handleViewUserDetails(user)}
                            className="text-purple-600 hover:text-purple-800" 
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm ? 'No users match your search' : 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* User Detail Dialog */}
      {selectedUser && (
        <UserDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          user={selectedUser}
        />
      )}
      
      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Add {addingRole === "admin" ? "Administrator" : "User"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddUserSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAddUserDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add {addingRole === "admin" ? "Administrator" : "User"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserList;
