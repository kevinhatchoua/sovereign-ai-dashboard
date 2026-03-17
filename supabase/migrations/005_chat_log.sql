-- Chat log: every chatbot user message and assistant response (owner-only readable)
-- Insert is done from the API using the service role key (bypasses RLS).
-- Only allowlisted admins (admin_emails) can read.

create table if not exists chat_log (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  session_id text
);

alter table chat_log enable row level security;

-- Only admins (same allowlist as compliance_disputes) can read chat_log
create policy "Admins read chat_log" on chat_log
  for select using (
    exists (select 1 from admin_emails where email = (auth.jwt() ->> 'email'))
  );

-- No insert/update/delete for authenticated users; API uses service role to insert only.
