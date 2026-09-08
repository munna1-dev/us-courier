-- ============================================================
-- US COURIER
-- Database Schema
-- PostgreSQL / Supabase
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================

do $$
begin
  create type public.shipment_status as enum (
    'pending',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'exception',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.account_status as enum (
    'active',
    'inactive',
    'suspended'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.user_role as enum (
    'customer',
    'admin',
    'manager',
    'courier'
  );
exception
  when duplicate_object then null;
end $$;

-- ============================================================
-- USERS
-- ============================================================

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,

  first_name text,
  last_name text,

  email text not null,

  phone text,

  role public.user_role
    not null default 'customer',

  status public.account_status
    not null default 'active',

  avatar_url text,

  created_at timestamptz
    not null default now(),

  updated_at timestamptz
    not null default now(),

  constraint users_email_unique
    unique (email)
);

create index if not exists users_email_idx
  on public.users (lower(email));

create index if not exists users_role_idx
  on public.users (role);

create index if not exists users_status_idx
  on public.users (status);

-- ============================================================
-- FACILITIES
-- ============================================================

create table if not exists public.facilities (
  id uuid primary key
    default gen_random_uuid(),

  name text not null,

  code text not null,

  facility_type text
    not null default 'station',

  address text,

  city text,

  state text,

  postal_code text,

  country text
    not null default 'United States',

  phone text,

  email text,

  latitude numeric(10,7),

  longitude numeric(10,7),

  active boolean
    not null default true,

  created_at timestamptz
    not null default now(),

  updated_at timestamptz
    not null default now(),

  constraint facilities_code_unique
    unique (code)
);

create index if not exists facilities_city_idx
  on public.facilities (city);

create index if not exists facilities_active_idx
  on public.facilities (active);

-- ============================================================
-- COURIERS
-- ============================================================

create table if not exists public.couriers (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid
    references public.users(id)
    on delete set null,

  employee_number text,

  first_name text not null,

  last_name text not null,

  email text,

  phone text,

  status text
    not null default 'active',

  vehicle_number text,

  license_number text,

  current_facility_id uuid
    references public.facilities(id)
    on delete set null,

  created_at timestamptz
    not null default now(),

  updated_at timestamptz
    not null default now(),

  constraint couriers_employee_number_unique
    unique (employee_number)
);

create index if not exists couriers_user_id_idx
  on public.couriers (user_id);

create index if not exists couriers_status_idx
  on public.couriers (status);

-- ============================================================
-- ADDRESSES
-- ============================================================

create table if not exists public.addresses (
  id uuid primary key
    default gen_random_uuid(),

  name text,

  address_line1 text not null,

  address_line2 text,

  city text not null,

  state text,

  postal_code text,

  country text
    not null default 'United States',

  phone text,

  created_at timestamptz
    not null default now()
);

create index if not exists addresses_city_idx
  on public.addresses (city);

create index if not exists addresses_postal_code_idx
  on public.addresses (postal_code);

-- ============================================================
-- SHIPMENTS
-- ============================================================

create table if not exists public.shipments (
  id uuid primary key
    default gen_random_uuid(),

  tracking_number text not null,

  reference_number text,

  customer_id uuid
    references public.users(id)
    on delete set null,

  sender_name text not null,

  sender_email text,

  sender_phone text,

  sender_address_id uuid
    references public.addresses(id)
    on delete set null,

  recipient_name text not null,

  recipient_email text,

  recipient_phone text,

  recipient_address_id uuid
    references public.addresses(id)
    on delete set null,

  origin_facility_id uuid
    references public.facilities(id)
    on delete set null,

  destination_facility_id uuid
    references public.facilities(id)
    on delete set null,

  assigned_courier_id uuid
    references public.couriers(id)
    on delete set null,

  service_type text
    not null default 'standard',

  package_type text
    not null default 'parcel',

  description text,

  weight numeric(10,2),

  weight_unit text
    not null default 'kg',

  status public.shipment_status
    not null default 'pending',

  estimated_delivery_date date,

  actual_delivery_date date,

  delivered_at timestamptz,

  delivery_notes text,

  current_location text,

  current_facility_id uuid
    references public.facilities(id)
    on delete set null,

  created_at timestamptz
    not null default now(),

  updated_at timestamptz
    not null default now(),

  constraint shipments_tracking_number_unique
    unique (tracking_number)
);

create index if not exists shipments_tracking_number_idx
  on public.shipments (tracking_number);

create index if not exists shipments_customer_id_idx
  on public.shipments (customer_id);

create index if not exists shipments_status_idx
  on public.shipments (status);

create index if not exists shipments_courier_idx
  on public.shipments (assigned_courier_id);

create index if not exists shipments_created_at_idx
  on public.shipments (created_at desc);

-- ============================================================
-- SHIPMENT EVENTS / TRACKING HISTORY
-- ============================================================

create table if not exists public.shipment_events (
  id uuid primary key
    default gen_random_uuid(),

  shipment_id uuid not null
    references public.shipments(id)
    on delete cascade,

  status public.shipment_status
    not null,

  title text not null,

  description text,

  location text,

  facility_id uuid
    references public.facilities(id)
    on delete set null,

  courier_id uuid
    references public.couriers(id)
    on delete set null,

  event_time timestamptz
    not null default now(),

  created_at timestamptz
    not null default now()
);

create index if not exists shipment_events_shipment_idx
  on public.shipment_events (shipment_id);

create index if not exists shipment_events_time_idx
  on public.shipment_events (
    shipment_id,
    event_time desc
  );

-- ============================================================
-- AUDIT LOGS
-- ============================================================

create table if not exists public.audit_logs (
  id uuid primary key
    default gen_random_uuid(),

  actor_id uuid
    references public.users(id)
    on delete set null,

  action text not null,

  entity_type text,

  entity_id uuid,

  description text,

  metadata jsonb
    not null default '{}'::jsonb,

  created_at timestamptz
    not null default now()
);

create index if not exists audit_logs_actor_idx
  on public.audit_logs (actor_id);

create index if not exists audit_logs_entity_idx
  on public.audit_logs (
    entity_type,
    entity_id
  );

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.users(id)
    on delete cascade,

  shipment_id uuid
    references public.shipments(id)
    on delete cascade,

  title text not null,

  message text not null,

  notification_type text
    not null default 'shipment',

  read boolean
    not null default false,

  created_at timestamptz
    not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (
    user_id,
    created_at desc
  );

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at
on public.users;

create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists facilities_set_updated_at
on public.facilities;

create trigger facilities_set_updated_at
before update on public.facilities
for each row
execute function public.set_updated_at();

drop trigger if exists couriers_set_updated_at
on public.couriers;

create trigger couriers_set_updated_at
before update on public.couriers
for each row
execute function public.set_updated_at();

drop trigger if exists shipments_set_updated_at
on public.shipments;

create trigger shipments_set_updated_at
before update on public.shipments
for each row
execute function public.set_updated_at();

-- ============================================================
-- AUTO-CREATE USER PROFILE AFTER SUPABASE AUTH SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.users (
    id,
    first_name,
    last_name,
    email,
    role,
    status
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'firstName',
      new.raw_user_meta_data ->> 'first_name',
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'lastName',
      new.raw_user_meta_data ->> 'last_name',
      ''
    ),
    new.email,
    'customer',
    'active'
  )
  on conflict (id)
  do update set
    email = excluded.email,
    updated_at = now();

  return new;

