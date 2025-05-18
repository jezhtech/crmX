import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import ChatAssistant from "@/components/chat/ChatAssistant";

interface AppLayoutProps {
  children: ReactNode;
  requiredRole?: "admin" | "user" | "any";
}

const AppLayout = ({ children, requiredRole = "any" }: AppLayoutProps) => {
  const { user, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-crm-purple"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role permissions
  if (requiredRole !== "any" && user.role !== requiredRole) {
    // Redirect users based on their role
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="h-screen flex w-full overflow-hidden">
      <div className="fixed inset-y-0 left-0">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col ml-16 sm:ml-56">
        <div className="sticky top-0 z-10">
          <Navbar />
        </div>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
        <div className="sticky bottom-0 z-10">
          <Footer />
        </div>
      </div>
      <ChatAssistant />
    </div>
  );
};

export default AppLayout;
