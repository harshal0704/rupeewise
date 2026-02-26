import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that we have real credentials (not placeholder values)
const isValidUrl = supabaseUrl && supabaseUrl.startsWith('http');
const isValidKey = supabaseAnonKey && supabaseAnonKey.length > 20;

if (!isValidUrl || !isValidKey) {
    console.warn(
        "⚠️ Missing or invalid Supabase credentials. Auth features will be unavailable.\n" +
        "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
    );
}

// Create a real client if credentials are valid, otherwise create a dummy client
// that won't crash the app on import
export const supabase: SupabaseClient = isValidUrl && isValidKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder');
