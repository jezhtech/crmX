
import AppLayout from "@/components/layout/AppLayout";
import LeadDetail from "@/components/leads/LeadDetail";

const UserLeadDetail = () => {
  return (
    <AppLayout requiredRole="user">
      <LeadDetail />
    </AppLayout>
  );
};

export default UserLeadDetail;
