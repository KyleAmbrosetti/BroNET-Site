import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { api } from '@/lib/api';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  planId: string | null;
  isAdmin: number;
  joinedAt: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for session
    const checkAuth = async () => {
      const { data, error } = await api.getMe();
      if (data && !error) {
        setUser(data.user);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await api.login(email, pass);
    if (error) {
      toast({ title: "Login failed", description: error, variant: "destructive" });
      throw new Error(error);
    }
    setUser(data.user);
    toast({ title: "Welcome back!", description: "You have successfully logged in." });
  };

  const signup = async (data: any) => {
    const { data: responseData, error } = await api.signup(data);
    if (error) {
      toast({ title: "Signup failed", description: error, variant: "destructive" });
      throw new Error(error);
    }
    setUser(responseData.user);
    toast({ title: "Account created!", description: "Welcome to BroNET." });
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setLocation('/auth');
    toast({ title: "Logged out", description: "See you next time." });
  };

  const updateProfile = async (data: Partial<User>) => {
    const { data: responseData, error } = await api.updateProfile(data);
    if (error) {
      toast({ title: "Update failed", description: error, variant: "destructive" });
      throw new Error(error);
    }
    setUser(responseData.user);
    toast({ title: "Profile updated" });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useUser must be used within AuthProvider');
  return context;
}
