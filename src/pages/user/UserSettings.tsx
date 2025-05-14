
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

const UserSettings = () => {
  const { user } = useAuth();
  
  return (
    <AppLayout requiredRole="user">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Account Settings</h1>
          <p className="text-gray-500">
            Manage your account preferences
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-medium mb-4">Profile Information</h2>
          
          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-2">
                Name
              </label>
              <input
                type="text"
                defaultValue={user?.name}
                className="w-full rounded-md border border-gray-300 py-2 px-4 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                defaultValue={user?.email}
                className="w-full rounded-md border border-gray-300 py-2 px-4 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Contact an administrator to change your email
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-md border border-gray-300 py-2 px-4 text-sm focus:border-crm-purple focus:ring-1 focus:ring-crm-purple"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to keep your current password
              </p>
            </div>
            
            <div className="pt-2">
              <button
                type="button"
                className="bg-crm-purple hover:bg-crm-purple-dark text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-medium mb-4">Notification Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500">
                  Receive updates about your leads via email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-crm-purple"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Lead Status Updates</p>
                <p className="text-sm text-gray-500">
                  Get notified when a lead changes status
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-crm-purple"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default UserSettings;
