# Connect Reward — Founder-Friendly Architecture Map

A quick reference for how the codebase is organized and where to look when you need to change something.

---

## 1. App Routes by User Type

### Public (no login required)
| Path | File | What it does |
|------|------|---------------|
| `/` | `app/(public)/page.tsx` | Landing page |
| `/login` | `app/(public)/login/page.tsx` | Sign in (email/password) |
| `/signup` | `app/(public)/signup/page.tsx` | Create account |
| `/early-access` | `app/(public)/early-access/page.tsx` | Early access application form |

### Customer (end users in a company’s program)
All under `/dashboard/` with sidebar (Dashboard, Submit Referral, My Referrals, Rewards, etc.)

| Path | File | What it does |
|------|------|---------------|
| `/dashboard` | `app/(customer)/dashboard/page.tsx` | Customer home: points, tier, recent activity |
| `/dashboard/refer` | `app/(customer)/dashboard/refer/page.tsx` | Submit a new referral |
| `/dashboard/referrals` | `app/(customer)/dashboard/referrals/page.tsx` | List and status of my referrals |
| `/dashboard/rewards` | `app/(customer)/dashboard/rewards/page.tsx` | Browse and redeem rewards |
| `/dashboard/reviews` | `app/(customer)/dashboard/reviews/page.tsx` | Leave a review (earn points) |
| `/dashboard/achievements` | `app/(customer)/dashboard/achievements/page.tsx` | Achievements and badges |
| `/dashboard/leaderboard` | `app/(customer)/dashboard/leaderboard/page.tsx` | Leaderboard |
| `/dashboard/points` | `app/(customer)/dashboard/points/page.tsx` | Points history |
| `/dashboard/notifications` | `app/(customer)/dashboard/notifications/page.tsx` | Notifications |
| `/dashboard/profile` | `app/(customer)/dashboard/profile/page.tsx` | Profile and avatar |

### Admin (contractors / company owners)
All under `/admin/` with sidebar (Dashboard, Referrals, Customers, etc.)

| Path | File | What it does |
|------|------|---------------|
| `/admin` | `app/(admin)/admin/page.tsx` | Admin dashboard: counts, referrals, points |
| `/admin/referrals` | `app/(admin)/admin/referrals/page.tsx` | All referrals; mark complete, update status |
| `/admin/customers` | `app/(admin)/admin/customers/page.tsx` | Customer list (uses API to create customers) |
| `/admin/rewards` | `app/(admin)/admin/rewards/page.tsx` | Manage reward catalog |
| `/admin/reports` | `app/(admin)/admin/reports/page.tsx` | Reports and metrics |
| `/admin/team` | `app/(admin)/admin/team/page.tsx` | Team members (profiles in company) |
| `/admin/settings` | `app/(admin)/admin/settings/page.tsx` | Company settings, logo, services |
| `/admin/billing` | `app/(admin)/admin/billing/page.tsx` | Billing (placeholder) |

### Super Admin (platform operator)
All under `/super-admin/`.

| Path | File | What it does |
|------|------|---------------|
| `/super-admin` | `app/(super-admin)/super-admin/page.tsx` | Platform overview: applications, companies, users |
| `/super-admin/users` | `app/(super-admin)/super-admin/users/page.tsx` | All users/profiles |
| `/super-admin/companies` | `app/(super-admin)/super-admin/companies/page.tsx` | All companies; set plan |
| `/super-admin/applications` | `app/(super-admin)/super-admin/applications/page.tsx` | Early access applications; status, notes |

### API routes
| Path | File | What it does |
|------|------|---------------|
| `POST /api/customers` | `app/api/customers/route.ts` | Admin creates a customer (invite/signup flow) |
| `POST /api/early-access` | `app/api/early-access/route.ts` | Submit early access form (public) |
| `POST /api/early-access/approve` | `app/api/early-access/approve/route.ts` | (If used) Approve application |
| `GET /api/auth/callback` | `app/api/auth/callback/route.ts` | OAuth callback; exchange code for session |

---

## 2. Key Supabase Files (What Each Does)

