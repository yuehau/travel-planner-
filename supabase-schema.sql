-- Cuti² Supabase schema
-- Apply this to project sevubkrirbaitcikpcjk.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamptz default timezone('utc'::text, now())
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  destination text not null,
  home_base text,
  start_date date not null,
  end_date date not null,
  description text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.trips add column if not exists home_base text;

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  source text not null default 'manual',
  notes text,
  photo_url text,
  rating numeric(2, 1),
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint places_rating_range check (rating is null or (rating >= 0 and rating <= 5))
);

create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null,
  day_number int not null,
  activity text not null,
  location text,
  start_time time,
  end_time time,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.itinerary_items add column if not exists place_id uuid references public.places(id) on delete set null;

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null,
  amount numeric not null check (amount >= 0),
  currency text not null default 'USD',
  is_paid boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null default 'General',
  item text not null,
  is_packed boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.trip_infos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null,
  label text not null,
  value text not null,
  url text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.trip_todos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  is_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  invited_email text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (trip_id, invited_email)
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  currency text not null default 'USD',
  distance_unit text not null default 'km' check (distance_unit in ('km', 'mi')),
  time_format text not null default '12h' check (time_format in ('12h', '24h')),
  dashboard_widgets text[] not null default array['places', 'todos', 'budget'],
  updated_at timestamptz not null default timezone('utc'::text, now())
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

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.places enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.budget_items enable row level security;
alter table public.packing_items enable row level security;
alter table public.trip_infos enable row level security;
alter table public.trip_todos enable row level security;
alter table public.trip_members enable row level security;
alter table public.user_settings enable row level security;
alter table public.trip_collections enable row level security;

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

drop policy if exists "Users can view items of their own trips." on public.itinerary_items;
drop policy if exists "Users can insert items into their own trips." on public.itinerary_items;
drop policy if exists "Users can update items of their own trips." on public.itinerary_items;
drop policy if exists "Users can delete items of their own trips." on public.itinerary_items;
create policy "Users can view items of their own trips." on public.itinerary_items for select to authenticated using (public.user_owns_trip(trip_id));
create policy "Users can insert items into their own trips." on public.itinerary_items for insert to authenticated with check (public.user_owns_trip(trip_id));
create policy "Users can update items of their own trips." on public.itinerary_items for update to authenticated using (public.user_owns_trip(trip_id)) with check (public.user_owns_trip(trip_id));
create policy "Users can delete items of their own trips." on public.itinerary_items for delete to authenticated using (public.user_owns_trip(trip_id));

drop policy if exists "Users can view places of their own trips." on public.places;
drop policy if exists "Users can insert places into their own trips." on public.places;
drop policy if exists "Users can update places of their own trips." on public.places;
drop policy if exists "Users can delete places of their own trips." on public.places;
create policy "Users can view places of their own trips." on public.places for select to authenticated using (public.user_owns_trip(trip_id));
create policy "Users can insert places into their own trips." on public.places for insert to authenticated with check (public.user_owns_trip(trip_id));
create policy "Users can update places of their own trips." on public.places for update to authenticated using (public.user_owns_trip(trip_id)) with check (public.user_owns_trip(trip_id));
create policy "Users can delete places of their own trips." on public.places for delete to authenticated using (public.user_owns_trip(trip_id));

drop policy if exists "Users can view budget of their own trips." on public.budget_items;
drop policy if exists "Users can insert budget items into their own trips." on public.budget_items;
drop policy if exists "Users can update budget items of their own trips." on public.budget_items;
drop policy if exists "Users can delete budget items of their own trips." on public.budget_items;
create policy "Users can view budget of their own trips." on public.budget_items for select to authenticated using (public.user_owns_trip(trip_id));
create policy "Users can insert budget items into their own trips." on public.budget_items for insert to authenticated with check (public.user_owns_trip(trip_id));
create policy "Users can update budget items of their own trips." on public.budget_items for update to authenticated using (public.user_owns_trip(trip_id)) with check (public.user_owns_trip(trip_id));
create policy "Users can delete budget items of their own trips." on public.budget_items for delete to authenticated using (public.user_owns_trip(trip_id));

