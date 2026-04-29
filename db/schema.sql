create table if not exists orders (
  id text primary key,
  created_at timestamptz not null,
  product text not null,
  total numeric(10, 2) not null,
  email text not null,
  phone text,
  hero_name text not null,
  hero_type text not null,
  story_title text not null,
  story_id text not null,
  gender text,
  photo_count integer not null default 0,
  choices jsonb not null default '[]'::jsonb,
  postage jsonb,
  status text not null,
  fulfilment_status text not null default 'new',
  fulfilment_updated_at timestamptz,
  download_url text,
  email_sent_at timestamptz
);

create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_fulfilment_status_idx on orders (fulfilment_status);

create table if not exists enquiries (
  id text primary key,
  created_at timestamptz not null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new'
);

create index if not exists enquiries_created_at_idx on enquiries (created_at desc);
create index if not exists enquiries_status_idx on enquiries (status);

create table if not exists email_logs (
  id text primary key,
  created_at timestamptz not null,
  recipient text not null,
  subject text not null,
  body text not null,
  order_id text not null,
  provider text not null default 'log'
);

create index if not exists email_logs_created_at_idx on email_logs (created_at desc);
create index if not exists email_logs_order_id_idx on email_logs (order_id);