| File | Purpose |
|------|--------|
| **`lib/supabase/client.ts`** | **Browser client.** Use in Client Components and client-side code. Uses anon key; all access goes through RLS. One-liner: `createBrowserClient(url, anonKey)`. |
| **`lib/supabase/server.ts`** | **Server client.** Use in Server Components, Route Handlers, Server Actions. Reads/writes cookies so the same user session is used on the server. Uses anon key + RLS. |
| **`lib/supabase/admin.ts`** | **Admin client (service role).** Use only on the server when you must bypass RLS (e.g. creating users, cross-company operations). Never use in client code or expose to the browser. |
| **`lib/supabase/middleware.ts`** | **Session refresh.** Creates a Supabase server client from request cookies, calls `getUser()` to refresh the session, and returns the response with updated cookies. Called on every request by the main middleware. |

**Flow in short:**  
Middleware refreshes the session → Pages and API routes use **client** (browser) or **server** (server) for normal DB work → Use **admin** only when you intentionally need to bypass RLS.

---

## 3. Main Business Logic Files

| File | What it does |
|------|---------------|
| **`lib/points.ts`** | **Core points and referral logic.** `awardReferralCompletion()` (points when referral marked complete), `manualPointAdjustment()`, `awardReviewPoints()` (points for reviews). All take a `SupabaseClient`. Customer redemptions are handled inline in `app/(customer)/dashboard/rewards/page.tsx`. |
| **`lib/plan-limits.ts`** | Plan limits (e.g. free vs paid). Used to enforce caps (e.g. max customers) before creating resources. |
| **`lib/validation.ts`** | Shared validation: sanitize text, validate email/phone/zip, etc. Used in forms and API routes. |
| **`lib/types.ts`** | TypeScript types that mirror the DB: `Profile`, `Company`, `Referral`, `Reward`, enums like `UserRole`, `ReferralStatus`, `LoyaltyTier`, etc. |
| **`lib/email/send.ts`** | Email sending (e.g. early access confirmations, admin notifications). |
| **`lib/rate-limit.ts`** | Simple rate limiting (e.g. early-access form submissions). |
| **`lib/relative-time.ts`** | “2 hours ago”–style formatting. |

**Hooks (used by layouts and pages):**
| File | What it does |
|------|---------------|
| **`hooks/useProfile.ts`** | Fetches current user’s profile from Supabase; used by admin/customer layouts for header (name, avatar). |
| **`hooks/useCompany.ts`** | Fetches current user’s company; used where company context is needed. |

---

## 4. Database Tables by Feature

**Auth & identity**
- **`auth.users`** — Supabase built-in; one row per login.
- **`profiles`** — One per user: name, email, role, `company_id`, `total_points`, `loyalty_tier`, address, notification prefs. Created by trigger on `auth.users` insert.

**Company & product**
- **`companies`** — Company record: name, slug, logo_url, plan, settings (JSON).
- **`services`** — Services offered by a company (e.g. “Solar install”), each with a points value. Used when submitting referrals.

**Referrals**
- **`referrals`** — One row per referral: referrer (profile), referee info, status (pending → won/lost), service, points_awarded. When status becomes “won,” points are awarded via `lib/points.ts`.

**Rewards & redemptions**
- **`rewards`** — Catalog of rewards per company: name, type, points_cost, min_tier.
- **`redemptions`** — A customer redeeming a reward; links to reward, profile, company, status.

**Points & gamification**
- **`point_transactions`** — Every change to points: earned, redeemed, expired, adjusted. Links to referral or redemption when applicable.
- **`achievements`** — Achievement definitions per company (or global).
- **`user_achievements`** — Which achievements a user has earned.

**Engagement**
- **`reviews`** — Customer reviews; can trigger bonus points via `lib/points.ts`.
- **`notifications`** — In-app notifications (referral updates, points earned, etc.).

**Growth / early access**
- **`early_access_applications`** — Submissions from the public early-access form; super admins manage in `/super-admin/applications`.

**Storage (Supabase Storage)**
- **`logos`** — Company logos (admin settings).
- **`avatars`** — User avatars (profile page).

Schema and RLS are defined in **`supabase/migrations/`**:  
`001_initial_schema.sql` (core tables + RLS), `002_early_access.sql`, `003_feature_updates.sql` (services, profile fields), `004_storage_and_fixes.sql` (logos bucket + policies).

