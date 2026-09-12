-- Detour — initial schema
--
-- Apply with the Supabase CLI (`supabase db push`) or by pasting into the SQL
-- editor in the dashboard. Safe to run on a fresh project.
--
-- Design notes worth knowing before you change anything:
--
--  * Dependencies live in their own table (`item_deps`) rather than an array
--    column, because the itinerary is a graph and the engine walks it. An array
--    would work until you needed to ask "what depends on this", which is the
--    only question that matters when something breaks.
--
--  * Membership checks go through SECURITY DEFINER functions. That is not
--    laziness — a policy on `trip_members` that queries `trip_members` recurses
--    forever. SECURITY DEFINER bypasses RLS inside the function, which breaks
--    the cycle. Each one is `stable` and pins `search_path` so it cannot be
--    hijacked by a shadowed schema.
--
--  * Joining a trip is a function, not an INSERT policy. RLS cannot check "did
--    this person hold a valid invite code", so the check lives in
--    `join_trip_by_code`, which is the only way a non-owner gets a membership row.

-- ---------------------------------------------------------------- extensions
create extension if not exists pgcrypto;

-- ------------------------------------------------------------------- profiles
create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text not null default '',
  -- Avatar colour. Kept here so a person looks the same across every trip.
  tone          text not null default '#0f766e',
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------- trips
create table public.trips (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users on delete cascade,
  destination     text not null,
  -- Matches an id in the app's destinations list, when the user picked one.
  destination_id  text,
  start_date      date not null,
  nights          int  not null default 1 check (nights between 0 and 30),
  budget          numeric(10,2) not null default 0 check (budget >= 0),
  lat             double precision not null,
  lon             double precision not null,
  -- Short shareable code. Random, not sequential, so it cannot be guessed upward.
  invite_code     text not null unique
                    default upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8)),
  created_at      timestamptz not null default now()
);

create index trips_owner_idx on public.trips (owner_id);

