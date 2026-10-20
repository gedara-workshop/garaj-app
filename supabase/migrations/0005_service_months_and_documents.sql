-- Time-based service intervals: mechanics say "5,000 km or 6 months", whichever comes first.
-- Both columns are optional, so km-only items keep working as before.
alter table service_items
  add column interval_months smallint check (interval_months between 1 and 60),
  add column last_done_on date;

-- Private bucket for photos of renewal documents (revenue license, insurance card, emission
-- certificate), stored at "<garage_id>/<renewal_id>-<timestamp>.jpg" in renewals.document_path.
-- Same rules as vehicle photos: members see them, owners and editors change them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

create policy "members read documents" on storage.objects for select
  using (bucket_id = 'documents' and is_garage_member(garage_of_object(name)));
create policy "editors add documents" on storage.objects for insert
  with check (bucket_id = 'documents' and is_garage_member(garage_of_object(name), array['owner', 'editor']::garage_role[]));
create policy "editors replace documents" on storage.objects for update
  using (bucket_id = 'documents' and is_garage_member(garage_of_object(name), array['owner', 'editor']::garage_role[]));
create policy "editors remove documents" on storage.objects for delete
  using (bucket_id = 'documents' and is_garage_member(garage_of_object(name), array['owner', 'editor']::garage_role[]));
