-- ============================================================================
-- Design portfolio — Supabase schema
-- Run this whole file once in Supabase → SQL Editor → New query → Run.
-- It is safe to run again: every statement is idempotent.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Admins: only users listed here can manage content.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

drop policy if exists "admins: read own row" on public.admins;
create policy "admins: read own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Site settings (single row)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id          smallint primary key default 1 check (id = 1),
  name        text not null default '',
  name_mn     text not null default '',
  name_script text not null default '',
  role_mn     text not null default '',
  role_en     text not null default '',
  tagline_mn  text not null default '',
  tagline_en  text not null default '',
  intro_mn    text not null default '',
  intro_en    text not null default '',
  about_mn    text not null default '',
  about_en    text not null default '',
  services_mn text not null default '',
  services_en text not null default '',
  location_mn text not null default '',
  location_en text not null default '',
  email       text not null default '',
  phone       text not null default '',
  avatar      jsonb,
  socials     jsonb not null default '[]'::jsonb,
  available   boolean not null default true,
  accent      text not null default '', -- empty = monochrome
  canvas_bg   jsonb not null default '{}'::jsonb, -- per home page: {"work":"#1e1e1e",…}
  updated_at  timestamptz not null default now()
);
-- Columns added after the first release (safe to re-run).
alter table public.site_settings add column if not exists name_mn text not null default '';
alter table public.site_settings add column if not exists name_script text not null default '';
alter table public.site_settings add column if not exists canvas_bg jsonb not null default '{}'::jsonb;

insert into public.site_settings (id, name, name_mn, name_script, accent)
values (1, 'Tumursukh', 'Төмөрсүх', 'ᠲᠡᠮᠦᠷᠰᠦᠬᠡ', '')
on conflict (id) do nothing;

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name_mn    text not null,
  name_en    text not null default '',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title_mn       text not null default '',
  title_en       text not null default '',
  summary_mn     text not null default '',
  summary_en     text not null default '',
  description_mn text not null default '',
  description_en text not null default '',
  role_mn        text not null default '',
  role_en        text not null default '',
  client         text not null default '',
  year           int,
  tools          text[] not null default '{}',
  category_id    uuid references public.categories (id) on delete set null,
  cover          jsonb,
  gallery        jsonb not null default '[]'::jsonb,
  external_url   text not null default '',
  featured       boolean not null default false,
  published      boolean not null default false,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists projects_order_idx on public.projects (published, sort_order);

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Contact messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) between 3 and 200),
  subject    text not null default '' check (char_length(subject) <= 200),
  body       text not null check (char_length(body) between 1 and 5000),
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_created_idx on public.messages (created_at desc);

