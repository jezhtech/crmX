
import AppLayout from "@/components/layout/AppLayout";

const AdminSettings = () => {
  return (
    <AppLayout requiredRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Admin Settings</h1>
          <p className="text-gray-500">
            Configure system settings and preferences
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-medium mb-4">System Settings</h2>
          <p className="text-gray-500 mb-6">
            These settings affect the entire crmX application
          </p>
          
          <div className="space-y-6">
            <div className="max-w-md">
              <label className="block text-sm font-medium mb-2">
                Company Name
              </label>
              <input
                type="text"
                defaultValue="crmX"
                className="w-full rounded-md border border-gray-300 py-2 px-4 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple"
              />
            </div>
            
            <div className="max-w-md">
              <label className="block text-sm font-medium mb-2">
                Lead Stages
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Customize the lead pipeline stages
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue="New"
                    className="w-full rounded-md border border-gray-300 py-2 px-4 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue="Contacted"
                    className="w-full rounded-md border border-gray-300 py-2 px-4 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue="Qualified"
                    className="w-full rounded-md border border-gray-300 py-2 px-4 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue="Proposal"
                    className="w-full rounded-md border border-gray-300 py-2 px-4 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue="Project"
                    className="w-full rounded-md border border-gray-300 py-2 px-4 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminSettings;
