
import { useState } from "react";
import { Bell, Search, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/branding/Logo";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
  };

  return (
    <header className="border-b bg-white py-3 px-4 sm:px-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo size="small" variant="text" className="hidden sm:flex" />
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="search"
              placeholder="Search..."
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-jezx-cyan focus:ring-1 focus:ring-jezx-cyan"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-gray-500 hover:text-jezx-cyan">
            <Bell className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              className="flex items-center gap-2"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="h-8 w-8 rounded-full bg-jezx-cyan flex items-center justify-center text-white">
                <User className="h-5 w-5" />
              </div>
              <span className="hidden sm:inline-block font-medium">
                {user?.name}
              </span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 z-10 mt-2 w-48 rounded-md border border-gray-100 bg-white py-2 shadow-lg">
                <div className="px-4 py-2 text-sm text-gray-500">
                  {user?.email}
                </div>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
