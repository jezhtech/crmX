import { useAuth } from "@/contexts/AuthContext";
import { logUserAction } from "@/services/userLogs";

export function useActivityLog() {
  const { user } = useAuth();

  const logActivity = async (
    action: string,
    resourceType: string,
    description: string,
    resourceId?: string
  ) => {
    if (!user) return;

    try {
      await logUserAction(
        user.id,
        user.name || user.email.split('@')[0],
        action,
        resourceType,
        description,
        resourceId
      );
    } catch (error) {
      console.error("Error logging user activity:", error);
    }
  };

  return { logActivity };
}

export default useActivityLog; 