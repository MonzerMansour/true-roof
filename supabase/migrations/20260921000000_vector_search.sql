-- Vector search: shelter criteria and seeker answers as embeddings.
-- Dimension 1536 matches OpenAI text-embedding-3-small. Changing the model
-- to one with another dimension means changing vector(1536) here too.

create extension if not exists vector with schema extensions;

-- One row per listing. Public data, so anyone can read it. Only the service
-- role writes (see scripts/embed-listings.mjs).
create table if not exists public.listing_embeddings (
  listing_id uuid primary key references public.listings (id) on delete cascade,
  content text not null,
  embedding extensions.vector(1536) not null,
  model text not null,
  updated_at timestamptz not null default now()
);

-- One row per signed-in person. Answers are private: own row only.
create table if not exists public.seeker_needs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  needs jsonb not null,
  content text not null,
  embedding extensions.vector(1536) not null,
  model text not null,
  updated_at timestamptz not null default now()
);

create index if not exists listing_embeddings_embedding_idx
  on public.listing_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.listing_embeddings enable row level security;
alter table public.seeker_needs enable row level security;

drop policy if exists "public read listing embeddings" on public.listing_embeddings;
create policy "public read listing embeddings"
  on public.listing_embeddings for select to anon, authenticated using (true);

drop policy if exists "own seeker needs select" on public.seeker_needs;
create policy "own seeker needs select"
  on public.seeker_needs for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own seeker needs insert" on public.seeker_needs;
create policy "own seeker needs insert"
  on public.seeker_needs for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "own seeker needs update" on public.seeker_needs;
create policy "own seeker needs update"
  on public.seeker_needs for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own seeker needs delete" on public.seeker_needs;
create policy "own seeker needs delete"
  on public.seeker_needs for delete to authenticated using (auth.uid() = user_id);

-- Nearest published listings to a query embedding. Ranking only. Hard
-- constraints (pets, vehicle, ID) still filter in application code first.
create or replace function public.match_listings(
  query_embedding extensions.vector(1536),
  match_count integer default 10
)
returns table (listing_id uuid, similarity double precision)
language sql
stable
set search_path = public, extensions
as $$
  select
    e.listing_id,
    1 - (e.embedding <=> query_embedding) as similarity
  from public.listing_embeddings e
  join public.listings l on l.id = e.listing_id
  where l.published = true
  order by e.embedding <=> query_embedding
  limit least(match_count, 50);
$$;
