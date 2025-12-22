import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, db } from '@/lib/mock-db';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
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
    const session = localStorage.getItem('bronet_session');
    if (session) {
      try {
        const userData = JSON.parse(session);
        setUser(userData);
      } catch (e) {
        localStorage.removeItem('bronet_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        try {
          const user = db.authenticate(email, pass);
          setUser(user);
          localStorage.setItem('bronet_session', JSON.stringify(user));
          toast({ title: "Welcome back!", description: "You have successfully logged in." });
          resolve();
        } catch (e: any) {
          toast({ title: "Login failed", description: e.message, variant: "destructive" });
          reject(e);
        }
      }, 800); // Fake delay
    });
  };

  const signup = async (data: any) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        try {
          const newUser = db.createUser({
            email: data.email,
            passwordHash: btoa(data.password), // Simple encoding for mock
            firstName: data.firstName,
            lastName: data.lastName,
            planId: data.planId,
          });
          setUser(newUser);
          localStorage.setItem('bronet_session', JSON.stringify(newUser));
          toast({ title: "Account created!", description: "Welcome to BroNET." });
          resolve();
        } catch (e: any) {
          toast({ title: "Signup failed", description: e.message, variant: "destructive" });
          reject(e);
        }
      }, 800);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bronet_session');
    setLocation('/auth');
    toast({ title: "Logged out", description: "See you next time." });
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            const updated = db.updateUser(user.id, data);
            setUser(updated);
            localStorage.setItem('bronet_session', JSON.stringify(updated));
            toast({ title: "Profile updated" });
            resolve();
        }, 500);
    });
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