---

## 5. Most Important Files to Understand First

Read in roughly this order so the rest of the app makes sense.

1. **`middleware.ts`** (root)  
   How routes are protected and how the Supabase session is refreshed on every request.

2. **`lib/supabase/client.ts`** and **`lib/supabase/server.ts`**  
   When to use which client (browser vs server) and that both use the same session via cookies.

3. **`lib/supabase/middleware.ts`**  
   How that session refresh is implemented (get cookies → create client → `getUser()` → set cookies on response).

4. **`lib/types.ts`**  
   Domain model in one place: roles, statuses, and main entity shapes.

5. **`supabase/migrations/001_initial_schema.sql`**  
   Core tables, triggers (e.g. profile creation on signup), and RLS policies (who can see what).

6. **`lib/points.ts`**  
   How points are awarded (referral completion, reviews) and how redemptions and transactions are created.

7. **`app/(public)/login/page.tsx`**  
   Simple example: browser client, `signInWithPassword`, then load profile and redirect by role.

8. **`app/(customer)/dashboard/page.tsx`** or **`app/(admin)/admin/page.tsx`**  
   How a typical dashboard loads data (profile, company, referrals, points) from Supabase.

9. **`app/api/customers/route.ts`**  
   Example of server + admin clients: validate caller with server client (RLS), then use admin client to create user/profile if needed.

10. **`app/(admin)/admin/settings/page.tsx`**  
    Company settings, services CRUD, and logo upload (Supabase Storage); good example of mixed client usage.

After these, you can jump into any route or feature using this map.

---

## 6. Top 10 Files for Future Development

For each file: what it controls, what to avoid breaking, and what kinds of features will likely require changes there.

---

### 1. `middleware.ts` (root)

**What it controls**
- Which routes are public vs protected (login, signup, early-access, API auth/early-access are public; everything else requires auth).
- Session refresh on every request (via `lib/supabase/middleware.ts`).
- Redirect to `/login` with `?redirect=` when unauthenticated.
- **`DEV_BYPASS_AUTH`**: in development, auth can be skipped so you can hit any page without logging in.

**What to be careful not to break**
- Adding a new public route but forgetting to add it to the public-path list will lock users out or cause redirect loops.
- Removing or changing the `updateSession()` call can break session refresh and log users out unexpectedly.
- Turning off `DEV_BYPASS_AUTH` in dev or leaving it on in production will confuse debugging or weaken security.

**Features that will likely require changes**
- New public pages (e.g. password reset, legal pages): add path to the public list.
- New role or app section (e.g. “partner” area): extend the matcher or add role-based redirects here or right after.
- Stricter or different auth (e.g. email verification required): add checks after `updateSession()` and redirect accordingly.

---

### 2. `lib/supabase/server.ts`

**What it controls**
- Creating the Supabase client used in Server Components, Route Handlers, and Server Actions.
- Reading and writing auth cookies via Next.js `cookies()` so the server sees the same session as the browser.

**What to be careful not to break**
- Must be called in a server context (not in a Client Component). Using it in the browser will fail or leak server logic.
- Cookie handling is tied to Next.js `cookies()`; changing to a different cookie API or store can break session consistency.

**Features that will likely require changes**
- Any new API route or Server Action that needs the current user: use this client so RLS and auth work correctly.
- Switching to a different auth strategy (e.g. API keys for server-to-server): you may add an alternative client or branch here (or in a new file) while keeping this for cookie-based auth.

---

### 3. `lib/supabase/client.ts`

**What it controls**
- The Supabase client used in Client Components and any client-side code (auth, realtime, storage, DB queries with RLS).

**What to be careful not to break**
- Must only be used in client context. Using it in Server Components or during SSR can cause hydration or env issues (e.g. `NEXT_PUBLIC_*` only).
- Every client-side Supabase call (auth, DB, storage) goes through this; if the factory changes (e.g. different options), all those calls are affected.

**Features that will likely require changes**
- New client-side features (realtime subscriptions, client-side mutations, file uploads): use this client.
- Custom auth (e.g. magic link, OAuth): still use this client; Supabase Auth handles the flow, and this file stays the single place that creates the browser client.

