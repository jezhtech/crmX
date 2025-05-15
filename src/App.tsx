import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Auth
import Login from "./pages/Login";

// Admin routes
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminLeadDetail from "./pages/admin/AdminLeadDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDocuments from "./pages/admin/AdminDocuments";
import ChatDashboard from "./pages/admin/ChatDashboard";
import UserLogs from "./pages/admin/UserLogs";

// User routes
import UserDashboard from "./pages/user/UserDashboard";
import UserLeads from "./pages/user/UserLeads";
import UserLeadDetail from "./pages/user/UserLeadDetail";
import UserSettings from "./pages/user/UserSettings";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/leads" element={<AdminLeads />} />
            <Route path="/admin/leads/:id" element={<AdminLeadDetail />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/documents" element={<AdminDocuments />} />
            <Route path="/admin/chat-dashboard" element={<ChatDashboard />} />
            <Route path="/admin/user-logs" element={<UserLogs />} />
            
            {/* User routes */}
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/leads" element={<UserLeads />} />
            <Route path="/leads/:id" element={<UserLeadDetail />} />
            <Route path="/leads/add" element={<UserLeadDetail />} />
            <Route path="/settings" element={<UserSettings />} />
            
            {/* Default routes */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <SpeedInsights />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
