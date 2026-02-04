# Supabase Setup

Run these SQL scripts in your Supabase SQL Editor (in order):

1. **Base schema:** `schema.sql` – creates `model_votes` table
2. **Voting security:** `migrations/002_voting_security.sql` – rate limiting trigger
3. **Admin:** `migrations/003_admin.sql` – disputes, security_log, admin_emails

After running `003_admin.sql`, add your admin email:

```sql
insert into admin_emails (email) values ('your@email.com');
```

Then create a user in Supabase Auth (Authentication > Users > Add user) with that email, or use Sign Up on `/admin/login`.
