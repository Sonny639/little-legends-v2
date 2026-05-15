-- Run this in the Supabase SQL editor after db/schema.sql.
-- The app accesses these tables from trusted server routes with the service role key,
-- so public browser roles should not have direct table access.

alter table public.orders enable row level security;
alter table public.enquiries enable row level security;
alter table public.email_logs enable row level security;

revoke all on table public.orders from anon, authenticated;
revoke all on table public.enquiries from anon, authenticated;
revoke all on table public.email_logs from anon, authenticated;
