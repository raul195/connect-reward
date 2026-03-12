-- Business Review Links — stores review platform URLs per business
create table if not exists business_review_links (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references companies(id) on delete cascade,
  platform        text not null,
  url             text not null,
  label           text,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (business_id, platform)
);

create index idx_business_review_links_business on business_review_links (business_id);

create trigger set_updated_at_business_review_links
  before update on business_review_links
  for each row execute function update_updated_at();
