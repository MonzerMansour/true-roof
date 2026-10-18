-- Deleting a site.
--
-- public.listings has policies for select, insert and update and never had one
-- for delete, so until now nobody could remove a site at all: not a manager,
-- not a director, not even through the portal that created it. Somebody who
-- added a site by mistake could only unpublish it and leave it sitting there.
--
-- Deliberately an RPC rather than a delete policy. Everything that points at a
-- listing cascades, so one delete also takes the requests people sent, the
-- reviews they wrote, the embedding, the access code and anybody's shared
-- access. That is a bigger thing than editing opening hours and it should run
-- in one place with one set of checks, not wherever a client happens to issue
-- a DELETE.

create or replace function public.delete_listing(p_listing_id uuid)
returns table (
  listing_name text,
  requests_removed integer,
  reviews_removed integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_name text;
  v_requests integer;
  v_reviews integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select l.organization_id, l.name into v_org, v_name
  from public.listings l where l.id = p_listing_id;

  if v_org is null then
    raise exception 'Site not found';
  end if;

  -- Director of the organization that owns it, and nobody else. A manager can
  -- edit a site; removing it is not the same kind of act. Somebody let in with
  -- the site's own code is not an owner at all and must never be able to
  -- delete what they were invited to help with.
  if not public.is_org_director(v_org) then
    raise exception 'Only a director of the organization that runs this site can delete it';
  end if;

  select count(*) into v_requests
  from public.listing_interest i
  where i.listing_id = p_listing_id and i.status = 'active';

  select count(*) into v_reviews
  from public.listing_reviews r
  where r.listing_id = p_listing_id;

  -- Everything referencing the listing is on delete cascade, so this is the
  -- whole deletion.
  delete from public.listings where id = p_listing_id;

  return query select v_name, v_requests, v_reviews;
end;
$$;

grant execute on function public.delete_listing(uuid) to authenticated;
