-- Customer Achievements — key-based achievement tracking
-- The old achievements/user_achievements tables stored config in the DB.
-- This new table stores earned achievements by key, evaluated in app code.

create table if not exists customer_achievements (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references profiles(id) on delete cascade,
  business_id     uuid not null references companies(id) on delete cascade,
  achievement_key text not null,
  earned_at       timestamptz not null default now(),
  unique (customer_id, achievement_key)
);

create index idx_customer_achievements_customer on customer_achievements (customer_id);
create index idx_customer_achievements_business on customer_achievements (business_id);
