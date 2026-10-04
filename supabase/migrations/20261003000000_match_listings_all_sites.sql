-- match_listings() used to return at most 50 sites. There are 92 published
-- CA-500 sites, so the rest never got a similarity score: no match percent,
-- no developer analytics, and always sorted last. Raise the cap to 500.
-- Same signature, so `create or replace` keeps the existing grants.

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
  limit least(greatest(match_count, 0), 500);
$$;
