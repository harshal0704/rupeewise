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

      return data.map((t: any) => ({
        ...t,
        paymentMethod: t.payment_method // Map DB column to App type
      })) as Transaction[];
    },
    add: async (transaction: Transaction) => {
      // Remove id to let DB generate it
      const { id, paymentMethod, date, ...txData } = transaction;

      // Ensure Date is YYYY-MM-DD for Supabase DATE column
      // If input is DD/MM/YYYY, convert it. If already YYYY-MM-DD, keep it.
      let formattedDate = date;
      if (date.includes('/')) {
        const [d, m, y] = date.split('/');
        formattedDate = `${y}-${m}-${d}`;
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...txData,
          date: formattedDate,
          payment_method: paymentMethod, // Map App type to DB column
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Return with mapped property for frontend
      return {
        ...data,
        paymentMethod: data.payment_method
      } as Transaction;
    }
  }
};
