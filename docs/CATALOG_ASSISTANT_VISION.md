# Catalog Assistant: Smart Model Selection & Access Tiers

## Vision

Transform the Catalog Assistant into a powerful, intelligent guide that helps users discover, compare, and **select** AI models—with clear access tiers (guest, registered, premium) and secure, legal workflows for paid models.

---

## Access Tiers

| Tier | Who | What they can do |
|------|-----|------------------|
| **Guest** | Anonymous visitors | Browse full catalog, use assistant to explore, filter, view model details. One "default" model available for try-it. Must sign up to select/use other models. |
| **Registered** | Signed-up users | Full catalog access, select models for use, save preferences, see personalized recommendations. Access to all free + registered-tier models. |
| **Premium** | Paid subscribers | Access to premium models (API credits, hosted inference, etc.). Purchase per-model or subscription. |

---

## Security Principles

1. **Server-side enforcement**: All access checks happen server-side. Client UI can suggest actions, but API validates.
2. **Session-based auth**: Supabase Auth (JWT). No API keys in client for model access.
3. **RLS (Row Level Security)**: Supabase policies enforce `user_model_access` and `user_subscriptions`.
4. **Rate limiting**: Protect signup, login, and model-access endpoints.
5. **Audit trail**: Log access attempts and purchases for compliance.

---

## Legal Considerations

1. **Terms of Service**: Users must accept ToS before account creation.
2. **Privacy Policy**: GDPR/CCPA compliant; clear data usage.
3. **Pricing transparency**: Display pricing before purchase; no dark patterns.
4. **Refund policy**: Clear refund terms for digital goods.
5. **Export controls**: Some models may have export restrictions; surface in UI.

---

## User Flows

### Guest → Select model (requires registered)

1. User asks assistant: "I want to use Llama 3 for coding."
2. Assistant shows Llama 3, offers **Select model**.
3. User clicks Select → Modal: "Sign up to access this model. Free account."
4. Redirect to `/auth/signup?redirect=/models&model=llama-3`.
5. After signup → return to catalog, model now "selected" (saved to user).

### Registered → Select premium model

1. User selects a premium model.
2. Modal: "This model requires a subscription. View pricing."
3. Redirect to `/pricing` or `/upgrade?model=xyz`.
4. After purchase → model added to `user_model_access`.

### Registered → View my models

1. User opens "My models" or assistant shows "Models you have access to."
2. Fetched from `user_model_access` + subscriptions.

---

## Data Model (Supabase)

```sql
-- User model access (which models user can use)
create table user_model_access (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  model_id text not null,
  source text not null check (source in ('free', 'registered', 'purchase', 'subscription')),
  granted_at timestamp with time zone default now(),
  expires_at timestamp with time zone,  -- for subscriptions
  unique(user_id, model_id)
);

-- User subscriptions (for premium tier)
create table user_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  plan_id text not null,
  status text not null check (status in ('active', 'cancelled', 'expired')),
  started_at timestamp with time zone default now(),
  ends_at timestamp with time zone
);
```

---

## Implementation Phases

| Phase | Scope |
|-------|-------|
| **1** | Auth (sign up, sign in for users), AuthContext |
| **2** | Access tier config, Catalog Assistant "Select model" + access checks |
| **3** | Upgrade/purchase flow (redirect to Stripe or placeholder) |
| **4** | "My models" view, personalized assistant |

---

## Default Model (Guest)

One model is always available for guests to "try" without signup—e.g., a small open model like SmolLM or Qwen 0.5B. Configurable in `accessTiers.ts`.
