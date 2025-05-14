
import AppLayout from "@/components/layout/AppLayout";
import LeadDetail from "@/components/leads/LeadDetail";

const AdminLeadDetail = () => {
  return (
    <AppLayout requiredRole="admin">
      <LeadDetail />
    </AppLayout>
  );
};

export default AdminLeadDetail;
