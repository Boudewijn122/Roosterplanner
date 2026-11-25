-- Verbeterpunten uit de app. Plak dit in Supabase → SQL Editor → Run.
create table if not exists public.feedback (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  kind        text not null check (kind in ('Verbetering','Fout','Vraag','Anders')),
  subject     text not null check (char_length(subject) between 1 and 80),
  body        text not null check (char_length(body) between 1 and 2000),
  real_name   text check (char_length(real_name) <= 60),
  account     text check (char_length(account) <= 80),
  app_version text check (char_length(app_version) <= 40),
  device      text check (char_length(device) <= 200),
  synced      boolean not null default false
);

alter table public.feedback enable row level security;

-- De app (anon key) mag alleen toevoegen, niet lezen, wijzigen of verwijderen.
drop policy if exists "app mag feedback toevoegen" on public.feedback;
create policy "app mag feedback toevoegen" on public.feedback
  for insert to anon with check (synced = false);
