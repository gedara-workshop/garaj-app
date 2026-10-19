import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { supabase } from "./supabase";

const BUCKET = "vehicle-photos";
const MAX_WIDTH = 1200;
/** Signed photo links last a day; the garage refetches long before that. */
const LINK_SECONDS = 60 * 60 * 24;

/** Phone photos are 3 to 5 MB. A 1200px JPEG is a few hundred KB and still looks sharp on the card. */
async function shrink(uri: string) {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const image =
    original.width > MAX_WIDTH ? await ImageManipulator.manipulate(uri).resize({ width: MAX_WIDTH }).renderAsync() : original;
  const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  return saved.uri;
}

/** Uploads a picked photo and returns its object path. A new path each time, so cached images never go stale. */
export async function uploadVehiclePhoto(garageId: string, vehicleId: string, uri: string) {
  const body = await (await fetch(await shrink(uri))).arrayBuffer();
  const path = `${garageId}/${vehicleId}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}

/** Object path -> signed link. Photos that can't be signed are left out and show the body-type icon. */
export async function signPhotoPaths(paths: string[]) {
  if (paths.length === 0) return new Map<string, string>();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, LINK_SECONDS);
  return new Map((data ?? []).flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])));
}
