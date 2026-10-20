-- Private bucket for bill photos read by Snap a bill. Objects live at "<garage_id>/<random>.jpg"
-- (garage_of_object comes from 0002). Anyone in the garage can add a bill, since loggers add
-- records too; only owners and editors remove them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bills', 'bills', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

create policy "members read bills" on storage.objects for select
  using (bucket_id = 'bills' and is_garage_member(garage_of_object(name)));
create policy "members add bills" on storage.objects for insert
  with check (bucket_id = 'bills' and is_garage_member(garage_of_object(name)));
create policy "editors remove bills" on storage.objects for delete
  using (bucket_id = 'bills' and is_garage_member(garage_of_object(name), array['owner', 'editor']::garage_role[]));
