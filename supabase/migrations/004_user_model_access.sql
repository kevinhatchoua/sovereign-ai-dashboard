-- User model access: which models a user can select/use
-- Run in Supabase SQL Editor

create table if not exists user_model_access (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  model_id text not null,
  source text not null check (source in ('free', 'registered', 'purchase', 'subscription')),
  granted_at timestamp with time zone default now(),
  expires_at timestamp with time zone,
  unique(user_id, model_id)
);

-- RLS: users can only read/insert their own access
alter table user_model_access enable row level security;

create policy "Users read own access" on user_model_access
  for select using (auth.uid() = user_id);

create policy "Users insert own access" on user_model_access
  for insert with check (auth.uid() = user_id);

-- Service role or admin can manage all (for purchases, subscriptions)
-- Add admin policy if needed
