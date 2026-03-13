# CLAUDE.md — Connect Reward

## Project Overview

White-label referral/loyalty SaaS platform. Businesses enroll customers, customers submit referrals, earn points, redeem rewards. Built with Next.js 16 (App Router), Supabase (Postgres + RLS + Auth), Resend (email), Tailwind CSS 4, shadcn/ui.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — Type check (run after changes)

## Architecture

### Route Groups (parentheses = not in URL)

- `app/(public)/` — Landing, login, signup, unsubscribe
- `app/(customer)/dashboard/` — Customer-facing pages
- `app/(admin)/admin/` — Business admin portal
- `app/(super-admin)/super-admin/` — Platform admin
- `app/api/` — API routes (admin/, customer/, cron/)

### Three Supabase Clients

- **`lib/supabase/client.ts`** — Browser client (client components only, RLS enforced)
- **`lib/supabase/server.ts`** — Server client (server components/route handlers, RLS enforced)
- **`lib/supabase/admin.ts`** — Service role client (server-only, bypasses RLS, use for cross-company ops)

### Auth Pattern (every API route)

```typescript
const result = await getAuthContext();
if (result.error) return result.error;
const { profile, admin } = result.ctx;

const forbidden = requireAdmin(profile); // or requireCustomer(profile)
if (forbidden) return forbidden;

const cid = profile.company_id!;
```

Always scope queries by `company_id`. Never leak data across companies.

**IMPORTANT:** The Supabase table for businesses is called `companies`. Always use `.from("companies")` in Supabase queries.

## Key Conventions

### API Routes

- Follow `app/api/admin/rewards/route.ts` as the reference CRUD pattern
- GET: list, POST: create, PUT: update (id in body), DELETE: soft-delete or hard-delete (id in searchParams)
- Return `{ data }` on success, `{ error: "message" }` on failure
- Status codes: 400 validation, 401 unauth, 403 forbidden, 409 conflict, 500 server error
- Use `getAuthContext()` + `requireAdmin()`/`requireCustomer()` from `lib/api-helpers.ts`

### Client Pages

- All pages are `"use client"` with `useCallback` + `useEffect` for data fetching
- Use `useProfile()` and `useCompany()` hooks for current user context
- Show `SampleDataBanner` + sample data for new/empty non-demo accounts
- Loading states: `animate-pulse` skeleton divs
- Toast notifications via `sonner`: `toast.success()`, `toast.error()`
- Modals use shadcn `Dialog` with `DialogContent`, `DialogHeader`, `DialogFooter`

### Types

- All interfaces in `lib/types.ts` — mirrors Supabase schema exactly
- When adding a DB column, update both the migration AND the type interface
- Use strict typing, avoid `any`

### Email System

- **Transactional**: `lib/email/sendEmail.ts` → React Email components in `lib/email/templates/`
- **Automation drafts**: Queued in `email_draft_queue`, processed by crons
- **Template library**: `lib/email/templateLibrary.ts` (automation triggers), `lib/email/promotionTemplates.ts` (promotions)
- All email components extend `BrandingProps` (`companyName`, `logoUrl`, `primaryColor`)
- Register new templates in: `TemplateMap`, `PREF_KEY_MAP`, `renderTemplate` switch in `sendEmail.ts`
- Variable injection: `lib/email/injectVariables.ts` — add fallbacks for new `{{variables}}`

### Migrations

- Sequential numbering: `supabase/migrations/001_...sql` through `012_...sql`
- RLS pattern from migration 006:
  - Business roles: `company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('business', 'business_owner'))`
  - Super admins: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')`
  - Customers: scope by `company_id` + `role = 'customer'`
- Always add `update_updated_at()` trigger for tables with `updated_at`

### Styling

- Tailwind CSS 4 with CSS variables
- Primary color: teal (`#0D9488` / `#14b8a6`)
- Accent color: amber (`#f59e0b`)
- Icons: Lucide React (inline SVGs in admin nav)
- shadcn/ui components in `components/ui/` (new-york style)
- `cn()` utility from `lib/utils.ts` for conditional classes

### Points & Tiers

- Tiers: bronze (0), silver (1000), gold (3000), platinum (7500)
- `lib/points.ts` has the award functions — they insert transactions, update profile, notify, send email
- Promotions multiply referral/review points but NOT milestone bonuses
- Manual adjustments are never affected by promotions

### Crons (Vercel)

- Configured in `vercel.json` with `CRON_SECRET` bearer token auth
- `process-automations` — daily at 6am UTC (engagement emails)
- `send-approved` — hourly (sends queued drafts)
- `process-promotions` — hourly (deactivate expired, queue promo emails)
- All export `GET = POST` for Vercel's GET-based cron invocation

## Roles

| Role | Access |
|------|--------|
| `customer` | Own dashboard, referrals, rewards |
| `business` / `business_owner` | Admin portal for their company |
| `business_manager` / `business_rep` | Limited admin access |
| `super_admin` | Full platform access |

## File Naming

- Pages: `page.tsx` in route directories
- API routes: `route.ts` in API directories
- Shared helpers: `lib/[feature].ts`
- Email templates: `lib/email/templates/[Name]Email.tsx`
- Migrations: `supabase/migrations/[NNN]_[description].sql`

## Don'ts

- Never expose the service role key to the client
- Never query across companies without scoping by `company_id`
- Never skip the `getAuthContext()` check in API routes
- Don't use `any` — define proper types
- Don't add Supabase `generated types` file — types are manually maintained in `lib/types.ts`
