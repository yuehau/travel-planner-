-- Travel Planner Supabase schema (remote mode parity for the trip-board prototype)
-- Apply this to project sevubkrirbaitcikpcjk.
--
-- v2: the tabbed planner tables (itinerary_items, budget_items, packing_items, trip_infos,
-- trip_todos, trip_members, user_settings) were removed. Trips are boards of places connected
-- by place_links; news_posts/news_likes back the News page. Local mode (Express + SQLite) is
-- the working prototype; this file keeps the remote schema in step for a future remote mode.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  gender text check (gender is null or gender in ('female', 'male', 'non_binary', 'prefer_not_to_say', 'self_describe')),
  gender_detail text,
  birth_date date,
  home_city text,
  country text not null default 'Malaysia',
  bio text,
  updated_at timestamptz default timezone('utc'::text, now())
);

alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists gender_detail text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists home_city text;
alter table public.profiles add column if not exists country text not null default 'Malaysia';
alter table public.profiles add column if not exists bio text;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  destination text not null,
  region text,
  cover_image text,
  start_date date not null,
  end_date date not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'complete')),
  share_token text unique,
  shared_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.trips add column if not exists region text;
alter table public.trips add column if not exists cover_image text;
alter table public.trips add column if not exists status text not null default 'draft';
alter table public.trips add column if not exists share_token text unique;
alter table public.trips add column if not exists shared_at timestamptz;
alter table public.trips drop column if exists home_base;

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  catalog_id text,
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  source text not null default 'manual',
  notes text,
  photo_url text,
  rating numeric(2, 1),
  label text,
  day_number integer,
  start_time text,
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint places_rating_range check (rating is null or (rating >= 0 and rating <= 5))
);

alter table public.places add column if not exists catalog_id text;
alter table public.places add column if not exists label text;
alter table public.places add column if not exists day_number integer;
alter table public.places add column if not exists start_time text;
alter table public.places add column if not exists position_x double precision not null default 0;
alter table public.places add column if not exists position_y double precision not null default 0;
alter table public.places drop column if exists google_place_id;
alter table public.places drop column if exists google_photo_name;
alter table public.places drop column if exists google_photo_attribution;