end;
$$;

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- TRACKING NUMBER GENERATOR
-- ============================================================

create or replace function public.generate_tracking_number()
returns text
language plpgsql
as $$
declare
  generated_number text;
begin

  loop

    generated_number :=
      'USC' ||
      to_char(
        current_date,
        'YYMMDD'
      ) ||
      upper(
        substr(
          encode(
            gen_random_bytes(5),
            'hex'
          ),
          1,
          8
        )
      );

    exit when not exists (
      select 1
      from public.shipments
      where tracking_number =
        generated_number
    );

  end loop;

  return generated_number;

end;
$$;

-- ============================================================
-- CREATE INITIAL TRACKING EVENT
-- ============================================================

create or replace function public.create_initial_shipment_event()
returns trigger
language plpgsql
as $$
begin

  insert into public.shipment_events (
    shipment_id,
    status,
    title,
    description,
    location,
    facility_id,
    event_time
  )
  values (
    new.id,
    new.status,
    case new.status
      when 'pending'
        then 'Shipment created'
      when 'picked_up'
        then 'Package picked up'
      when 'in_transit'
        then 'Shipment in transit'
      when 'out_for_delivery'
        then 'Out for delivery'
      when 'delivered'
        then 'Shipment delivered'
      when 'exception'
        then 'Delivery exception'
      when 'cancelled'
        then 'Shipment cancelled'
      else 'Shipment update'
    end,
    'Shipment tracking record created.',
    new.current_location,
    new.current_facility_id,
    now()
  );

  return new;

end;
$$;

drop trigger if exists shipments_initial_event
on public.shipments;

create trigger shipments_initial_event
after insert on public.shipments
for each row
execute function public.create_initial_shipment_event();