-- -------------------------------------------------------------- trip_members
create table public.trip_members (
  trip_id   uuid not null references public.trips on delete cascade,
  user_id   uuid not null references auth.users on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index trip_members_user_idx on public.trip_members (user_id);

-- --------------------------------------------------------------- preferences
create table public.preferences (
  trip_id         uuid not null references public.trips on delete cascade,
  user_id         uuid not null references auth.users on delete cascade,
  -- { food: 1-5, culture: 1-5, nature: 1-5, nightlife: 1-5, rest: 1-5 }
  interests       jsonb not null default '{}'::jsonb,
  budget_ceiling  numeric(10,2) not null default 0 check (budget_ceiling >= 0),
  pace            text not null default 'balanced'
                    check (pace in ('packed', 'balanced', 'slow')),
  -- Item ids this person will not give up. The repair engine treats these as hard.
  non_negotiables text[] not null default '{}',
  note            text,
  updated_at      timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- ---------------------------------------------------------------------- items
create table public.items (
  id                uuid primary key default gen_random_uuid(),
  trip_id           uuid not null references public.trips on delete cascade,
  title             text not null,
  detail            text not null default '',
  icon              text not null default '📍',
  day               int  not null check (day >= 1),
  -- Minutes from midnight. Integers, not timestamps: an itinerary is local
  -- wall-clock time and never wants a timezone conversion applied to it.
  start_min         int  not null check (start_min between 0 and 1439),
  duration_min      int  not null default 0 check (duration_min >= 0),
  cost              numeric(10,2) not null default 0 check (cost >= 0),
  prepaid           boolean not null default false,
  -- Fraction recoverable on cancellation, 0..1.
  refund_rate       numeric(3,2) not null default 1 check (refund_rate between 0 and 1),
  flexibility       text not null default 'movable'
                      check (flexibility in ('locked', 'movable', 'droppable')),
  interest          text not null default 'rest'
                      check (interest in ('food', 'culture', 'nature', 'nightlife', 'rest')),
  -- Weather-exposed. Drives which items a wet forecast can rule out.
  outdoor           boolean not null default false,
  -- Latest arrival still acceptable (a reception desk open until 21:00).
  window_end        int check (window_end between 0 and 1439),
  -- The hours this item makes sense at all, so nothing is rescheduled to a
  -- night market at 08:00.
  sensible_earliest int check (sensible_earliest between 0 and 1439),
  sensible_latest   int check (sensible_latest between 0 and 1439),
  created_at        timestamptz not null default now(),
  constraint sensible_hours_ordered
    check (sensible_earliest is null or sensible_latest is null
           or sensible_earliest <= sensible_latest)
);

create index items_trip_idx on public.items (trip_id, day, start_min);

-- ------------------------------------------------------------------ item_deps
create table public.item_deps (
  item_id       uuid not null references public.items on delete cascade,
  depends_on_id uuid not null references public.items on delete cascade,
  primary key (item_id, depends_on_id),
  constraint no_self_dependency check (item_id <> depends_on_id)
);

create index item_deps_depends_on_idx on public.item_deps (depends_on_id);

-- =========================================================== helper functions

-- Is the caller on this trip? SECURITY DEFINER so a policy on trip_members can
-- use it without recursing into its own policy.
create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$;

-- Does the caller share any trip with this person? Gates profile visibility, so
-- you can see your trip-mates' names and nobody else's.
create or replace function public.shares_trip_with(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.trip_members mine
    join public.trip_members theirs on theirs.trip_id = mine.trip_id
    where mine.user_id = auth.uid() and theirs.user_id = p_user_id
  );
$$;

-- Does the caller own this trip?
create or replace function public.is_trip_owner(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.trips where id = p_trip_id and owner_id = auth.uid()
  );
$$;

-- ============================================================ row-level security

alter table public.profiles     enable row level security;
alter table public.trips        enable row level security;
alter table public.trip_members enable row level security;
alter table public.preferences  enable row level security;
alter table public.items        enable row level security;
alter table public.item_deps    enable row level security;

-- ---- profiles: yourself, and people you actually travel with
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_trip_with(id));

create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---- trips: members read; only the owner creates, edits or deletes
create policy trips_select on public.trips for select to authenticated
  using (public.is_trip_member(id));

create policy trips_insert on public.trips for insert to authenticated
  with check (owner_id = auth.uid());

create policy trips_update on public.trips for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy trips_delete on public.trips for delete to authenticated
  using (owner_id = auth.uid());

-- ---- trip_members: members see the roster; the owner adds and removes.
-- A non-owner never INSERTs here directly — joining goes through
-- join_trip_by_code, which validates the invite code first.
create policy trip_members_select on public.trip_members for select to authenticated
  using (public.is_trip_member(trip_id));

create policy trip_members_insert on public.trip_members for insert to authenticated
  with check (public.is_trip_owner(trip_id));

create policy trip_members_delete on public.trip_members for delete to authenticated
  using (public.is_trip_owner(trip_id) or user_id = auth.uid());

-- ---- preferences: the whole trip sees them (that is the point), you write only yours
create policy preferences_select on public.preferences for select to authenticated
  using (public.is_trip_member(trip_id));

create policy preferences_insert on public.preferences for insert to authenticated
  with check (user_id = auth.uid() and public.is_trip_member(trip_id));

create policy preferences_update on public.preferences for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy preferences_delete on public.preferences for delete to authenticated
  using (user_id = auth.uid());

-- ---- items: any member may edit the itinerary. A shared trip is shared work.
create policy items_select on public.items for select to authenticated
  using (public.is_trip_member(trip_id));

create policy items_write on public.items for insert to authenticated
  with check (public.is_trip_member(trip_id));

create policy items_update on public.items for update to authenticated
  using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));

create policy items_delete on public.items for delete to authenticated
  using (public.is_trip_member(trip_id));

-- ---- item_deps: reachable only through an item you can already see
create policy item_deps_select on public.item_deps for select to authenticated
  using (exists (
    select 1 from public.items i
    where i.id = item_id and public.is_trip_member(i.trip_id)
  ));

create policy item_deps_write on public.item_deps for insert to authenticated
  with check (exists (
    select 1 from public.items i
    where i.id = item_id and public.is_trip_member(i.trip_id)
  ));

create policy item_deps_delete on public.item_deps for delete to authenticated
  using (exists (
    select 1 from public.items i
    where i.id = item_id and public.is_trip_member(i.trip_id)
  ));

-- ================================================================== triggers

-- A profile per signup, so the app never has to cope with a missing one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, 'traveller'), '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The creator of a trip is a member of it. Doing this in a trigger means the
-- client cannot forget, and the trips_select policy works on the first read.
create or replace function public.handle_new_trip()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_trip_created
  after insert on public.trips
  for each row execute function public.handle_new_trip();

-- =================================================================== joining

-- Join by invite code. This is the only path by which a non-owner gains a
-- membership row, and it is why trip_members has no open INSERT policy.
create or replace function public.join_trip_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_trip_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id into v_trip_id
  from public.trips
  where invite_code = upper(trim(p_code));

  if v_trip_id is null then
    raise exception 'no trip with that code';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (v_trip_id, auth.uid(), 'member')
  on conflict (trip_id, user_id) do nothing;

  return v_trip_id;
end;
$$;

revoke all on function public.join_trip_by_code(text) from public;
grant execute on function public.join_trip_by_code(text) to authenticated;