create table if not exists public.place_links (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  source_place_id uuid not null references public.places(id) on delete cascade,
  target_place_id uuid not null references public.places(id) on delete cascade,
  transport_mode text not null default 'walk' check (transport_mode in ('walk', 'car', 'bus', 'train')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint place_links_unique_pair unique (source_place_id, target_place_id),
  constraint place_links_no_self_link check (source_place_id <> target_place_id)
);

create table if not exists public.trip_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  destination text not null,
  status text not null default 'want_to_go' check (status in ('want_to_go', 'visited')),
  notes text,
  visited_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.news_posts (
  id text primary key,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body jsonb not null default '[]'::jsonb,
  city text not null,
  category text not null check (category in ('cafe', 'restaurant', 'attraction', 'event', 'trip')),
  author text not null,
  published_at date not null,
  cover_image text not null,
  base_likes integer not null default 0,
  kind text not null default 'editorial' check (kind in ('editorial', 'trip')),
  user_id uuid references public.profiles(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete cascade,
  share_token text
);

-- Public read-only boards shared from demo mode (local mode shares live trips via trips.share_token).
create table if not exists public.shared_snapshots (
  token text primary key,
  payload jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.news_likes (
  post_id text not null references public.news_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (post_id, user_id)
);

-- Legacy planner tables from the tabbed prototype.
drop table if exists public.itinerary_items;
drop table if exists public.budget_items;
drop table if exists public.packing_items;
drop table if exists public.trip_infos;
drop table if exists public.trip_todos;
drop table if exists public.trip_members;
drop table if exists public.user_settings;
drop table if exists public.reservations;

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.places enable row level security;
alter table public.place_links enable row level security;
alter table public.trip_collections enable row level security;
alter table public.news_posts enable row level security;
alter table public.news_likes enable row level security;

drop policy if exists "Users can view own profile." on public.profiles;
drop policy if exists "Users can insert own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can view own profile." on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users can insert own profile." on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update own profile." on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Users can view own trips." on public.trips;
drop policy if exists "Users can insert own trips." on public.trips;
drop policy if exists "Users can update own trips." on public.trips;
drop policy if exists "Users can delete own trips." on public.trips;
create policy "Users can view own trips." on public.trips for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own trips." on public.trips for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own trips." on public.trips for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own trips." on public.trips for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.user_owns_trip(target_trip_id uuid)
returns boolean
language sql
security invoker
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.trips
    where trips.id = target_trip_id
      and trips.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.user_owns_trip(uuid) from public;
grant execute on function public.user_owns_trip(uuid) to authenticated;

drop policy if exists "Users can view places of their own trips." on public.places;
drop policy if exists "Users can insert places into their own trips." on public.places;
drop policy if exists "Users can update places of their own trips." on public.places;
drop policy if exists "Users can delete places of their own trips." on public.places;
create policy "Users can view places of their own trips." on public.places for select to authenticated using (public.user_owns_trip(trip_id));
create policy "Users can insert places into their own trips." on public.places for insert to authenticated with check (public.user_owns_trip(trip_id));
create policy "Users can update places of their own trips." on public.places for update to authenticated using (public.user_owns_trip(trip_id)) with check (public.user_owns_trip(trip_id));
create policy "Users can delete places of their own trips." on public.places for delete to authenticated using (public.user_owns_trip(trip_id));

drop policy if exists "Users can view links of their own trips." on public.place_links;
drop policy if exists "Users can insert links into their own trips." on public.place_links;
drop policy if exists "Users can update links of their own trips." on public.place_links;
drop policy if exists "Users can delete links of their own trips." on public.place_links;
create policy "Users can view links of their own trips." on public.place_links for select to authenticated using (public.user_owns_trip(trip_id));
create policy "Users can insert links into their own trips." on public.place_links for insert to authenticated with check (public.user_owns_trip(trip_id));
create policy "Users can update links of their own trips." on public.place_links for update to authenticated using (public.user_owns_trip(trip_id)) with check (public.user_owns_trip(trip_id));
create policy "Users can delete links of their own trips." on public.place_links for delete to authenticated using (public.user_owns_trip(trip_id));

drop policy if exists "Users can view own saved destinations." on public.trip_collections;
drop policy if exists "Users can insert own saved destinations." on public.trip_collections;
drop policy if exists "Users can update own saved destinations." on public.trip_collections;
drop policy if exists "Users can delete own saved destinations." on public.trip_collections;
create policy "Users can view own saved destinations." on public.trip_collections for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own saved destinations." on public.trip_collections for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own saved destinations." on public.trip_collections for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own saved destinations." on public.trip_collections for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Anyone signed in can read news." on public.news_posts;
drop policy if exists "Users can publish trip posts." on public.news_posts;
drop policy if exists "Users can edit own trip posts." on public.news_posts;
drop policy if exists "Users can delete own trip posts." on public.news_posts;
create policy "Anyone signed in can read news." on public.news_posts for select to authenticated using (true);
create policy "Users can publish trip posts." on public.news_posts for insert to authenticated with check (kind = 'trip' and (select auth.uid()) = user_id);
create policy "Users can edit own trip posts." on public.news_posts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own trip posts." on public.news_posts for delete to authenticated using ((select auth.uid()) = user_id);

alter table public.shared_snapshots enable row level security;
drop policy if exists "Anyone can read shared snapshots." on public.shared_snapshots;
create policy "Anyone can read shared snapshots." on public.shared_snapshots for select to anon, authenticated using (true);

drop policy if exists "Anyone signed in can see like counts." on public.news_likes;
drop policy if exists "Users can like posts." on public.news_likes;
drop policy if exists "Users can unlike posts." on public.news_likes;
create policy "Anyone signed in can see like counts." on public.news_likes for select to authenticated using (true);
create policy "Users can like posts." on public.news_likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can unlike posts." on public.news_likes for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        avatar_url = excluded.avatar_url,
        updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create index if not exists trips_user_id_start_date_idx on public.trips (user_id, start_date);
create index if not exists places_trip_id_created_at_idx on public.places (trip_id, created_at);
create index if not exists place_links_trip_id_idx on public.place_links (trip_id);
create index if not exists trip_collections_user_id_status_created_idx on public.trip_collections (user_id, status, created_at desc);
create index if not exists news_posts_published_at_idx on public.news_posts (published_at desc);
