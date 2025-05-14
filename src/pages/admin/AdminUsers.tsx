
import AppLayout from "@/components/layout/AppLayout";
import UserList from "@/components/admin/UserList";

const AdminUsers = () => {
  return (
    <AppLayout requiredRole="admin">
      <UserList />
    </AppLayout>
  );
};

export default AdminUsers;
