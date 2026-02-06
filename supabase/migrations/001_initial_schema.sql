-- Connect Reward — Initial Schema
-- Run this in the Supabase SQL editor or via the CLI

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('customer', 'contractor', 'super_admin');
create type referral_status as enum ('pending', 'contacted', 'quoted', 'won', 'lost', 'expired');
create type reward_type as enum ('discount', 'cashback', 'gift_card', 'service_credit', 'custom');
create type redemption_status as enum ('pending', 'approved', 'fulfilled', 'rejected');
create type notification_type as enum ('referral_update', 'reward_earned', 'achievement', 'system');
create type plan_tier as enum ('free', 'starter', 'growth', 'pro');
create type loyalty_tier as enum ('bronze', 'silver', 'gold', 'platinum');
create type point_tx_type as enum ('earned', 'redeemed', 'expired', 'adjusted');

-- ============================================================
-- 1. COMPANIES
-- ============================================================
create table companies (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique not null,
  logo_url     text,
  plan         plan_tier not null default 'free',
  settings     jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_companies_slug on companies (slug);

-- ============================================================
-- 2. PROFILES
-- ============================================================
create table profiles (
  id             uuid primary key references auth.users on delete cascade,
  company_id     uuid references companies on delete set null,
  role           user_role not null default 'customer',
  full_name      text not null,
  email          text not null,
  phone          text,
  avatar_url     text,
  loyalty_tier   loyalty_tier not null default 'bronze',
  total_points   integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_profiles_company on profiles (company_id);
create index idx_profiles_role on profiles (role);
create index idx_profiles_email on profiles (email);

-- ============================================================
-- 3. REFERRALS
-- ============================================================
create table referrals (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies on delete cascade,
  referrer_id     uuid not null references profiles on delete cascade,
  referee_name    text not null,
  referee_email   text,
  referee_phone   text,
  service_type    text,
  status          referral_status not null default 'pending',
  notes           text,
  job_value       numeric(10,2),
  points_awarded  integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_referrals_company on referrals (company_id);
create index idx_referrals_referrer on referrals (referrer_id);
create index idx_referrals_status on referrals (status);

-- ============================================================
-- 4. REWARDS
-- ============================================================
create table rewards (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references companies on delete cascade,
  name           text not null,
  description    text,
  type           reward_type not null default 'discount',
  points_cost    integer not null,
  min_tier       loyalty_tier not null default 'bronze',
  image_url      text,
  active         boolean not null default true,
  quantity_left  integer,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_rewards_company on rewards (company_id);

-- ============================================================
-- 5. REDEMPTIONS
-- ============================================================
create table redemptions (
  id          uuid primary key default gen_random_uuid(),
  reward_id   uuid not null references rewards on delete cascade,
  profile_id  uuid not null references profiles on delete cascade,
  company_id  uuid not null references companies on delete cascade,
  status      redemption_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_redemptions_profile on redemptions (profile_id);
create index idx_redemptions_company on redemptions (company_id);

-- ============================================================
-- 6. POINT TRANSACTIONS
-- ============================================================
create table point_transactions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles on delete cascade,
  company_id    uuid not null references companies on delete cascade,
  type          point_tx_type not null,
  amount        integer not null,
  description   text,
  referral_id   uuid references referrals on delete set null,
  redemption_id uuid references redemptions on delete set null,
  created_at    timestamptz not null default now()
);

create index idx_point_tx_profile on point_transactions (profile_id);

-- ============================================================
-- 7. REVIEWS
-- ============================================================
create table reviews (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies on delete cascade,
  profile_id   uuid not null references profiles on delete cascade,
  referral_id  uuid references referrals on delete set null,
  rating       smallint not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz not null default now()
);

create index idx_reviews_company on reviews (company_id);

-- ============================================================
-- 8. NOTIFICATIONS
-- ============================================================
create table notifications (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles on delete cascade,
  type         notification_type not null default 'system',
  title        text not null,
  body         text,
  read         boolean not null default false,
  data         jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create index idx_notifications_profile on notifications (profile_id);
create index idx_notifications_unread on notifications (profile_id) where read = false;

-- ============================================================
-- 9. ACHIEVEMENTS
-- ============================================================
create table achievements (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid references companies on delete cascade,
  name         text not null,
  description  text,
  icon         text,
  condition    jsonb not null default '{}',
  points_bonus integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- 10. USER ACHIEVEMENTS
-- ============================================================
create table user_achievements (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles on delete cascade,
  achievement_id uuid not null references achievements on delete cascade,
  earned_at      timestamptz not null default now(),
  unique (profile_id, achievement_id)
);

create index idx_user_achievements_profile on user_achievements (profile_id);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_companies_updated   before update on companies   for each row execute function update_updated_at();
create trigger trg_profiles_updated    before update on profiles    for each row execute function update_updated_at();
create trigger trg_referrals_updated   before update on referrals   for each row execute function update_updated_at();
create trigger trg_rewards_updated     before update on rewards     for each row execute function update_updated_at();
create trigger trg_redemptions_updated before update on redemptions for each row execute function update_updated_at();

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table companies        enable row level security;
alter table profiles         enable row level security;
alter table referrals        enable row level security;
alter table rewards          enable row level security;
alter table redemptions      enable row level security;
alter table point_transactions enable row level security;
alter table reviews          enable row level security;
alter table notifications    enable row level security;
alter table achievements     enable row level security;
alter table user_achievements enable row level security;

-- Companies: contractors can manage their own; customers can read their company
create policy "Contractors manage own company"
  on companies for all
  using (
    id in (select company_id from profiles where id = auth.uid() and role = 'contractor')
  );

create policy "Customers read own company"
  on companies for select
  using (
    id in (select company_id from profiles where id = auth.uid())
  );

create policy "Super admins full access to companies"
  on companies for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
  );

-- Profiles: users can read/update own; contractors can read profiles in their company
create policy "Users manage own profile"
  on profiles for all
  using (id = auth.uid());

create policy "Contractors read company profiles"
  on profiles for select
  using (
    company_id in (select company_id from profiles where id = auth.uid() and role = 'contractor')
  );

create policy "Super admins full access to profiles"
  on profiles for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
  );

-- Referrals: referrers manage own; contractors manage company referrals
create policy "Referrers manage own referrals"
  on referrals for all
  using (referrer_id = auth.uid());

create policy "Contractors manage company referrals"
  on referrals for all
  using (
    company_id in (select company_id from profiles where id = auth.uid() and role = 'contractor')
  );

-- Rewards: anyone in company can read; contractors can manage
create policy "Company members read rewards"
  on rewards for select
  using (
    company_id in (select company_id from profiles where id = auth.uid())
  );

create policy "Contractors manage rewards"
  on rewards for all
  using (
    company_id in (select company_id from profiles where id = auth.uid() and role = 'contractor')
  );

-- Redemptions: users see own; contractors see company
create policy "Users manage own redemptions"
  on redemptions for all
  using (profile_id = auth.uid());

create policy "Contractors manage company redemptions"
  on redemptions for all
  using (
    company_id in (select company_id from profiles where id = auth.uid() and role = 'contractor')
  );

-- Point transactions: users see own; contractors see company
create policy "Users read own transactions"
  on point_transactions for select
  using (profile_id = auth.uid());

create policy "Contractors read company transactions"
  on point_transactions for select
  using (
    company_id in (select company_id from profiles where id = auth.uid() and role = 'contractor')
  );

-- Reviews: anyone in company can read; own reviews manageable
create policy "Company members read reviews"
  on reviews for select
  using (
    company_id in (select company_id from profiles where id = auth.uid())
  );

create policy "Users manage own reviews"
  on reviews for all
  using (profile_id = auth.uid());

-- Notifications: users see own
create policy "Users manage own notifications"
  on notifications for all
  using (profile_id = auth.uid());

-- Achievements: anyone in company can read
create policy "Company members read achievements"
  on achievements for select
  using (
    company_id in (select company_id from profiles where id = auth.uid())
    or company_id is null
  );

create policy "Contractors manage achievements"
  on achievements for all
  using (
    company_id in (select company_id from profiles where id = auth.uid() and role = 'contractor')
  );

-- User achievements: users see own
create policy "Users read own achievements"
  on user_achievements for select
  using (profile_id = auth.uid());

create policy "System insert achievements"
  on user_achievements for insert
  with check (true);
