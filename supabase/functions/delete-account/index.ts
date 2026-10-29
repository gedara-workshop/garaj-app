// Deletes the signed-in person's account, as Google Play requires for apps with sign in.
// Garages they own alone are deleted with everything in them (vehicles, renewals, service items,
// records, and their photos, bills and documents in storage). In a garage someone else also
// owns, only their membership goes. Then the sign-in itself is deleted.
// Deploy with JWT checks on (the default), so only a signed-in person can delete themselves:
//   npx supabase functions deploy delete-account --project-ref dtxhezxengwkjyktaxxm
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.3";

const BUCKETS = ["vehicle-photos", "bills", "documents"];

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "POST only" });
  const url = Deno.env.get("SUPABASE_URL")!;

  // Who is asking: read from their own token, never from the request body.
  const asCaller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: who, error: whoError } = await asCaller.auth.getUser();
  if (whoError || !who.user) return json(401, { error: "Not signed in" });
  const userId = who.user.id;

  // The service key bypasses row level security; it lives only in Edge Function secrets.
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: memberships, error: memberError } = await admin
    .from("garage_members")
    .select("garage_id, role")
    .eq("user_id", userId);
  if (memberError) return json(500, { error: "Couldn't read garages" });

  for (const m of memberships ?? []) {
    if (m.role === "owner") {
      const { count } = await admin
        .from("garage_members")
        .select("*", { count: "exact", head: true })
        .eq("garage_id", m.garage_id)
        .eq("role", "owner")
        .neq("user_id", userId);
      if (!count) {
        // Sole owner: remove the garage's files, then the garage (everything else cascades).
        for (const bucket of BUCKETS) await removeFolder(admin, bucket, m.garage_id);
        const { error } = await admin.from("garages").delete().eq("id", m.garage_id);
        if (error) return json(500, { error: "Couldn't delete a garage" });
        continue;
      }
    }
    await admin.from("garage_members").delete().eq("garage_id", m.garage_id).eq("user_id", userId);
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return json(500, { error: "Couldn't delete the sign-in" });
  return json(200, { deleted: true });
});

/** Every object under "<garageId>/" in a bucket, removed page by page. */
async function removeFolder(admin: ReturnType<typeof createClient>, bucket: string, garageId: string) {
  for (;;) {
    const { data } = await admin.storage.from(bucket).list(garageId, { limit: 1000 });
    if (!data?.length) return;
    const { error } = await admin.storage.from(bucket).remove(data.map((o) => `${garageId}/${o.name}`));
    if (error) return; // Leftover files only cost storage; don't block the account deletion.
  }
}
