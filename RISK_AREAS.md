# Top 5 Fragile / High-Risk Areas

Based on **ARCHITECTURE.md** and the repository code. For each area: why it’s risky, what could affect it, and guardrails for changes.

---

## 1. Auth & route protection (middleware + session)

**Relevant files:** `middleware.ts`, `lib/supabase/middleware.ts`, `app/(public)/login/page.tsx`

### Why it’s risky

- **Public routes are a hardcoded list.** Any new public path (e.g. `/forgot-password`, `/terms`) must be added explicitly. Forgetting it sends users to login or into redirect loops.
- **No role-based route enforcement.** Middleware only checks “is there a user?”. A customer can open `/admin` or `/super-admin`; RLS then limits data, but they still see the admin layout and empty or error states. Access control is effectively “layout + RLS,” not “middleware + RLS.”
- **`DEV_BYPASS_AUTH`** skips auth in development. If this is ever driven by env in production (e.g. mis-set `NODE_ENV` or a custom flag), or left in place by mistake, production would be unprotected.
- **Session refresh is critical.** If `updateSession()` is removed or broken, sessions can go stale and users get logged out or see wrong data.

### What kinds of features could affect it

- New public pages (password reset, legal, marketing).
- New roles or app sections (e.g. “partner” area) that should be restricted by role.
- Stricter auth (e.g. require email verification before dashboard).
- OAuth/magic link: callback URL and redirect logic may need to stay in sync with this flow.

### Guardrails

- **Always** add new public paths to the middleware public-path list when adding public pages.
- **Never** rely on `DEV_BYPASS_AUTH` or any auth bypass in production; consider removing it or gating it so it cannot run in production.
- When adding a new role or section, decide whether middleware should redirect by role (e.g. customer hitting `/admin` → redirect to `/dashboard`) and implement it in one place.
- Do not remove or alter the `updateSession()` call without a clear plan for session refresh; test login, navigation, and refresh across tabs.

---

## 2. Points and redemption flows (no transactions)

**Relevant files:** `lib/points.ts`, `app/(customer)/dashboard/rewards/page.tsx`

### Why it’s risky

- **Multi-step writes with no database transaction.**  
  - **`awardReferralCompletion`:** Reads referral/profile/company, inserts point_transactions (and possibly milestone), updates profile, updates referral, inserts notifications. If any step fails after the first, you can get double-awarded points, profile/referral out of sync, or missing notifications.  
  - **Rewards redemption** (in `rewards/page.tsx`): Inserts into `redemptions`, then `point_transactions`, then updates `profiles.total_points`. A failure between steps leaves inconsistent state (e.g. redemption row but no deduction, or deduction but no redemption row).
- **Tier and settings are duplicated.** `TIER_THRESHOLDS`, `calculateTierFromPoints`, `getTierProgress` live in `lib/points.ts` but are used in multiple UI components. Changing thresholds or formulas in one place without the other causes wrong tier or progress display.
- **Company settings keys are string-based** (`points_per_referral`, `milestone_bonus`, etc.). Renaming in code without a migration or back-compat for existing `companies.settings` JSON can break point calculations.
- **Race conditions.** Two quick “mark complete” clicks, or redemption double-submit, can lead to duplicate inserts or double-award if there’s no idempotency or uniqueness checks.

### What kinds of features could affect it

- New ways to earn or spend points (signup bonus, referral tiers, expiration).
- Changing tier thresholds or adding tiers (e.g. diamond).
- Company-configurable point rules (e.g. different points per service type).
- Redemption flow changes (e.g. approval step, refunds).

### Guardrails

