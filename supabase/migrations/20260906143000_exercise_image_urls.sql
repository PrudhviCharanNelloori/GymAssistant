-- Optional illustration paths (local /assets or remote) for exercises
alter table public.exercises
  add column if not exists image_url text;

alter table public.exercises
  add column if not exists image_start_url text;
