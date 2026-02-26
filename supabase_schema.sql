-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 0. PROFILES TABLE (User Details & Onboarding)
-- ==========================================
create table public.profiles (
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

-- Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

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
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- 1. TRANSACTIONS TABLE
-- ==========================================
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  date date not null,
  merchant text not null,
  amount numeric(12, 2) not null,
  category text not null,
  type text check (type in ('debit', 'credit')) not null,
  payment_method text check (payment_method in ('UPI', 'Card', 'Cash', 'NetBanking', 'Other')) default 'UPI',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.transactions enable row level security;

-- Policies
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);


-- ==========================================
-- 2. GOALS TABLE (for GoalPlanner.tsx)
-- ==========================================
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  target_amount numeric(12, 2) not null,
  current_amount numeric(12, 2) default 0,
  deadline date not null,
  category text check (category in ('Short Term', 'Long Term', 'Retirement', 'Other')) default 'Short Term',
  color text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.goals enable row level security;

-- Policies
create policy "Users can view their own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own goals"
  on public.goals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own goals"
  on public.goals for delete
  using (auth.uid() = user_id);


-- ==========================================
-- 3. WATCHLIST TABLE (for Watchlist.tsx)
-- ==========================================
create table public.watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  symbol text not null,
  name text,
  created_at timestamptz default now(),
  unique(user_id, symbol)
);

-- Enable RLS
alter table public.watchlist enable row level security;

-- Policies
create policy "Users can view their own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete from their own watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);


-- ==========================================
-- 4. PORTFOLIO HOLDINGS TABLE (for Portfolio.tsx / types.ts)
-- ==========================================
create table public.portfolio_holdings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  symbol text not null,
  name text,
  quantity numeric(12, 4) not null, -- Supports fractional shares/gold
  avg_price numeric(12, 2) not null,
  type text check (type in ('Stock', 'Mutual Fund', 'Gold', 'Crypto', 'Cash', 'Other')) default 'Stock',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.portfolio_holdings enable row level security;

-- Policies
create policy "Users can view their own portfolio"
  on public.portfolio_holdings for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own portfolio"
  on public.portfolio_holdings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own portfolio"
  on public.portfolio_holdings for update
  using (auth.uid() = user_id);

create policy "Users can delete from their own portfolio"
  on public.portfolio_holdings for delete
  using (auth.uid() = user_id);


-- ==========================================
-- 5. CHAT HISTORY (Optional for AICoach.tsx)
-- ==========================================
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  role text check (role in ('user', 'model')) not null,
  text text not null,
  timestamp timestamptz default now()
);

-- Enable RLS
alter table public.chat_messages enable row level security;

-- Policies
create policy "Users can view their chat history"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert into their chat history"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);


-- ==========================================
-- HELPER: Indexes for Performance
-- ==========================================
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_watchlist_user_id on public.watchlist(user_id);
create index if not exists idx_portfolio_user_id on public.portfolio_holdings(user_id);
create index if not exists idx_chat_messages_user_id on public.chat_messages(user_id);