-- ============================================================
-- AUTOMATIC TRACKING EVENT ON STATUS CHANGE
-- ============================================================

create or replace function public.create_shipment_status_event()
returns trigger
language plpgsql
as $$
begin

  if old.status is distinct from new.status then

    insert into public.shipment_events (
      shipment_id,
      status,
      title,
      description,
      location,
      facility_id,
      courier_id,
      event_time
    )
    values (
      new.id,
      new.status,
      case new.status
        when 'pending'
          then 'Shipment pending'
        when 'picked_up'
          then 'Package picked up'
        when 'in_transit'
          then 'Shipment in transit'
        when 'out_for_delivery'
          then 'Out for delivery'
        when 'delivered'
          then 'Shipment delivered'
        when 'exception'
          then 'Delivery exception'
        when 'cancelled'
          then 'Shipment cancelled'
        else 'Shipment status updated'
      end,
      'Shipment status updated.',
      new.current_location,
      new.current_facility_id,
      new.assigned_courier_id,
      now()
    );

  end if;

  return new;

end;
$$;

drop trigger if exists shipments_status_event
on public.shipments;

create trigger shipments_status_event
after update of status on public.shipments
for each row
execute function public.create_shipment_status_event();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users
enable row level security;

alter table public.facilities
enable row level security;

alter table public.couriers
enable row level security;

alter table public.addresses
enable row level security;

alter table public.shipments
enable row level security;

alter table public.shipment_events
enable row level security;

alter table public.audit_logs
enable row level security;

alter table public.notifications
enable row level security;

-- ============================================================
-- PUBLIC TRACKING
-- Anyone can read shipment tracking information.
-- Sensitive customer information should not be exposed through
-- the frontend API.
-- ============================================================

drop policy if exists
  public_tracking_shipments
on public.shipments;

create policy public_tracking_shipments
on public.shipments
for select
to anon, authenticated
using (true);

drop policy if exists
  public_tracking_events
on public.shipment_events;

create policy public_tracking_events
on public.shipment_events
for select
to anon, authenticated
using (true);

-- ============================================================
-- USER PROFILE ACCESS
-- ============================================================

drop policy if exists
  users_read_own_profile
on public.users;

create policy users_read_own_profile
on public.users
for select
to authenticated
using (
  id = auth.uid()
);

drop policy if exists
  users_update_own_profile
on public.users;

create policy users_update_own_profile
on public.users
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);

-- ============================================================
-- CUSTOMER SHIPMENT ACCESS
-- ============================================================

drop policy if exists
  customers_read_own_shipments
on public.shipments;

create policy customers_read_own_shipments
on public.shipments
for select
to authenticated
using (
  customer_id = auth.uid()
);

-- ============================================================
-- CUSTOMER NOTIFICATIONS
-- ============================================================

drop policy if exists
  users_read_own_notifications
on public.notifications;

create policy users_read_own_notifications
on public.notifications
for select
to authenticated
using (
  user_id = auth.uid()
);

-- ============================================================
-- CUSTOMER ADDRESSES
-- ============================================================

drop policy if exists
  users_read_addresses
on public.addresses;

create policy users_read_addresses
on public.addresses
for select
to authenticated
using (true);

-- ============================================================
-- ADMIN HELPER
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

-- ============================================================
-- ADMIN POLICIES
-- ============================================================

drop policy if exists
  admins_manage_users
on public.users;

create policy admins_manage_users
on public.users
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

drop policy if exists
  admins_manage_shipments
on public.shipments;

create policy admins_manage_shipments
on public.shipments
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

drop policy if exists
  admins_manage_events
on public.shipment_events;

create policy admins_manage_events
on public.shipment_events
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

drop policy if exists
  admins_manage_couriers
on public.couriers;

create policy admins_manage_couriers
on public.couriers
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

drop policy if exists
  admins_manage_facilities
on public.facilities;

create policy admins_manage_facilities
on public.facilities
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

drop policy if exists
  admins_manage_audit_logs
on public.audit_logs;

create policy admins_manage_audit_logs
on public.audit_logs
for all
to authenticated
using (
  public.is_admin()
)
with check (
  public.is_admin()
);

-- ============================================================
-- SAMPLE FACILITY
-- ============================================================

insert into public.facilities (
  name,
  code,
  facility_type,
  city,
  state,
  country
)
values (
  'US Courier Headquarters',
  'USC-HQ',
  'headquarters',
  'New York',
  'NY',
  'United States'
)
on conflict (code) do nothing;

-- ============================================================
-- COMPLETE
-- ============================================================