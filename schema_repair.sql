-- ==========================================
-- 0. PROFILES TABLE (User Details & Onboarding)
-- ==========================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  onboarding_completed boolean default false,
  investment_goal text,
  experience_level text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies (Drop first to avoid errors if they exist)
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, onboarding_completed)
  values (new.id, new.raw_user_meta_data->>'name', false);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- BACKFILL: Ensure all existing users have a profile
-- ==========================================
insert into public.profiles (id, full_name, onboarding_completed)
select id, raw_user_meta_data->>'name', false
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;

-- ==========================================
-- UPDATES: Add new columns to profiles
-- ==========================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS job_title text,
ADD COLUMN IF NOT EXISTS dream text,
ADD COLUMN IF NOT EXISTS goals jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- ==========================================
-- 4. PORTFOLIO HOLDINGS TABLE
-- ==========================================
create table if not exists public.portfolio_holdings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  symbol text not null,
  name text,
  quantity numeric(12, 4) not null, 
  avg_price numeric(12, 2) not null,
  type text check (type in ('Stock', 'Mutual Fund', 'Gold', 'Crypto', 'Cash', 'Other')) default 'Stock',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.portfolio_holdings enable row level security;

-- Policies
drop policy if exists "Users can view their own portfolio" on public.portfolio_holdings;
create policy "Users can view their own portfolio"
  on public.portfolio_holdings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert into their own portfolio" on public.portfolio_holdings;
create policy "Users can insert into their own portfolio"
  on public.portfolio_holdings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own portfolio" on public.portfolio_holdings;
create policy "Users can update their own portfolio"
  on public.portfolio_holdings for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete from their own portfolio" on public.portfolio_holdings;
create policy "Users can delete from their own portfolio"
  on public.portfolio_holdings for delete
  using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_portfolio_user_id on public.portfolio_holdings(user_id);
create index if not exists idx_profiles_user_id on public.profiles(id);