drop policy if exists "Users can view packing list of their own trips." on public.packing_items;
drop policy if exists "Users can insert packing items into their own trips." on public.packing_items;
drop policy if exists "Users can update packing items of their own trips." on public.packing_items;
drop policy if exists "Users can delete packing items of their own trips." on public.packing_items;
create policy "Users can view packing list of their own trips." on public.packing_items for select to authenticated using (public.user_owns_trip(trip_id));
create policy "Users can insert packing items into their own trips." on public.packing_items for insert to authenticated with check (public.user_owns_trip(trip_id));
create policy "Users can update packing items of their own trips." on public.packing_items for update to authenticated using (public.user_owns_trip(trip_id)) with check (public.user_owns_trip(trip_id));
create policy "Users can delete packing items of their own trips." on public.packing_items for delete to authenticated using (public.user_owns_trip(trip_id));

drop policy if exists "Users can view info of their own trips." on public.trip_infos;
drop policy if exists "Users can insert info into their own trips." on public.trip_infos;
drop policy if exists "Users can update info of their own trips." on public.trip_infos;
drop policy if exists "Users can delete info of their own trips." on public.trip_infos;
create policy "Users can view info of their own trips." on public.trip_infos for select to authenticated using (public.user_owns_trip(trip_id));
create policy "Users can insert info into their own trips." on public.trip_infos for insert to authenticated with check (public.user_owns_trip(trip_id));
create policy "Users can update info of their own trips." on public.trip_infos for update to authenticated using (public.user_owns_trip(trip_id)) with check (public.user_owns_trip(trip_id));
create policy "Users can delete info of their own trips." on public.trip_infos for delete to authenticated using (public.user_owns_trip(trip_id));

drop policy if exists "Users can view tasks of their own trips." on public.trip_todos;
drop policy if exists "Users can insert tasks into their own trips." on public.trip_todos;
drop policy if exists "Users can update tasks of their own trips." on public.trip_todos;
drop policy if exists "Users can delete tasks of their own trips." on public.trip_todos;
create policy "Users can view tasks of their own trips." on public.trip_todos for select to authenticated using (public.user_owns_trip(trip_id));
create policy "Users can insert tasks into their own trips." on public.trip_todos for insert to authenticated with check (public.user_owns_trip(trip_id));
create policy "Users can update tasks of their own trips." on public.trip_todos for update to authenticated using (public.user_owns_trip(trip_id)) with check (public.user_owns_trip(trip_id));
create policy "Users can delete tasks of their own trips." on public.trip_todos for delete to authenticated using (public.user_owns_trip(trip_id));

drop policy if exists "Users can view members of their own trips." on public.trip_members;
drop policy if exists "Owners can invite members to their own trips." on public.trip_members;
drop policy if exists "Owners can update members of their own trips." on public.trip_members;
drop policy if exists "Owners can delete members of their own trips." on public.trip_members;
create policy "Users can view members of their own trips." on public.trip_members for select to authenticated using (public.user_owns_trip(trip_id));
create policy "Owners can invite members to their own trips." on public.trip_members for insert to authenticated with check (public.user_owns_trip(trip_id));
create policy "Owners can update members of their own trips." on public.trip_members for update to authenticated using (public.user_owns_trip(trip_id)) with check (public.user_owns_trip(trip_id));
create policy "Owners can delete members of their own trips." on public.trip_members for delete to authenticated using (public.user_owns_trip(trip_id));