-- ---------------------------------------------------------------------------
-- Page views (analytics)
-- ---------------------------------------------------------------------------
create table if not exists public.page_views (
  id         bigint generated always as identity primary key,
  path       text not null check (char_length(path) <= 300),
  project_id uuid references public.projects (id) on delete cascade,
  locale     text check (char_length(locale) <= 5),
  visitor_id text check (char_length(visitor_id) <= 64),
  referrer   text check (char_length(referrer) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists page_views_created_idx on public.page_views (created_at);
create index if not exists page_views_project_idx on public.page_views (project_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.site_settings enable row level security;
alter table public.categories    enable row level security;
alter table public.projects      enable row level security;
alter table public.messages      enable row level security;
alter table public.page_views    enable row level security;

-- settings: anyone reads, admins update
drop policy if exists "settings: public read" on public.site_settings;
create policy "settings: public read" on public.site_settings
  for select using (true);
drop policy if exists "settings: admin update" on public.site_settings;
create policy "settings: admin update" on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- categories: anyone reads, admins write
drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read" on public.categories
  for select using (true);
drop policy if exists "categories: admin write" on public.categories;
create policy "categories: admin write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- projects: anyone reads published ones, admins read and write everything
drop policy if exists "projects: public read" on public.projects;
create policy "projects: public read" on public.projects
  for select using (published or public.is_admin());
drop policy if exists "projects: admin write" on public.projects;
create policy "projects: admin write" on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- messages: anyone can send, only admins read and manage
drop policy if exists "messages: public insert" on public.messages;
create policy "messages: public insert" on public.messages
  for insert to anon, authenticated with check (read = false);
drop policy if exists "messages: admin read" on public.messages;
create policy "messages: admin read" on public.messages
  for select to authenticated using (public.is_admin());
drop policy if exists "messages: admin update" on public.messages;
create policy "messages: admin update" on public.messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "messages: admin delete" on public.messages;
create policy "messages: admin delete" on public.messages
  for delete to authenticated using (public.is_admin());

-- page views: anyone can record, only admins read
drop policy if exists "views: public insert" on public.page_views;
create policy "views: public insert" on public.page_views
  for insert to anon, authenticated with check (true);
drop policy if exists "views: admin read" on public.page_views;
create policy "views: admin read" on public.page_views
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Analytics functions (run with the caller's rights, so only admins see data)
-- Days are bucketed in Ulaanbaatar time.
-- ---------------------------------------------------------------------------
create or replace function public.stats_daily(p_days int default 30)
returns table (day date, views bigint, visitors bigint)
language sql stable set search_path = ''
as $$
  with days as (
    select generate_series(
      (now() at time zone 'Asia/Ulaanbaatar')::date - (p_days - 1),
      (now() at time zone 'Asia/Ulaanbaatar')::date,
      interval '1 day'
    )::date as day
  ),
  recent as (
    select (created_at at time zone 'Asia/Ulaanbaatar')::date as day, visitor_id
    from public.page_views
    where created_at >= now() - make_interval(days => p_days + 1)
  )
  select d.day, count(r.day), count(distinct r.visitor_id)
  from days d
  left join recent r on r.day = d.day
  group by d.day
  order by d.day;
$$;

create or replace function public.stats_summary(p_days int default 30)
returns table (views bigint, visitors bigint, prev_views bigint, total_views bigint)
language sql stable set search_path = ''
as $$
  select
    count(*) filter (where created_at >= now() - make_interval(days => p_days)),
    count(distinct visitor_id) filter (where created_at >= now() - make_interval(days => p_days)),
    count(*) filter (where created_at <  now() - make_interval(days => p_days)
                       and created_at >= now() - make_interval(days => p_days * 2)),
    count(*)
  from public.page_views;
$$;

create or replace function public.stats_top_projects(p_days int default 30, p_limit int default 6)
returns table (project_id uuid, slug text, title_mn text, title_en text, views bigint)
language sql stable set search_path = ''
as $$
  select p.id, p.slug, p.title_mn, p.title_en, count(v.id) as views
  from public.page_views v
  join public.projects p on p.id = v.project_id
  where v.created_at >= now() - make_interval(days => p_days)
  group by p.id
  order by views desc
  limit p_limit;
$$;

create or replace function public.stats_referrers(p_days int default 30, p_limit int default 6)
returns table (source text, views bigint)
language sql stable set search_path = ''
as $$
  select coalesce(nullif(referrer, ''), 'direct') as source, count(*) as views
  from public.page_views
  where created_at >= now() - make_interval(days => p_days)
  group by 1
  order by views desc
  limit p_limit;
$$;

revoke execute on function public.stats_daily(int), public.stats_summary(int),
  public.stats_top_projects(int, int), public.stats_referrers(int, int) from anon, public;
grant execute on function public.stats_daily(int), public.stats_summary(int),
  public.stats_top_projects(int, int), public.stats_referrers(int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for images (public read, admin write)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = true;

drop policy if exists "portfolio: admin read" on storage.objects;
create policy "portfolio: admin read" on storage.objects
  for select to authenticated using (bucket_id = 'portfolio' and public.is_admin());
drop policy if exists "portfolio: admin insert" on storage.objects;
create policy "portfolio: admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio' and public.is_admin());
drop policy if exists "portfolio: admin update" on storage.objects;
create policy "portfolio: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'portfolio' and public.is_admin());
drop policy if exists "portfolio: admin delete" on storage.objects;
create policy "portfolio: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio' and public.is_admin());

-- ============================================================================
-- After creating your user in Authentication → Users, make it an admin:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'you@example.com';
-- ============================================================================