- **Treat points as money.** Any change to earning or spending must preserve consistency. Prefer a single source of truth: e.g. `profiles.total_points` derived from `point_transactions` (with a periodic reconciliation job) or all updates in one transactional unit.
- **Before changing tier logic:** Find all usages of `calculateTierFromPoints`, `getTierProgress`, `getPointsToNextTier`, and `TIER_THRESHOLDS` (code and any config) and update them together; consider exporting tier config from one module so UI doesn’t duplicate formulas.
- **Before changing company settings keys:** Check `lib/points.ts` (`getSettingValue`, `DEFAULT_SETTINGS`) and any UI that reads `company.settings`; support old key names during transition if needed.
- **For new or modified multi-step flows:** Prefer DB-level transactions (e.g. Postgres function or server-side code that runs in a single transaction). If you can’t use a transaction, add idempotency (e.g. unique constraint + “insert if not exists”) or at least document the failure modes and add tests for partial failure.
- **Redemption:** Consider moving the redemption sequence into a server action or API route that runs in one transaction (or a single Supabase RPC), and have the UI call that instead of three separate client-side writes.

---

## 3. Auth + profile lifecycle (trigger + customer creation)

**Relevant files:** `supabase/migrations/001_initial_schema.sql` (`handle_new_user` trigger), `app/api/customers/route.ts`

### Why it’s risky

- **Two-step user creation.** Signup (or admin “create customer”) inserts into `auth.users`; the `handle_new_user` trigger immediately inserts a row into `profiles`. The customers API then *updates* that profile with `company_id`, phone, address, etc. If the trigger fails, the profile row is missing; if the trigger’s column set or types change, the API’s update can fail or overwrite incorrectly.
- **Tight coupling to trigger shape.** The API assumes a profile row exists and only runs an update. Any change to trigger (e.g. new required column, different default role) must be reflected in the API and in any other code that creates users (e.g. signup).
- **Customers created via API have a random password and `email_confirm: true`.** They can’t sign in with a password unless you add a separate “set password” or invite flow. Easy to forget and then wonder why invited users can’t log in.
- **No transaction across auth and profile.** If `admin.auth.admin.createUser` succeeds but the subsequent profile update fails, you have an auth user with an incomplete or wrong profile (e.g. wrong `company_id` or role).

### What kinds of features could affect it

- Invite flow (e.g. email with set-password or magic link).
- New required or optional profile fields (e.g. address, preferences).
- New roles (e.g. “viewer”) or different default role for invited users.
- Changing signup (e.g. OAuth, magic link) so that profile creation or enrichment happens elsewhere.

### Guardrails

- **Never change `handle_new_user` or `profiles` columns** without checking: (1) `app/api/customers/route.ts` (update payload), (2) signup flows, (3) any other code that inserts into `profiles` or assumes its shape.
- **When adding profile fields** used by customer creation: add to the trigger’s insert if they have defaults, and to the API’s update payload when the API supplies them (e.g. address).
- **For invite/set-password:** Implement and test the flow explicitly; don’t assume “create user” is enough for the user to log in.
- **Consider a single transactional unit** for “create user + profile”: e.g. create user, then in the same logical flow (and ideally with retries or compensating logic) update profile; document what to do if profile update fails (e.g. retry, support tooling to fix profile).

---

## 4. RLS and Supabase client boundaries

