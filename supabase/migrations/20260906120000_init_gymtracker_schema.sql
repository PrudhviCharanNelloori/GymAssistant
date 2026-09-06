-- GymTracker cloud schema: profiles + user-scoped entities with RLS
-- Apply with: supabase db push   (or paste into SQL editor)

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Exercises (user_id null = global built-in; otherwise custom/user copy)
create table if not exists public.exercises (
  id text primary key,
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  description text,
  primary_muscle_group text not null,
  secondary_muscle_groups jsonb not null default '[]'::jsonb,
  equipment jsonb not null default '[]'::jsonb,
  tracking_metrics jsonb not null default '[]'::jsonb,
  instructions jsonb not null default '[]'::jsonb,
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists exercises_user_id_idx on public.exercises (user_id);
create index if not exists exercises_updated_at_idx on public.exercises (updated_at);

-- Workouts (nested exercises JSONB)
create table if not exists public.workouts (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  exercises jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists workouts_user_id_idx on public.workouts (user_id);
create index if not exists workouts_updated_at_idx on public.workouts (updated_at);

-- Workout programs (schedule JSONB)
create table if not exists public.workout_programs (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  schedule jsonb not null default '[]'::jsonb,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists workout_programs_user_id_idx on public.workout_programs (user_id);
create index if not exists workout_programs_updated_at_idx on public.workout_programs (updated_at);

-- Workout sessions (nested exercise sessions JSONB)
create table if not exists public.workout_sessions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id text not null,
  program_id text,
  started_at timestamptz not null,
  completed_at timestamptz,
  status text not null,
  exercises jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists workout_sessions_user_id_idx on public.workout_sessions (user_id);
create index if not exists workout_sessions_updated_at_idx on public.workout_sessions (updated_at);
create index if not exists workout_sessions_status_idx on public.workout_sessions (status);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

create trigger workouts_set_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();

create trigger workout_programs_set_updated_at
  before update on public.workout_programs
  for each row execute function public.set_updated_at();

create trigger workout_sessions_set_updated_at
  before update on public.workout_sessions
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'Athlete'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_programs enable row level security;
alter table public.workout_sessions enable row level security;

-- Profiles policies
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Exercises: read global built-ins + own rows; write own only
create policy "exercises_select_global_or_own"
  on public.exercises for select
  using (user_id is null or auth.uid() = user_id);

create policy "exercises_insert_own"
  on public.exercises for insert
  with check (auth.uid() = user_id);

create policy "exercises_update_own"
  on public.exercises for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "exercises_delete_own"
  on public.exercises for delete
  using (auth.uid() = user_id);

-- Workouts
create policy "workouts_select_own"
  on public.workouts for select
  using (auth.uid() = user_id);

create policy "workouts_insert_own"
  on public.workouts for insert
  with check (auth.uid() = user_id);

create policy "workouts_update_own"
  on public.workouts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workouts_delete_own"
  on public.workouts for delete
  using (auth.uid() = user_id);

-- Programs
create policy "programs_select_own"
  on public.workout_programs for select
  using (auth.uid() = user_id);

create policy "programs_insert_own"
  on public.workout_programs for insert
  with check (auth.uid() = user_id);

create policy "programs_update_own"
  on public.workout_programs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "programs_delete_own"
  on public.workout_programs for delete
  using (auth.uid() = user_id);

-- Sessions
create policy "sessions_select_own"
  on public.workout_sessions for select
  using (auth.uid() = user_id);

create policy "sessions_insert_own"
  on public.workout_sessions for insert
  with check (auth.uid() = user_id);

create policy "sessions_update_own"
  on public.workout_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sessions_delete_own"
  on public.workout_sessions for delete
  using (auth.uid() = user_id);