---

### 4. `lib/supabase/admin.ts`

**What it controls**
- Server-only Supabase client with the **service_role** key. Bypasses RLS. Used when the app must act as “the system” (e.g. create users, update any row).

**What to be careful not to break**
- Never import or use this in Client Components or expose it to the browser. Anyone with the service role key can read/write everything.
- Use only when you intentionally need to bypass RLS (e.g. creating auth users, fixing data, admin-only operations). Prefer the server client for normal user-scoped operations.

**Features that will likely require changes**
- Any flow that creates users or touches data outside the current user’s RLS (e.g. invite-by-email, migrations, support tools): use the admin client from a Route Handler or server action only.
- New “super admin” or internal tools that need to see or edit all companies/users: call admin client from server-side code only.

---

### 5. `lib/points.ts`

**What it controls**
- **Tier constants and helpers:** `TIER_THRESHOLDS`, `calculateTierFromPoints`, `getPointsToNextTier`, `getTierProgress`, `TIER_COLORS`, `DEFAULT_SETTINGS` (points_per_referral, milestone_bonus, review_points, etc.).
- **`awardReferralCompletion(referralId, supabase)`:** When a referral is marked complete: base points (from company settings or service), optional milestone bonus, updates profile `total_points` and `loyalty_tier`, creates point_transactions and notifications.
- **`manualPointAdjustment(userId, companyId, amount, reason, supabase)`:** Admin-style adjustment; inserts transaction, updates profile points/tier, notifies user.
- **`awardReviewPoints(reviewId, supabase)`:** Awards review points from company settings, updates profile and creates notification.

**What to be careful not to break**
- Referral completion is a multi-step sequence (read referral + profile + company + optional service → insert transactions → update profile → update referral → notifications). Reordering or skipping steps can double-award points or leave profile/referral out of sync.
- Tier math is duplicated in UI (e.g. progress bars). Changing thresholds or formulas here without updating the UI will show wrong tier or progress.
- `DEFAULT_SETTINGS` keys (e.g. `points_per_referral`, `milestone_bonus`) must match what company `settings` JSON and the code expect; renaming only here will break reads.

**Features that will likely require changes**
- New ways to earn points (e.g. signup bonus, referral bonus tiers, seasonal multipliers): new functions or branches here, plus new or updated `point_transactions` and notifications.
- Changing tier thresholds or adding tiers: update `TIER_THRESHOLDS`, `calculateTierFromPoints`, `getPointsToNextTier`, `getTierProgress`, and any UI that shows tier.
- Company-configurable point rules (e.g. different points per service): extend `getSettingValue` / company settings and use them in `awardReferralCompletion` and similar.

---

### 6. `lib/plan-limits.ts`

**What it controls**
- **`PLAN_LIMITS`:** Per-plan caps and flags: `maxReferrals`, `maxRewards`, `maxCustomers`, and feature flags (`customBranding`, `analytics`, `apiAccess`, `prioritySupport`).
- **`isAtLimit(plan, resource, currentCount)`:** Used to block creating new customers/referrals/rewards when at plan limit.

**What to be careful not to break**
- The only place that enforces plan limits today is `app/api/customers/route.ts` (customer limit). If you add new resources or gates, you must call `isAtLimit` (or equivalent) in the right place; otherwise limits are only in this file and not enforced.
- Changing limits or adding new plan tiers: update both this file and any UI that displays plan features (e.g. upgrade prompts, settings).

**Features that will likely require changes**
- New plan tiers or new limits (e.g. max team members, max redemptions per month): extend `PlanLimits` and `PLAN_LIMITS`, then add checks where those resources are created or used.
- Feature gating (e.g. “analytics” or “API access” only on certain plans): use the boolean flags here and check them in the relevant routes or components.

---

### 7. `supabase/migrations/001_initial_schema.sql`

