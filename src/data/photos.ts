import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { supabase } from "./supabase";

const MAX_WIDTH = 1200;
/** Signed photo links last a day; the garage refetches long before that. */
const LINK_SECONDS = 60 * 60 * 24;

/** Phone photos are 3 to 5 MB. A 1200px JPEG is a few hundred KB, still sharp on a card and readable on a bill. */
export async function shrinkPhoto(uri: string) {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const image =
    original.width > MAX_WIDTH ? await ImageManipulator.manipulate(uri).resize({ width: MAX_WIDTH }).renderAsync() : original;
  const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  return saved.uri;
}

type Bucket = "vehicle-photos" | "documents";

/**
 * Uploads a picked photo as "<garageId>/<ownerId>-<timestamp>.jpg" and returns that object path.
 * A new path each time, so a cached image never goes stale.
 */
async function uploadPhoto(bucket: Bucket, garageId: string, ownerId: string, uri: string) {
  const body = await (await fetch(await shrinkPhoto(uri))).arrayBuffer();
  const path = `${garageId}/${ownerId}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}

/** Best effort: a leftover photo only costs a little storage, so failures are ignored. */
async function removePhoto(bucket: Bucket, path?: string) {
  if (path) await supabase.storage.from(bucket).remove([path]).catch(() => undefined);
}

/** Object path -> signed link. Photos that can't be signed are left out. */
async function signPaths(bucket: Bucket, paths: string[]) {
  if (paths.length === 0) return new Map<string, string>();
  const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, LINK_SECONDS);
  return new Map((data ?? []).flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])));
}

export const uploadVehiclePhoto = (garageId: string, vehicleId: string, uri: string) =>
  uploadPhoto("vehicle-photos", garageId, vehicleId, uri);
export const removeVehiclePhoto = (path?: string) => removePhoto("vehicle-photos", path);
/** Vehicles without a signed photo show the body-type icon instead. */
export const signPhotoPaths = (paths: string[]) => signPaths("vehicle-photos", paths);

/** Photos of renewal documents: revenue license, insurance card, emission certificate. */
export const uploadDocument = (garageId: string, renewalId: string, uri: string) =>
  uploadPhoto("documents", garageId, renewalId, uri);
export const removeDocument = (path?: string) => removePhoto("documents", path);
export const signDocumentPaths = (paths: string[]) => signPaths("documents", paths);
