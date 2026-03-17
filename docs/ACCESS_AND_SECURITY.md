# Access, Data, and Security

This document describes how to access all application data (front-end, back-end, databases) and how admin and chatbot logs are locked down so only you can access them.

---

## 1. Chatbot log (every entry) — only you can read

### Where it lives

- **Database:** Supabase table `chat_log`
- **Contents:** Every user message and assistant response from the AI chatbot (role, content, session_id, created_at)
- **How it’s written:** The `/api/chat` route inserts rows using the **service role key** (server-side). No client can write to this table.

### How only you can access it

1. **Row Level Security (RLS)** on `chat_log` allows **SELECT** only for users whose email is in the `admin_emails` table.
2. Ensure **only your email** is in `admin_emails`:
   - In Supabase Dashboard: **SQL Editor** → run:
     ```sql
     -- If the table is empty, insert your email (run once):
     insert into admin_emails (email) values ('your@email.com');
     -- Do not add any other emails if you want to be the only admin.
     ```
3. **Read chat logs** in either place:
   - **Supabase Dashboard:** Table Editor → select project → open table `chat_log`. You must be signed in to Supabase with the same project; RLS does not apply in the Dashboard when using the project owner’s session, so you see all rows. For production, use the app as below.
   - **From the app (admin):** Log in at `/admin/login` with the same email that is in `admin_emails`. The app can be extended to show a “View chat log” section that runs `supabase.from('chat_log').select('*').order('created_at', { ascending: false })`; RLS will allow it only for your user.

### Env required for logging

- In Vercel (or `.env.local`): set **`SUPABASE_SERVICE_ROLE_KEY`** (from Supabase Project Settings → API → `service_role`). This is used only by the server to insert into `chat_log`; never expose it to the client.

### Run the migration (if not already applied)

In Supabase SQL Editor, run the migration that creates `chat_log` and its RLS policy:

- File: `supabase/migrations/005_chat_log.sql`

---

## 2. Admin dashboard and Supabase backend — only you

### App admin (`/admin`)

- **Restrict to your email:** Set **`NEXT_PUBLIC_ADMIN_EMAIL`** in Vercel (or `.env.local`) to your email. The admin page checks the signed-in user; if the email does not match, it signs the user out and redirects to `/admin/login`.
- **Who can log in:** Anyone with a Supabase Auth account in your project can attempt login. Only the user whose email is in `admin_emails` (and optionally matches `NEXT_PUBLIC_ADMIN_EMAIL`) can use admin features; RLS ensures they only see data they’re allowed to see (disputes, security_log, chat_log).
- **Recommendation:** Create **only one** Supabase Auth user (yours) for this project so that only you can log in at all.

### Supabase Dashboard (database, auth, API)

- **Access:** Only people with access to your Supabase project (e.g. project owner and invited team members) can open the Supabase Dashboard and use the SQL Editor, Table Editor, or Auth.
- **To keep it to “only you”:**
  - Do not invite other members to the project, or restrict invites to trusted operators.
  - Use a strong password and enable **two-factor authentication (2FA)** on your Supabase account (Account → Security).
  - Keep **SUPABASE_SERVICE_ROLE_KEY** and **SUPABASE_ANON_KEY** secret; only add the service role key in server-side env (e.g. Vercel) and never in client-side code.

---

## 3. Front-end, back-end, and databases overview

### Front-end

- **Stack:** Next.js 16 (App Router), React 19, Tailwind CSS.
- **Repo:** Your Git repository (e.g. on GitHub); clone and open in an editor.
- **Run locally:** `npm install` then `npm run dev`. Requires `.env.local` with at least `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_ADMIN_EMAIL`.
- **Deploy:** Typically Vercel; connect the repo and set the same env vars in Vercel (Settings → Environment Variables).

### Back-end

- **API routes (Next.js):** Under `src/app/api/`:
  - **`/api/chat`** — POST: chatbot; calls Groq LLM; optionally logs to Supabase `chat_log` using the service role key.
  - Other routes: `/api/feed/models`, `/api/models`, `/api/news`, `/api/community-showcase`, `/api/stats`, `/api/export`, `/api/webhook/submit`, etc.
- **Auth callback:** `src/app/auth/callback/route.ts` — exchanges Supabase auth code for session.
- **Env (server):** `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (and any other server-only keys) must be set in the host (e.g. Vercel) and are not exposed to the client.

### Databases and external services

- **Supabase (Postgres):**
  - **URL/keys:** Supabase project URL and anon key (and service role key for server) from Project Settings → API.
  - **Tables (examples):** `model_votes`, `compliance_disputes`, `security_log`, `admin_emails`, `chat_log`. RLS policies restrict who can read/write what; `chat_log` and admin-related tables are readable only by users listed in `admin_emails`.
- **Groq (LLM):**
  - Used by `/api/chat` for the Sovereign AI Assistant.
  - **Key:** `GROQ_API_KEY` from [Groq Console](https://console.groq.com); stored only in server env.

---

## 4. Checklist: lock things down

- [ ] Only your email in `admin_emails` in Supabase.
- [ ] `NEXT_PUBLIC_ADMIN_EMAIL` set to your email (optional but recommended).
- [ ] Only one Supabase Auth user (yours) for this project, or strictly control who has accounts.
- [ ] Supabase account: strong password + 2FA.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in server env (e.g. Vercel), never in client code or public repo.
- [ ] Migration `005_chat_log.sql` applied so `chat_log` exists and RLS is enabled.

---

## 5. How to read chat log data (for you)

After RLS is set up and only your email is in `admin_emails`:

1. **Supabase Dashboard:** Log in → your project → Table Editor → `chat_log`. You can sort by `created_at` and export if needed.
2. **From code (e.g. admin page):** While signed in as the same email, call:
   ```ts
   const { data } = await supabase.from("chat_log").select("*").order("created_at", { ascending: false });
   ```
   RLS will return rows only for your user. You can add a “Chat log” section on the admin page that uses this.

No other users (no other Supabase Auth accounts, no anon key) can read `chat_log`; only the service role can write, and only allowlisted admins can read.

---

## 6. Chatbot capabilities (current and future)

- **Text-to-speech (TTS):** Implemented. Each assistant message has a “Read aloud” button that uses the browser’s Speech Synthesis API (client-side only; no data sent to a third party).
- **Bold formatting:** Assistant messages use `**bold**` in the model output but are rendered as real `<strong>` in the UI so screen readers do not hear asterisks.
- **Image-to-text / image generation:** Not implemented in-app. The system prompt instructs the assistant to suggest public tools (e.g. Hugging Face, official docs) when users ask for image description or generation. To add these later, use public APIs (e.g. Groq vision, Replicate) with strict content policy and no storage of user images beyond the request.
