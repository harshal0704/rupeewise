import React, { createContext, useContext, useState, useEffect } from 'react';
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
        .maybeSingle();

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
    // 1. Get the initial session (handles page refresh / PWA reload)
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        fetchProfile(sessionUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser) {
          fetchProfile(sessionUser.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    setUser(data.user);
    if (data.user) await fetchProfile(data.user.id);
  };

  const signup = async (name: string, email: string, pass: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { name, full_name: name } },
    });
    if (error) throw error;
    
    if (!data.session) {
      throw new Error("Registration successful. Please check your email to verify your account.");
    }
    
    setUser(data.user);
    if (data.user) await fetchProfile(data.user.id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
