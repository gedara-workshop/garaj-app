-- Garaj initial schema.
-- A "garage" is the workspace: one person with one bike is a garage with one vehicle;
-- a family or small fleet is a garage with members. Every row is scoped to a garage,
-- and row level security lets people see only the garages they belong to.

create type garage_role as enum ('owner', 'editor', 'logger');
create type vehicle_type as enum ('car', 'suv', 'van', 'pickup', 'three-wheeler', 'motorbike', 'lorry');
create type fuel_type as enum ('petrol', 'diesel', 'hybrid', 'electric');
create type renewal_kind as enum ('revenue_license', 'insurance', 'emission_test', 'driving_license');
create type record_kind as enum ('service', 'fuel', 'repair', 'other');

create table garages (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Garaj',
  created_at timestamptz not null default now()
);

create table garage_members (
  garage_id uuid not null references garages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role garage_role not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (garage_id, user_id)
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages (id) on delete cascade,
  type vehicle_type not null,
  make text not null,
  model text not null,
  year smallint check (year between 1950 and 2100),
  fuel fuel_type,
  color text,
  province text check (province ~ '^[A-Z]{2}$'),
  plate text not null,
  odometer_km integer not null default 0 check (odometer_km >= 0),
  odometer_updated_at date not null default current_date,
  photo_path text, -- object path in the "vehicle-photos" storage bucket
  sold_at date,    -- set when sold: keeps history, stops reminders
  created_at timestamptz not null default now()
);

create table renewals (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages (id) on delete cascade,
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  kind renewal_kind not null,
  provider text,
  expires_on date not null,
  document_path text,
  created_at timestamptz not null default now()
);

create table service_items (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages (id) on delete cascade,
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  name text not null,
  interval_km integer not null check (interval_km > 0),
  last_done_km integer not null check (last_done_km >= 0),
  created_at timestamptz not null default now()
);

create table records (
  id uuid primary key default gen_random_uuid(),
  garage_id uuid not null references garages (id) on delete cascade,
  vehicle_id uuid not null references vehicles (id) on delete cascade,
  kind record_kind not null,
  title text not null,
  place text,
  odometer_km integer check (odometer_km >= 0),
  happened_on date not null default current_date,
  amount_lkr numeric(12, 2) not null default 0 check (amount_lkr >= 0),
  bill_path text, -- object path in the "bills" storage bucket
  extracted jsonb, -- raw fields the AI read from the bill, kept for checking
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index on vehicles (garage_id);
create index on renewals (garage_id, expires_on);
create index on service_items (vehicle_id);
create index on records (vehicle_id, happened_on desc);

-- Membership check used by every policy. security definer avoids recursive RLS on garage_members.
create function is_garage_member(g uuid, roles garage_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from garage_members m
    where m.garage_id = g
      and m.user_id = auth.uid()
      and (roles is null or m.role = any (roles))
  );
$$;

-- Every new user gets their own garage automatically.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_garage uuid;
begin
  insert into garages default values returning id into new_garage;
  insert into garage_members (garage_id, user_id, role) values (new_garage, new.id, 'owner');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

alter table garages enable row level security;
alter table garage_members enable row level security;
alter table vehicles enable row level security;
alter table renewals enable row level security;
alter table service_items enable row level security;
alter table records enable row level security;

create policy "members read their garage" on garages
  for select using (is_garage_member(id));
create policy "owners rename their garage" on garages
  for update using (is_garage_member(id, array['owner']::garage_role[]));

create policy "members see who is in the garage" on garage_members
  for select using (is_garage_member(garage_id));
create policy "owners manage members" on garage_members
  for all using (is_garage_member(garage_id, array['owner']::garage_role[]))
  with check (is_garage_member(garage_id, array['owner']::garage_role[]));

-- Owners and editors manage vehicles, renewals and service items.
create policy "members read vehicles" on vehicles for select using (is_garage_member(garage_id));
create policy "editors write vehicles" on vehicles for all
  using (is_garage_member(garage_id, array['owner', 'editor']::garage_role[]))
  with check (is_garage_member(garage_id, array['owner', 'editor']::garage_role[]));

create policy "members read renewals" on renewals for select using (is_garage_member(garage_id));
create policy "editors write renewals" on renewals for all
  using (is_garage_member(garage_id, array['owner', 'editor']::garage_role[]))
  with check (is_garage_member(garage_id, array['owner', 'editor']::garage_role[]));

create policy "members read service items" on service_items for select using (is_garage_member(garage_id));
create policy "editors write service items" on service_items for all
  using (is_garage_member(garage_id, array['owner', 'editor']::garage_role[]))
  with check (is_garage_member(garage_id, array['owner', 'editor']::garage_role[]));

-- Loggers (a driver, a family member) can add fuel and services but not delete anything.
create policy "members read records" on records for select using (is_garage_member(garage_id));
create policy "members add records" on records for insert
  with check (is_garage_member(garage_id) and created_by = auth.uid());
create policy "editors change records" on records for update
  using (is_garage_member(garage_id, array['owner', 'editor']::garage_role[]));
create policy "editors delete records" on records for delete
  using (is_garage_member(garage_id, array['owner', 'editor']::garage_role[]));
