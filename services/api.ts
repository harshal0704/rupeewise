import { Transaction } from '../types';
import { supabase } from './supabaseClient';

// --- API SERVICE ---
export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { user: data.user, token: data.session?.access_token };
    },
    signup: async (name: string, email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      if (error) throw error;
      return { user: data.user, token: data.session?.access_token };
    },
    logout: async () => {
      await supabase.auth.signOut();
    },
    getCurrentUser: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  },
  transactions: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        return [];
      }
      return data as Transaction[];
    },
    add: async (transaction: Transaction) => {
      // Remove id to let DB generate it, or keep if using UUIDs from client
      const { id, ...txData } = transaction;
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...txData, user_id: (await supabase.auth.getUser()).data.user?.id }])
        .select()
        .single();

      if (error) throw error;
      return data as Transaction;
    }
  }
};
