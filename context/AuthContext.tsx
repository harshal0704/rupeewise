import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: any;
  profile: any;
  loading: boolean;
  login: (e: string, p: string) => Promise<void>;
  signup: (n: string, e: string, p: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Profile error:", err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = await api.auth.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
        await fetchProfile(storedUser.id);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await api.auth.login(email, pass);
    setUser(data.user);
    if (data.user) await fetchProfile(data.user.id);
  };

  const signup = async (name: string, email: string, pass: string) => {
    const data = await api.auth.signup(name, email, pass);
    setUser(data.user);
    // Profile is created via DB trigger, but we fetch it to be safe/synced
    if (data.user) await fetchProfile(data.user.id);
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
