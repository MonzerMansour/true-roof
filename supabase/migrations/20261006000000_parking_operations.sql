-- What a safe parking lot is actually like to use.
--
-- Operators publish these and people ask them first: does it cost anything,
-- what paperwork do I need, is there a toilet, is anyone watching the lot, how
-- long can I stay, is there a queue. Until now they could only be written into
-- the free-text vehicle_note, where nothing could filter or compare them.
--
-- Deliberately NOT enums. Unlike pets or curfew, these vary too much between
-- operators to flatten into preset values without losing the thing that
-- matters: "free, it is temporary shelter not a rental" and "no fee but a
-- deposit" are both "free" to an enum. They are short published facts, quoted
-- from the operator, and the matcher does not read them. The enums-only rule
-- is about categories the matcher compares; these are descriptions a person
-- reads.
--
-- requires_documents is the exception and is an array, because "what do I have
-- to bring" is a checklist a person works through one item at a time.
--
-- Null means the operator does not publish it, as everywhere else in this
-- schema. It never means no.

alter table public.listings
  add column if not exists cost_note text,
  add column if not exists screening_note text,
  add column if not exists requires_documents text[],
  add column if not exists facilities_note text,
  add column if not exists security_note text,
  add column if not exists max_stay_note text,
  add column if not exists waitlist_note text,
  add column if not exists pets_note text;

-- Keep them short enough to read on a phone. An operator pasting three
-- paragraphs into a card is a worse outcome than a truncated fact.
alter table public.listings drop constraint if exists listings_operations_length_check;
alter table public.listings
  add constraint listings_operations_length_check
  check (
    coalesce(length(cost_note), 0) <= 400
    and coalesce(length(screening_note), 0) <= 600
    and coalesce(length(facilities_note), 0) <= 400
    and coalesce(length(security_note), 0) <= 400
    and coalesce(length(max_stay_note), 0) <= 400
    and coalesce(length(waitlist_note), 0) <= 400
    and coalesce(length(pets_note), 0) <= 400
  );

-- A document checklist with an empty string in it renders a blank row with a
-- tick next to it, which reads as a requirement nobody can satisfy.
alter table public.listings drop constraint if exists listings_documents_check;
alter table public.listings
  add constraint listings_documents_check
  check (
    requires_documents is null
    or (
      array_length(requires_documents, 1) between 1 and 12
      and array_position(requires_documents, null) is null
      and array_position(requires_documents, '') is null
    )
  );
