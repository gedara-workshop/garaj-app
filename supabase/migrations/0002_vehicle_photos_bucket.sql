-- Private bucket for vehicle photos. Objects live at "<garage_id>/<vehicle_id>-<timestamp>.jpg",
-- so the first folder says which garage a photo belongs to and policies can check membership.
-- The app shrinks photos to about 1200px wide JPEGs before upload, so 5 MB is plenty.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-photos', 'vehicle-photos', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

-- The garage id from an object path, or null if the first folder isn't a uuid.
create function garage_of_object(object_name text)
returns uuid
language sql
immutable
as $$
  select case
    when (storage.foldername(object_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then ((storage.foldername(object_name))[1])::uuid
  end;
$$;

-- Members see photos; owners and editors add, replace and remove them, same as vehicles.
create policy "members read vehicle photos" on storage.objects for select
  using (bucket_id = 'vehicle-photos' and is_garage_member(garage_of_object(name)));
create policy "editors add vehicle photos" on storage.objects for insert
  with check (bucket_id = 'vehicle-photos' and is_garage_member(garage_of_object(name), array['owner', 'editor']::garage_role[]));
create policy "editors replace vehicle photos" on storage.objects for update
  using (bucket_id = 'vehicle-photos' and is_garage_member(garage_of_object(name), array['owner', 'editor']::garage_role[]));
create policy "editors remove vehicle photos" on storage.objects for delete
  using (bucket_id = 'vehicle-photos' and is_garage_member(garage_of_object(name), array['owner', 'editor']::garage_role[]));
