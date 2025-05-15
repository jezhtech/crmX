import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthContextType, User } from "../types/auth";
import { signIn, logOut, getCurrentUser } from "../services/auth";
import { initializeUsers } from "../scripts/initUsers";
import { logUserAction } from "../services/userLogs";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Try to initialize users (this will only create them if they don't exist)
        await initializeUsers();
        
        // Check if user is already logged in
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          
          // Log the user session restoration
          await logUserAction(
            currentUser.id,
            currentUser.name || currentUser.email.split('@')[0],
            "session",
            "system",
            "User session restored"
          );
        }
      } catch (err) {
        console.error("Error initializing authentication:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loggedInUser = await signIn(email, password);
      setUser(loggedInUser);
      
      // Log the login action
      await logUserAction(
        loggedInUser.id,
        loggedInUser.name || loggedInUser.email.split('@')[0],
        "login",
        "user",
        `User logged in: ${loggedInUser.email}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Log the logout action if user exists
      if (user) {
        await logUserAction(
          user.id,
          user.name || user.email.split('@')[0],
          "logout",
          "user",
          `User logged out: ${user.email}`
        );
      }
      
      await logOut();
      setUser(null);
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
