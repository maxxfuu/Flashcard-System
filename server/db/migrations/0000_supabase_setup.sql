-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor).
-- Drizzle manages the application tables; this file handles Supabase-specific
-- plumbing that Drizzle cannot generate: the auth trigger and RLS policies.

-- ─────────────────────────────────────────────────────────────────
-- 1. Trigger: auto-create a profiles row on OAuth signup
-- ─────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────
-- 2. Row Level Security
-- ─────────────────────────────────────────────────────────────────

-- profiles
alter table public.profiles enable row level security;
create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- decks
alter table public.decks enable row level security;
create policy "Users can manage their own decks"
  on public.decks for all
  using (auth.uid() = user_id);

-- cards — accessible if you own the parent deck
alter table public.cards enable row level security;
create policy "Users can manage cards in their decks"
  on public.cards for all
  using (
    exists (
      select 1 from public.decks
      where decks.id = cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

-- card_progress — each user only sees their own progress
alter table public.card_progress enable row level security;
create policy "Users can manage their own card progress"
  on public.card_progress for all
  using (auth.uid() = user_id);
