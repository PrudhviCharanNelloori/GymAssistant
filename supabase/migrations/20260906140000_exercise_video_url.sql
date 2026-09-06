-- Optional external form guide URL (YouTube, etc.) — not hosted media
alter table public.exercises
  add column if not exists video_url text;
