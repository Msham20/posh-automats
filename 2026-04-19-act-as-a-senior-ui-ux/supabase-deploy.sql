create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  setting_key text primary key,
  setting_value text not null default '',
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  price text,
  description text not null,
  sort_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source text not null default 'Website',
  service_interest text,
  email text,
  notes text,
  status text not null default 'New',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  client text not null,
  date date not null,
  time text not null,
  booking_type text not null default 'Call',
  owner text,
  status text not null default 'Scheduled',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  media_type text not null default 'image',
  file_url text not null,
  caption text,
  theme_label text,
  sort_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  quote_text text not null,
  sort_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

insert into storage.buckets (id, name, public)
values ('gallery-media', 'gallery-media', true)
on conflict (id) do update
set public = excluded.public;

alter table public.site_settings enable row level security;
alter table public.services enable row level security;
alter table public.leads enable row level security;
alter table public.bookings enable row level security;
alter table public.gallery_items enable row level security;
alter table public.testimonials enable row level security;

drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "public read services" on public.services;
create policy "public read services" on public.services for select to anon, authenticated using (is_active = true);
drop policy if exists "public read gallery" on public.gallery_items;
create policy "public read gallery" on public.gallery_items for select to anon, authenticated using (is_active = true);
drop policy if exists "public read testimonials" on public.testimonials;
create policy "public read testimonials" on public.testimonials for select to anon, authenticated using (is_active = true);
drop policy if exists "public insert leads" on public.leads;
create policy "public insert leads" on public.leads for insert to anon, authenticated with check (true);

drop policy if exists "admin full settings" on public.site_settings;
create policy "admin full settings" on public.site_settings for all to authenticated using (true) with check (true);
drop policy if exists "admin full services" on public.services;
create policy "admin full services" on public.services for all to authenticated using (true) with check (true);
drop policy if exists "admin full leads" on public.leads;
create policy "admin full leads" on public.leads for all to authenticated using (true) with check (true);
drop policy if exists "admin full bookings" on public.bookings;
create policy "admin full bookings" on public.bookings for all to authenticated using (true) with check (true);
drop policy if exists "admin full gallery" on public.gallery_items;
create policy "admin full gallery" on public.gallery_items for all to authenticated using (true) with check (true);
drop policy if exists "admin full testimonials" on public.testimonials;
create policy "admin full testimonials" on public.testimonials for all to authenticated using (true) with check (true);

drop policy if exists "public read gallery media" on storage.objects;
create policy "public read gallery media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'gallery-media');

drop policy if exists "admin upload gallery media" on storage.objects;
create policy "admin upload gallery media"
on storage.objects
for all
to authenticated
using (bucket_id = 'gallery-media')
with check (bucket_id = 'gallery-media');

insert into public.site_settings (setting_key, setting_value)
values
  ('companyName', 'Posh Automats'),
  ('contactEmail', 'customersupport@poshautomats.com'),
  ('heroTitle', 'Industrial automation built to improve productivity and reduce manual effort.'),
  ('heroLead', 'Posh Automats designs and delivers automation systems and special purpose machines for manufacturers that want leaner operations, better process control, and stronger production confidence.'),
  ('aboutSnippet', 'Engineering solutions designed around manufacturing realities, with a focus on human effort reduction, lean production, and practical delivery.'),
  ('ctaTitle', 'Planning an automation upgrade or custom machine requirement?'),
  ('ctaText', 'Speak with the Posh Automats team about your production goals, bottlenecks, or custom equipment needs.')
on conflict (setting_key) do update
set setting_value = excluded.setting_value,
    updated_at = timezone('utc', now());

insert into public.services (title, category, price, description, sort_order, is_active)
select * from (
  values
    ('PLC and HMI Integration', 'Automation', 'Custom quote', 'Operator-friendly automation controls with reliable process visibility.', 1, true),
    ('Special Purpose Machines', 'SPM', 'Project based', 'Custom-built machines for machining, assembly, and repeatable industrial operations.', 2, true),
    ('Vision Inspection Systems', 'Inspection', 'Custom quote', 'Low-cost vision and positioning setups for process verification and quality control.', 3, true)
) as seed(title, category, price, description, sort_order, is_active)
where not exists (
  select 1 from public.services existing where existing.title = seed.title
);

insert into public.gallery_items (title, media_type, file_url, caption, theme_label, sort_order, is_active)
select * from (
  values
    ('Automation Cell', 'image', 'assets/logo-posh-automats.jpg', 'Starter image used until project photos are connected.', 'Automation', 1, true),
    ('SPM Demo Reel', 'video', 'https://example.com/demo-machine.mp4', 'Replace this with a real MP4 or WebM URL after setup.', 'Media', 2, true)
) as seed(title, media_type, file_url, caption, theme_label, sort_order, is_active)
where not exists (
  select 1 from public.gallery_items existing where existing.title = seed.title
);

insert into public.testimonials (name, role, quote_text, sort_order, is_active)
select * from (
  values
    ('Plant Operations Lead', 'Automotive Supplier', 'The team approached automation practically and helped us reduce manual intervention.', 1, true),
    ('Production Manager', 'Assembly Unit', 'Clear engineering support, dependable delivery, and better production confidence.', 2, true)
) as seed(name, role, quote_text, sort_order, is_active)
where not exists (
  select 1 from public.testimonials existing
  where existing.name = seed.name and existing.quote_text = seed.quote_text
);
