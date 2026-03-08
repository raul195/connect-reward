# Feature Implementation Template

Use this template for every new feature. Follow **FEATURE_WORKFLOW.md**: plan first, then implement. Keep changes minimal, preserve existing behavior, and call out security concerns.

---

## 1. Feature description

**Name:** _[e.g. “Password reset flow”]_

**Summary:**  
_[One or two sentences: what the feature does and for whom.]_

**User type(s):**  
- [ ] Public  
- [ ] Customer (`/dashboard`)  
- [ ] Admin / Business (`/admin`)  
- [ ] Super Admin (`/super-admin`)  

**Acceptance criteria:**  
- [ ] _Criterion 1_  
- [ ] _Criterion 2_  
- [ ] _…_

---

## 2. Files likely to change

List every file you expect to touch. Use ARCHITECTURE.md for route and module locations.

| Area | File(s) | Change |
|------|---------|--------|
| **Routes / pages** | _e.g. `app/(public)/forgot-password/page.tsx`_ | _e.g. New page_ |
| **API** | _e.g. `app/api/auth/reset-password/route.ts`_ | _e.g. New route_ |
| **Lib / logic** | _e.g. `lib/validation.ts`_ | _e.g. New helper_ |
| **Types** | _e.g. `lib/types.ts`_ | _e.g. New type_ |
| **Hooks** | _e.g. `hooks/useProfile.ts`_ | _e.g. Optional refetch_ |
| **Middleware** | _e.g. `middleware.ts`_ | _e.g. Add public path_ |
| **Other** | _…_ | _…_ |

**New files to add:**  
- _e.g. `app/(public)/forgot-password/page.tsx`_  
- _…_

---

## 3. Database changes or migrations

- [ ] **No database changes**
- [ ] **New migration(s)** — add below.

**New tables:**  
_Table name, purpose, and key columns._

**New columns:**  
_Table → column(s), type, constraints._

**New enums (if any):**  
_Enum name and values._

**Migration file(s):**  
_e.g. `supabase/migrations/005_password_reset_tokens.sql`_

**Seed or backfill:**  
_[ ] Not needed  [ ] Needed — describe._

---

## 4. Supabase / RLS considerations

**Supabase client usage:**

| Where | Client | Why |
|-------|--------|-----|
| _e.g. New API route_ | `lib/supabase/server.ts` | _e.g. Need current user session_ |
| _e.g. New page_ | `lib/supabase/client.ts` | _e.g. Client Component reads data_ |
| _e.g. Create user in API_ | `lib/supabase/admin.ts` | _e.g. Must bypass RLS to create user_ |

- [ ] **No RLS changes**
- [ ] **New or updated RLS policies** — describe.

**Policies:**

| Table | Policy intent | Who can do what |
|-------|----------------|------------------|
| _e.g. `password_reset_tokens`_ | _e.g. User can read/insert own row_ | _e.g. `auth.uid() = user_id`_ |

**Auth / session:**  
- [ ] Feature is public (no login).  
- [ ] Feature requires logged-in user; existing session is enough.  
- [ ] Feature requires specific role(s): _e.g. business or super_admin._  
- [ ] Other: _describe._

**Security notes:**  
_Any concern (e.g. rate limit, token expiry, no PII in logs)._

---

## 5. API changes

- [ ] **No API changes**
- [ ] **New route(s)** — list below.
- [ ] **Changes to existing route(s)** — list below.

**New route(s):**

| Method + path | Purpose | Auth |
|---------------|---------|------|
| _e.g. `POST /api/auth/forgot-password`_ | _e.g. Request reset email_ | _e.g. Public, rate-limited_ |

**Modified route(s):**

| Method + path | Change |
|---------------|--------|
| _e.g. `POST /api/customers`_ | _e.g. Optional new field in body_ |

**Request/response shape (if new or changed):**  
_Brief description or example._

---

## 6. UI components involved

**New pages:**  
- _e.g. `app/(public)/forgot-password/page.tsx`_  
- _…_

**Modified pages:**  
- _e.g. `app/(public)/login/page.tsx` — add “Forgot password?” link_  
- _…_

**New components:**  
- _e.g. `components/auth/ForgotPasswordForm.tsx`_  
- _…_

**Existing components reused:**  
- _e.g. `Button`, `Input`, `Card` from `@/components/ui`_  
- _…_

**Layout / navigation:**  
- [ ] New item in sidebar or nav? _Where?_  
- [ ] New public route? _If yes, add path in `middleware.ts` public list._  
- [ ] No nav changes.

---

## 7. Potential risks

Use RISK_AREAS.md and ARCHITECTURE.md §6. Flag anything that touches auth, points, RLS, or multi-step flows.

| Risk | Mitigation |
|------|------------|
| _e.g. New public route forgotten in middleware_ | _Add path to public list in `middleware.ts` and test unauthenticated access_ |
| _e.g. Points flow without transaction_ | _e.g. Use single RPC or document partial-failure behavior_ |
| _e.g. Exposing admin client to client bundle_ | _Keep admin usage only in API route / server action_ |
| _…_ | _…_ |

**Fragile areas touched:**  
- [ ] Auth & route protection (middleware, login)  
- [ ] Points / redemption flows  
- [ ] Auth + profile lifecycle (trigger, customers API)  
- [ ] RLS / Supabase client boundaries  
- [ ] Profile / session consistency (useProfile, role vs route)  
- [ ] None of the above

---

## 8. Implementation steps

Order work so that types, migrations, and RLS are in place before UI and API that depend on them. Only then write code (per FEATURE_WORKFLOW.md).

1. **Types & schema**  
   - [ ] Add or update types in `lib/types.ts` (if needed).  
   - [ ] Write migration(s); run locally; verify RLS.

2. **Backend / API**  
   - [ ] Add or update API route(s).  
   - [ ] Use correct Supabase client (server vs admin).  
   - [ ] Add validation (e.g. `lib/validation.ts`).  
   - [ ] Add rate limiting or other safeguards if needed.

3. **Business logic**  
   - [ ] Add or update logic in `lib/` (e.g. points, email).  
   - [ ] Keep multi-step flows transactional or idempotent where possible.

4. **Auth & routes**  
   - [ ] If new public route: add to public list in `middleware.ts`.  
   - [ ] If new role or section: consider redirect in middleware or login.

5. **UI**  
   - [ ] Add or update page(s) and components.  
   - [ ] Use `lib/supabase/client.ts` in Client Components only.  
   - [ ] Handle loading and error states; respect `profile === null` where applicable.

6. **Integration & test**  
   - [ ] Test as each user type (public, customer, business, super_admin) if relevant.  
   - [ ] Test unauthenticated access for public routes.  
   - [ ] Verify RLS (e.g. customer cannot see other companies’ data).  
   - [ ] Confirm no regressions (existing flows still work).

---

**Implementation plan approved:** _[ ] Yes — proceed.  [ ] Revise plan first.**

**Notes:**  
_Any follow-ups, open questions, or links to tickets._
