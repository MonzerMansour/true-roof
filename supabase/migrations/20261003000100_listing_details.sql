-- Two things site staff can now add in the portal:
--   description: the site's own words, separate from organizations.description
--     (which covers every site an org runs). Shown on the site's card and page,
--     and part of the site's embedding text. Free text describes the place; it
--     is never a category.
--   photo_url: a photo of the site, uploaded to the public "site-photos"
--     Storage bucket. Replaces the stock photo on the card, page, and homepage.

alter table public.listings
  add column if not exists description text,
  add column if not exists photo_url text;

alter table public.listings
  drop constraint if exists listings_description_length;
alter table public.listings
  add constraint listings_description_length
  check (description is null or char_length(description) <= 1000);

alter table public.listings
  drop constraint if exists listings_photo_url_https;
alter table public.listings
  add constraint listings_photo_url_https
  check (photo_url is null or photo_url like 'https://%');