**What it controls**
- Core enums: `user_role`, `referral_status`, `reward_type`, `redemption_status`, `notification_type`, `plan_tier`, `loyalty_tier`, `point_tx_type`.
- Core tables: `companies`, `profiles`, `referrals`, `rewards`, `redemptions`, `point_transactions`, `reviews`, `notifications`, `achievements`, `user_achievements`.
- Trigger: `handle_new_user()` — creates a row in `profiles` on `auth.users` insert (signup).
- Trigger: `update_updated_at()` on several tables.
- **All RLS policies** that define who can select/insert/update/delete on each table (contractors vs customers vs super_admin).

**What to be careful not to break**
- Changing or dropping RLS policies can expose or hide data incorrectly (e.g. customers seeing other companies’ data, or contractors unable to manage their company).
- Changing the `handle_new_user()` trigger or `profiles` shape can break signup or leave new users without a profile.
- Enum or column renames require coordinated changes in app code and possibly later migrations.

**Features that will likely require changes**
- New tables or columns: add migrations (new files) rather than editing 001; keep 001 as the historical baseline.
- New roles or permissions: new or updated RLS policies, possibly new enum values.
- Changing signup flow (e.g. required profile fields): update trigger and/or app code that reads profile after signup.

---

### 8. `app/api/customers/route.ts`

**What it controls**
- **POST /api/customers:** Allows an authenticated contractor/super_admin to create a new “customer” (auth user + profile with `company_id`, role `customer`, and contact/address fields).
- Validates input (name, email, phone, zip), checks plan customer limit, creates user via **admin** client, then updates the auto-created profile with company and extra fields.

**What to be careful not to break**
- The flow depends on `handle_new_user()` creating a profile row first; the route then updates that row. If the trigger or profile schema changes, this update can fail or leave incomplete data.
- Creating the auth user with a random password and `email_confirm: true` means the user has no password they know; any “set password” or invite flow must be implemented elsewhere (e.g. magic link, separate invite API).

**Features that will likely require changes**
- Invite flow (e.g. send email with set-password link): add email sending and possibly different auth options here or in a sibling route.
- Extra required profile fields (e.g. address): add validation and update the `admin.from("profiles").update(...)` payload.
- Different limits or roles (e.g. “viewer”): integrate with `lib/plan-limits.ts` and possibly extend the role check (e.g. allow more roles to create customers).

---

### 9. `app/(public)/login/page.tsx`

**What it controls**
- Login form (email/password), call to `supabase.auth.signInWithPassword`, then fetch profile and **role-based redirect**: contractor → `/admin`, super_admin → `/super-admin`, everyone else (e.g. customer) → `redirect` param or `/dashboard`.

**What to be careful not to break**
- Redirect logic must stay in sync with route groups: new roles or dashboards need a corresponding branch here, or users land on the wrong area.
- Default redirect is `/dashboard`; if you rename or remove that route, update the default and the `redirect` query handling.

**Features that will likely require changes**
- New role or app section (e.g. “partner” dashboard): add a branch after loading profile and redirect to the correct base path.
- OAuth or magic link: Supabase handles the flow; this page may stay for password sign-in only, with OAuth callback handled in `app/api/auth/callback/route.ts` and similar redirect logic applied there.
- Post-login requirements (e.g. “complete profile” or “accept terms”): redirect to an onboarding page first and then to the final destination.

---

### 10. `hooks/useProfile.ts`

**What it controls**
- Client-side fetch of the current user’s **profile** from Supabase (after reading `auth.getUser()`). Used by admin and customer layouts for header (name, avatar, points) and by pages that need the current profile (e.g. rewards, refer).

**What to be careful not to break**
- Runs once on mount (`useEffect` with `[]`). It does not re-run on login/logout or when the profile is updated elsewhere; layouts/pages that depend on fresh data may need to refetch or use a different pattern (e.g. React Query, or invalidate on auth state change).
- If the profile query fails or the user has no profile row (e.g. trigger failed), `profile` is null; callers must handle that to avoid runtime errors.

**Features that will likely require changes**
- Showing new profile fields in the header or across the app: extend the `select("*")` or the `Profile` type and use the new fields in layouts.
- Real-time profile updates (e.g. points change after redemption): consider subscribing to auth or profile changes, or refetching after specific actions, rather than relying only on the initial mount fetch.
- Role-based UI that depends on profile: ensure `profile` (and possibly `profile.role`) is loaded before rendering sensitive UI; otherwise show a loading or fallback state.
