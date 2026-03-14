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
          data: {
            name: name,
            full_name: name // Add both common keys to be safe
          },
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
    add: async (transaction: Partial<Transaction>) => {
      // Get current user session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required to add transactions.");

      // Ensure Date is YYYY-MM-DD for Supabase DATE column
      let formattedDate = transaction.date || new Date().toISOString().split('T')[0];
      if (formattedDate.includes('/')) {
        const [d, m, y] = formattedDate.split('/');
        formattedDate = `${y}-${m}-${d}`;
      }

      const dbData = {
        user_id: user.id,
        date: formattedDate,
        merchant: transaction.merchant || 'Unknown',
        amount: transaction.amount || 0,
        category: transaction.category || 'Other',
        type: transaction.type || 'debit',
        payment_method: transaction.paymentMethod || 'UPI'
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error("Supabase Error adding transaction:", error);
        throw error;
      }

      // Return with mapped property for frontend
      return {
        ...data,
        paymentMethod: data.payment_method
      } as Transaction;
    }
  },

  // ═══════════════════════════════════════════════
  // CA SYSTEM — ITR Documents CRUD
  // ═══════════════════════════════════════════════
  itrDocuments: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('itr_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching ITR documents:", error);
        return [];
      }

      return data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        assessmentYear: d.assessment_year,
        financialYear: d.financial_year,
        fileName: d.file_name,
        fileSize: d.file_size,
        fileType: d.file_type,
        fileUrl: d.file_url,
        filingStatus: d.filing_status,
        extractedData: d.extracted_data || {},
        aiSummary: d.ai_summary,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    },

    upload: async (fileData: {
      fileName: string;
      fileSize?: number;
      fileType?: string;
      assessmentYear: string;
      financialYear?: string;
      extractedData?: any;
      aiSummary?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required.");

      const dbData = {
        user_id: user.id,
        file_name: fileData.fileName,
        file_size: fileData.fileSize,
        file_type: fileData.fileType,
        assessment_year: fileData.assessmentYear,
        financial_year: fileData.financialYear || '',
        extracted_data: fileData.extractedData || {},
        ai_summary: fileData.aiSummary || '',
        filing_status: fileData.extractedData ? 'Filed' : 'Processing',
      };

      const { data, error } = await supabase
        .from('itr_documents')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error("Error uploading ITR:", error);
        throw error;
      }
      return data;
    },

    updateStatus: async (id: string, status: string, extractedData?: any, aiSummary?: string) => {
      const updateData: any = { filing_status: status, updated_at: new Date().toISOString() };
      if (extractedData) updateData.extracted_data = extractedData;
      if (aiSummary) updateData.ai_summary = aiSummary;

      const { error } = await supabase
        .from('itr_documents')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error("Error updating ITR status:", error);
        throw error;
      }
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('itr_documents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  // ═══════════════════════════════════════════════
  // CA SYSTEM — Invoices CRUD
  // ═══════════════════════════════════════════════
  invoices: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching invoices:", error);
        return [];
      }

      return data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        fileName: d.file_name,
        fileUrl: d.file_url,
        fileType: d.file_type,
        vendorName: d.vendor_name,
        invoiceNumber: d.invoice_number,
        invoiceDate: d.invoice_date,
        dueDate: d.due_date,
        subtotal: d.subtotal,
        taxAmount: d.tax_amount,
        totalAmount: d.total_amount,
        currency: d.currency,
        gstNumber: d.gst_number,
        lineItems: d.line_items || [],
        category: d.category,
        expenseType: d.expense_type,
        status: d.status,
        journalEntry: d.journal_entry,
        anomalyFlag: d.anomaly_flag,
        anomalyReason: d.anomaly_reason,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    },

    add: async (invoiceData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required.");

      const dbData = {
        user_id: user.id,
        file_name: invoiceData.fileName || 'invoice',
        file_type: invoiceData.fileType,
        vendor_name: invoiceData.vendorName,
        invoice_number: invoiceData.invoiceNumber,
        invoice_date: invoiceData.invoiceDate,
        due_date: invoiceData.dueDate,
        subtotal: invoiceData.subtotal,
        tax_amount: invoiceData.taxAmount,
        total_amount: invoiceData.totalAmount,
        currency: invoiceData.currency || 'INR',
        gst_number: invoiceData.gstNumber,
        line_items: invoiceData.lineItems || [],
        category: invoiceData.category,
        expense_type: invoiceData.expenseType || 'Business',
        status: 'Draft',
        journal_entry: invoiceData.journalEntry,
        anomaly_flag: false,
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error("Error adding invoice:", error);
        throw error;
      }
      return data;
    },

    updateStatus: async (id: string, status: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  // ═══════════════════════════════════════════════
  // CA SYSTEM — Chat History
  // ═══════════════════════════════════════════════
  chat: {
    getHistory: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error("Error fetching chat history:", error);
        return [];
      }

      return data.map((d: any) => ({
        id: d.id,
        role: d.role,
        text: d.text,
        timestamp: new Date(d.timestamp)
      }));
    },
    
    addMessage: async (role: 'user' | 'model', text: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: user.id,
          role,
          text
        }])
        .select()
        .single();

      if (error) {
        console.error("Error saving chat message:", error);
        return null;
      }
      return data;
    },

    clearHistory: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error("Error clearing chat history:", error);
        throw error;
      }
    }
  }
};
