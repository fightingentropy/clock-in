create extension if not exists "uuid-ossp";

create type if not exists user_role as enum ('admin', 'worker');

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists user_profiles (
  user_id text primary key,
  email text not null unique,
  full_name text,
  phone text,
  role user_role not null default 'worker',
  avatar_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_user_profiles_updated_at
before update on user_profiles
for each row execute function set_updated_at();

create table if not exists workplaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  radius_m integer not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_workplaces_updated_at
before update on workplaces
for each row execute function set_updated_at();

create table if not exists worker_assignments (
  id uuid primary key default uuid_generate_v4(),
  worker_id text not null references user_profiles(user_id) on delete cascade,
  workplace_id uuid not null references workplaces(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique(worker_id, workplace_id)
);

create table if not exists time_entries (
  id uuid primary key default uuid_generate_v4(),
  worker_id text not null references user_profiles(user_id) on delete cascade,
  workplace_id uuid references workplaces(id) on delete set null,
  clock_in_at timestamptz not null,
  clock_out_at timestamptz,
  created_by text references user_profiles(user_id),
  method text not null default 'self',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_time_entries_worker_clock_in on time_entries(worker_id, clock_in_at desc);
create index if not exists idx_assignments_worker on worker_assignments(worker_id);
create index if not exists idx_assignments_workplace on worker_assignments(workplace_id);
