import { z } from "zod";
import { isIsoDate } from "./format";
import { shrinkPhoto } from "./photos";
import { supabase } from "./supabase";
import type { RecordKind } from "./types";

// What the read-bill Edge Function returns. Checked here too: never trust a model's output blindly.
const confidence = z.enum(["high", "low"]);
const billSchema = z.object({
  readable: z.boolean(),
  kind: z.enum(["fuel", "service", "repair", "other"]).nullable(),
  title: z.string().nullable(),
  place: z.string().nullable(),
  date: z.string().nullable(),
  amount_lkr: z.number().nonnegative().nullable(),
  litres: z.number().positive().nullable(),
  odometer_km: z.number().int().positive().nullable(),
  confidence: z.object({
    kind: confidence,
    title: confidence,
    place: confidence,
    date: confidence,
    amount_lkr: confidence,
    litres: confidence,
    odometer_km: confidence,
  }),
});
export type ReadBill = z.infer<typeof billSchema>;

/** Form fields the review screen can flag for checking. */
export type DraftField = "kind" | "title" | "place" | "date" | "amount" | "litres" | "km";

/** A record form pre-filled from a bill, passed to record/edit as JSON. */
export type BillDraft = {
  billPath: string;
  extracted: ReadBill;
  kind?: RecordKind;
  title?: string;
  place?: string;
  date?: string;
  amountLkr?: number;
  litres?: number;
  odometerKm?: number;
  flagged: DraftField[];
};

export class UnreadableBill extends Error {}

/** Uploads a bill photo, has it read, and turns the result into a form draft. */
export async function readBill(garageId: string, uri: string): Promise<BillDraft> {
  const body = await (await fetch(await shrinkPhoto(uri))).arrayBuffer();
  const billPath = `${garageId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const upload = await supabase.storage.from("bills").upload(billPath, body, { contentType: "image/jpeg" });
  if (upload.error) throw upload.error;

  const { data, error } = await supabase.functions.invoke("read-bill", { body: { path: billPath } });
  if (error) throw error;
  const parsed = billSchema.safeParse(data?.bill);
  if (!parsed.success || !parsed.data.readable || parsed.data.amount_lkr === null) throw new UnreadableBill();
  const b = parsed.data;

  // Low confidence and impossible values both get flagged. Missing fields are just left empty.
  const date = b.date && isIsoDate(b.date) ? b.date : undefined;
  const flags: [DraftField, boolean][] = [
    ["kind", b.kind !== null && b.confidence.kind === "low"],
    ["title", b.title !== null && b.confidence.title === "low"],
    ["place", b.place !== null && b.confidence.place === "low"],
    ["date", (b.date !== null && !date) || (!!date && b.confidence.date === "low")],
    ["amount", b.confidence.amount_lkr === "low"],
    ["litres", b.litres !== null && b.confidence.litres === "low"],
    ["km", b.odometer_km !== null && b.confidence.odometer_km === "low"],
  ];

  return {
    billPath,
    extracted: b,
    kind: b.kind ?? undefined,
    title: b.title ?? undefined,
    place: b.place ?? undefined,
    date,
    amountLkr: b.amount_lkr ?? undefined,
    litres: b.litres ?? undefined,
    odometerKm: b.odometer_km ?? undefined,
    flagged: flags.filter(([, on]) => on).map(([f]) => f),
  };
}
