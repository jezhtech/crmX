import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/branding/Logo";
import {
  LayoutDashboard,
  Users,
  FileText,
  ChevronRight,
  ChevronLeft,
  File,
  Phone,
  Mail,
} from "lucide-react";

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === "admin";
  const baseRoutes = isAdmin ? "/admin" : "";

  const navItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      path: `${baseRoutes}/dashboard`,
    },
    {
      name: "Leads",
      icon: <FileText size={18} />,
      path: `${baseRoutes}/leads`,
    },
    ...(isAdmin
      ? [
          {
            name: "Users",
            icon: <Users size={18} />,
            path: "/admin/users",
          },
          {
            name: "Documents",
            icon: <File size={18} />,
            path: "/admin/documents",
          }
        ]
      : []),
  ];

  return (
    <aside
      className={`bg-sidebar text-sidebar-foreground ${
        collapsed ? "w-16" : "w-56"
      } flex flex-col transition-all duration-300 ease-in-out`}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          {!collapsed ? (
            <Logo variant="text" className="text-white" />
          ) : (
            <Logo variant="icon" className="text-white" />
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:text-white p-1 rounded"
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>
      </div>

      <nav className="flex-1 mt-6 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/70"
                  } flex items-center gap-3 px-3 py-2 rounded-md transition-colors`}
                >
                  <span>{item.icon}</span>
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && !isAdmin && (
        <div className="p-4 mb-2">
          <div className="rounded-md bg-sidebar-accent/30 p-3">
            <div className="text-xs">
              <p className="font-medium text-sidebar-foreground mb-2">
                Need Assistance?
              </p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-white">Sneha</p>
                  <p className="text-sidebar-foreground/80 text-[10px]">Customer Relationship Manager</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Phone size={10} />
                    <p className="text-sidebar-foreground/80 text-[10px]">+971 50 298 2413</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail size={10} />
                    <p className="text-sidebar-foreground/80 text-[10px]">sneha@lagoontechnologies.com</p>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium text-white">Arshitha</p>
                  <p className="text-sidebar-foreground/80 text-[10px]">Operational Manager</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Phone size={10} />
                    <p className="text-sidebar-foreground/80 text-[10px]">+91 6379 283 852</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail size={10} />
                    <p className="text-sidebar-foreground/80 text-[10px]">arshitha@jezhtechnologies.com</p>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium text-white">Benadict Arul</p>
                  <p className="text-sidebar-foreground/80 text-[10px]">Operational Manager</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Phone size={10} />
                    <p className="text-sidebar-foreground/80 text-[10px]">+971 50 134 7505</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail size={10} />
                    <p className="text-sidebar-foreground/80 text-[10px]">benadict@lagoontechnologies.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="rounded-md bg-sidebar-accent/30 p-3">
          {!collapsed && (
            <div className="text-xs">
              <p className="font-medium text-sidebar-foreground">
                {user?.role === "admin" ? "Admin" : "User"} Account
              </p>
              <p className="mt-1 text-sidebar-foreground/80">{user?.email}</p>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center">
              <div className="h-6 w-6 rounded-full bg-sidebar-primary flex items-center justify-center text-white text-xs">
                {user?.role === "admin" ? "A" : "U"}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
