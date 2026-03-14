-- ==========================================
-- CA Enhancement: ITR Documents Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.itr_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  assessment_year text NOT NULL,          -- e.g. '2024-25'
  financial_year text,                    -- e.g. '2023-24'
  file_url text,                          -- Supabase storage URL
  file_name text NOT NULL,
  file_size integer,
  file_type text,                         -- 'application/pdf', 'image/png', etc.
  filing_status text CHECK (filing_status IN ('Filed', 'Pending', 'Processing', 'Error')) DEFAULT 'Processing',

  -- AI-extracted structured data
  extracted_data jsonb DEFAULT '{}',
  -- Expected shape:
  -- {
  --   "gross_income": number,
  --   "total_income": number,
  --   "total_deductions": number,
  --   "taxable_income": number,
  --   "tax_paid": number,
  --   "refund_amount": number,
  --   "regime": "Old" | "New",
  --   "income_sources": { "salary": number, "business": number, "capital_gains": number, "house_property": number, "other": number },
  --   "deductions": { "80C": number, "80D": number, "80E": number, "80G": number, "HRA": number, "LTA": number, "NPS_80CCD": number },
  --   "form_type": "ITR-1" | "ITR-2" | "ITR-3" | "ITR-4" etc.,
  --   "pan": "XXXXX1234X" (masked),
  --   "acknowledgement_number": string,
  --   "filing_date": string
  -- }

  ai_summary text,                        -- AI-generated plain English summary
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.itr_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own ITR documents"
  ON public.itr_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ITR documents"
  ON public.itr_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ITR documents"
  ON public.itr_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ITR documents"
  ON public.itr_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_itr_documents_user_id ON public.itr_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_itr_documents_ay ON public.itr_documents(user_id, assessment_year);


-- ==========================================
-- CA Enhancement: Invoices Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  file_url text,
  file_name text NOT NULL,
  file_type text,

  -- OCR-extracted fields
  vendor_name text,
  invoice_number text,
  invoice_date date,
  due_date date,
  subtotal numeric(12, 2),
  tax_amount numeric(12, 2),
  total_amount numeric(12, 2),
  currency text DEFAULT 'INR',
  gst_number text,

  -- Line items as JSONB array
  line_items jsonb DEFAULT '[]',
  -- Expected shape: [{ "description": string, "quantity": number, "unit_price": number, "amount": number, "gst_rate": number }]

  -- Categorization
  category text,
  expense_type text CHECK (expense_type IN ('Business', 'Personal', 'Mixed')) DEFAULT 'Business',

  -- Approval workflow
  status text CHECK (status IN ('Draft', 'Approved', 'Rejected', 'Booked')) DEFAULT 'Draft',
  journal_entry text,                    -- AI-drafted accounting entry

  -- Anomaly detection
  anomaly_flag boolean DEFAULT false,
  anomaly_reason text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(user_id, status);


-- ==========================================
-- Supabase Storage Bucket for ITR files
-- ==========================================
-- Run in Supabase dashboard SQL editor or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('itr-documents', 'itr-documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);
--
-- Then add storage policies:
-- CREATE POLICY "Users can upload their own ITR files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'itr-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can view their own ITR files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'itr-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
