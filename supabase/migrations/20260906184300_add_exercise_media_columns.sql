-- Media fields used by exercise sync payloads
alter table public.exercises
  add column if not exists video_url text,
  add column if not exists image_url text,
  add column if not exists image_start_url text;
