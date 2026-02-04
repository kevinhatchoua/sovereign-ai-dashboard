-- Sovereign AI Dashboard: Community Votes Schema
-- Run this in your Supabase SQL Editor (database.new)

-- Create a table for community votes
create table if not exists model_votes (
  id uuid default gen_random_uuid() primary key,
  model_id text not null,
  user_identifier text not null,
  vote_type int check (vote_type in (1, -1)),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(model_id, user_identifier)
);

-- Enable Row Level Security
alter table model_votes enable row level security;

-- Allow anyone to read votes
create policy "Votes are public" on model_votes for select using (true);

-- Allow anyone to insert a vote (anonymous dashboard)
create policy "Anyone can vote" on model_votes for insert with check (true);

-- Allow update for vote changes (e.g. up -> down)
create policy "Anyone can update vote" on model_votes for update with check (true);

-- Optional: Update updated_at on change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger model_votes_updated_at
  before update on model_votes
  for each row execute function update_updated_at();