**Relevant files:** `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, all pages/API routes that use Supabase

### Why it’s risky

- **Using the wrong client has serious effects.**  
  - **Admin client in the browser or in a public API:** Bypasses RLS; anyone could read/update any row.  
  - **Server client in a Client Component:** Can break (no cookies in browser) or leak server-only logic.  
  - **Browser client in Server Components or in API routes:** Wrong auth context (no cookies), so RLS may see no user or wrong user.
- **Admin client is used in multiple places.** Today it’s in `app/api/customers/route.ts`. Any new use (e.g. support tool, migration script, “impersonate” feature) must stay server-only and never be exposed to the client bundle.
- **RLS policies are the real authority.** If a policy is wrong or too permissive, even correct client usage can expose data. Policies are easy to miss when adding tables or columns.

### What kinds of features could affect it

- New API routes or Server Actions that create users or touch data outside the current user’s scope.
- New “admin” or “support” features that need to see or edit all companies/users.
- Realtime or client-side features that need the right auth context (browser client with session).
- New tables or columns: RLS must be defined and tested for each role.

### Guardrails

- **Strict rule:** Use **client** only in Client Components and client-side code; **server** only in Server Components, Route Handlers, and Server Actions; **admin** only in server-side code (Route Handlers, Server Actions, scripts) and never import it in any file that is used in the browser.
- **Before adding or changing admin client usage:** Confirm the call site is server-only (API route, Server Action, or script run in a secure environment).
- **When adding tables or columns:** Add or adjust RLS policies in a migration; test as each role (customer, business, super_admin) so that access matches expectations.
- **Code review:** Check every new Supabase import: `createClient` from `@/lib/supabase/client` vs `server` vs `admin`, and that the file runs only in the intended environment.

---

## 5. Profile and session consistency (useProfile, role vs route)

**Relevant files:** `hooks/useProfile.ts`, layouts that depend on profile, login redirect logic

### Why it’s risky

- **Profile is fetched once on mount.** `useProfile` runs a single fetch in `useEffect` with `[]`. It does not refetch on login/logout, tab focus, or when profile is updated elsewhere (e.g. after redemption, or in another tab). Headers and layout can show stale points, name, or avatar.
- **No role-based route enforcement.** Login redirects by role (business → `/admin`, etc.), but middleware does not prevent a customer from navigating to `/admin`. So UI can show “admin” layout with empty or RLS-filtered data; confusing and a possible information leak (e.g. admin-only copy or structure).
- **Null or failed profile.** If the profile query fails or the trigger didn’t create a row, `profile` is null. Callers that assume `profile` is set can throw or render incorrectly; layouts and pages should handle `loading` and `profile === null` explicitly.
- **Race on login.** User signs in, login page redirects; layout mounts and `useProfile` fetches. If redirect is fast, the new session might not be fully reflected in the first profile fetch, depending on cookie timing.

### What kinds of features could affect it

- Real-time or frequent profile updates (e.g. points after redemption, live notifications).
- New profile fields in the header or layout (e.g. company name, plan).
- Role-based route access (e.g. redirect customers away from `/admin`).
- Multi-tab or multi-device behavior (e.g. “you were signed in elsewhere”).

### Guardrails

- **Always handle `loading` and `profile === null`** in layouts and pages that use `useProfile`; avoid optional chaining on `profile` for critical UI (e.g. show a loading or “complete your profile” state).
- **When profile is updated elsewhere** (e.g. after redemption): Either refetch profile in that flow (e.g. call a refetch or invalidate function), or accept that the header will update on next full load/navigation.
- **Consider centralizing role→route rules.** If you want to restrict routes by role, implement it in one place (e.g. middleware or a layout that redirects when `profile.role` doesn’t match the section) and document the intended behavior.
- **For new profile fields in layout:** Extend the profile query and types together; ensure RLS allows the current user to read those fields.

---

## Summary table

| Area              | Main risk                          | Guardrail in one sentence                                                                 |
|-------------------|-------------------------------------|-------------------------------------------------------------------------------------------|
| Auth & routes     | Public path list; no role checks; bypass | Keep public list in sync; never bypass auth in prod; consider role→route in middleware.   |
| Points & redemption | No transactions; duplicated tier/settings | Treat points as critical; prefer transactions or idempotency; single source for tier logic. |
| Auth + profile    | Trigger + API coupling; no invite flow   | Keep trigger and API payload in sync; add invite/set-password if users must log in.      |
| RLS & clients     | Wrong client = wrong access or breakage  | client/server/admin only in correct env; new tables get RLS; review every Supabase import. |
| Profile consistency | Stale profile; no role→route           | Handle null/loading; refetch or accept staleness; consider role-based route enforcement.  |
