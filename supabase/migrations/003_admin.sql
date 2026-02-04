-- Admin Dashboard: Disputes and Security Audit Log
-- Run in Supabase SQL Editor

-- Compliance disputes reported by users
create table if not exists compliance_disputes (
  id uuid default gen_random_uuid() primary key,
  model_id text not null,
  description text not null,
  reporter_email text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  suggested_changes jsonb,
  created_at timestamp with time zone default now(),
  resolved_at timestamp with time zone,
  resolved_by uuid
);

-- Security audit log for admin actions
create table if not exists security_log (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid,
  admin_email text,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default now()
);

-- Admin allowlist: add your email(s) to grant admin access
create table if not exists admin_emails (email text primary key);
-- Run after creating your Supabase user: insert into admin_emails (email) values ('your@email.com');

-- RLS for disputes: public can insert, only allowlisted admins can read/update
alter table compliance_disputes enable row level security;
alter table security_log enable row level security;

create policy "Anyone can submit dispute" on compliance_disputes
  for insert with check (true);

create policy "Admins read disputes" on compliance_disputes
  for select using (
    exists (select 1 from admin_emails where email = (auth.jwt() ->> 'email'))
  );

create policy "Admins update disputes" on compliance_disputes
  for update using (
    exists (select 1 from admin_emails where email = (auth.jwt() ->> 'email'))
  );

create policy "Admins insert security log" on security_log
  for insert with check (
    exists (select 1 from admin_emails where email = (auth.jwt() ->> 'email'))
  );

create policy "Admins read security log" on security_log
  for select using (
    exists (select 1 from admin_emails where email = (auth.jwt() ->> 'email'))
  );
