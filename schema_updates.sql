-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS job_title text,
ADD COLUMN IF NOT EXISTS dream text,
ADD COLUMN IF NOT EXISTS goals jsonb DEFAULT '[]'::jsonb, -- Store goals as JSON array
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Ensure portfolio_holdings table exists (it was in the schema but let's be safe/additive)
-- If it already exists, this will just be ignored or error if we try to create again.
-- Since the previous view showed it exists, I will just add any missing columns if needed or just leave it.
-- The previous view showed: symbol, name, quantity, avg_price, type.
-- We might need 'current_price' cache or just fetch live.
-- for 'Place Order', we need to insert into this.

-- Create a function/policy to allow updates if not already there (already there).