drop policy if exists "Users can view own settings." on public.user_settings;
drop policy if exists "Users can insert own settings." on public.user_settings;
drop policy if exists "Users can update own settings." on public.user_settings;
create policy "Users can view own settings." on public.user_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own settings." on public.user_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own settings." on public.user_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view own saved destinations." on public.trip_collections;
drop policy if exists "Users can insert own saved destinations." on public.trip_collections;
drop policy if exists "Users can update own saved destinations." on public.trip_collections;
drop policy if exists "Users can delete own saved destinations." on public.trip_collections;
create policy "Users can view own saved destinations." on public.trip_collections for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert own saved destinations." on public.trip_collections for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update own saved destinations." on public.trip_collections for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete own saved destinations." on public.trip_collections for delete to authenticated using ((select auth.uid()) = user_id);

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

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Node-graph itinerary for the "something broke" re-planning prototype.
-- Additive: does not replace itinerary_items, which stays the flat list used
-- by the existing Itinerary tab.
create table if not exists public.itinerary_nodes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  parent_node_id uuid references public.itinerary_nodes(id) on delete set null,
  place_id uuid references public.places(id) on delete set null,
  day_number int not null,
  sequence_index int not null default 0,
  title text not null,
  node_type text not null default 'activity' check (node_type in ('activity', 'transport', 'lodging', 'meal', 'other')),
  status text not null default 'planned' check (status in ('planned', 'broken', 'replanned', 'cancelled')),
  start_time time,
  end_time time,
  estimated_cost numeric not null default 0 check (estimated_cost >= 0),
  currency text not null default 'USD',
  notes text,
  break_reason text,
  ai_generated boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.replan_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  broken_node_id uuid references public.itinerary_nodes(id) on delete set null,
  reason text not null,
  ai_request jsonb,
  ai_response jsonb,
  applied boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.trips add column if not exists budget_cap numeric;

alter table public.itinerary_nodes enable row level security;
alter table public.replan_events enable row level security;

drop policy if exists "Users can view nodes of their own trips." on public.itinerary_nodes;
drop policy if exists "Users can insert nodes into their own trips." on public.itinerary_nodes;
drop policy if exists "Users can update nodes of their own trips." on public.itinerary_nodes;
drop policy if exists "Users can delete nodes of their own trips." on public.itinerary_nodes;
create policy "Users can view nodes of their own trips." on public.itinerary_nodes for select to authenticated using (public.user_owns_trip(trip_id));
create policy "Users can insert nodes into their own trips." on public.itinerary_nodes for insert to authenticated with check (public.user_owns_trip(trip_id));
create policy "Users can update nodes of their own trips." on public.itinerary_nodes for update to authenticated using (public.user_owns_trip(trip_id)) with check (public.user_owns_trip(trip_id));
create policy "Users can delete nodes of their own trips." on public.itinerary_nodes for delete to authenticated using (public.user_owns_trip(trip_id));

drop policy if exists "Users can view replan events of their own trips." on public.replan_events;
drop policy if exists "Users can insert replan events into their own trips." on public.replan_events;
create policy "Users can view replan events of their own trips." on public.replan_events for select to authenticated using (public.user_owns_trip(trip_id));
create policy "Users can insert replan events into their own trips." on public.replan_events for insert to authenticated with check (public.user_owns_trip(trip_id));

create index if not exists trips_user_id_start_date_idx on public.trips (user_id, start_date);
create index if not exists places_trip_id_created_at_idx on public.places (trip_id, created_at);
create index if not exists itinerary_items_trip_id_day_sort_idx on public.itinerary_items (trip_id, day_number, sort_order);
create index if not exists budget_items_trip_id_created_at_idx on public.budget_items (trip_id, created_at);
create index if not exists packing_items_trip_id_created_at_idx on public.packing_items (trip_id, created_at);
create index if not exists trip_infos_trip_id_category_created_at_idx on public.trip_infos (trip_id, category, created_at);
create index if not exists trip_todos_trip_id_due_date_idx on public.trip_todos (trip_id, is_completed, due_date);
create index if not exists trip_members_trip_id_email_idx on public.trip_members (trip_id, invited_email);
create index if not exists trip_collections_user_id_status_created_idx on public.trip_collections (user_id, status, created_at desc);
create index if not exists itinerary_nodes_trip_id_day_seq_idx on public.itinerary_nodes (trip_id, day_number, sequence_index);
create index if not exists itinerary_nodes_parent_idx on public.itinerary_nodes (parent_node_id);
create index if not exists replan_events_trip_id_created_idx on public.replan_events (trip_id, created_at desc);
