// Snap a bill: reads a bill photo the app uploaded to the "bills" bucket and returns the entry
// fields with a confidence for each. The app checks the result and flags low-confidence fields.
// Deploy with JWT checks on (the default), so only signed-in people can call it:
//   npx supabase functions deploy read-bill --project-ref dtxhezxengwkjyktaxxm
// Secrets: OPENAI_API_KEY, and optionally OPENAI_MODEL (defaults to gpt-5.4-mini).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.3";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const FIELDS = ["kind", "title", "place", "date", "amount_lkr", "litres", "odometer_km"] as const;

const nullable = (type: string) => ({ type: [type, "null"] });

// Strict JSON schema: OpenAI only returns objects that match it exactly.
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["readable", ...FIELDS, "confidence"],
  properties: {
    readable: { type: "boolean" },
    kind: { type: ["string", "null"], enum: ["fuel", "service", "repair", "other", null] },
    title: nullable("string"),
    place: nullable("string"),
    date: nullable("string"),
    amount_lkr: nullable("number"),
    litres: nullable("number"),
    odometer_km: nullable("integer"),
    confidence: {
      type: "object",
      additionalProperties: false,
      required: [...FIELDS],
      properties: Object.fromEntries(FIELDS.map((f) => [f, { type: "string", enum: ["high", "low"] }])),
    },
  },
};

const instructions = `You read photos of vehicle bills from Sri Lanka: fuel station receipts, service and repair invoices, tyre shops, car washes.
Return the fields for one log entry:
- readable: false if the photo is not a bill, or too blurry or dark to read the total. Then set every other field to null.
- kind: fuel, service (routine servicing, oil change), repair (fixing or replacing parts, tyres), or other.
- title: a short plain description, like "Full service", "Oil change", "Two tyres replaced". For fuel, the fuel type, like "Petrol 92".
- place: the shop or station's town, or its name if there is no town. Short.
- date: YYYY-MM-DD. Sri Lankan bills write the day first, so 05/10/2026 is 2026-10-05.
- amount_lkr: the final total paid in rupees, as a number, after any discount.
- litres: fuel quantity in litres, for fuel bills only.
- odometer_km: the vehicle's odometer reading if printed (often on service invoices as "Mileage" or "ODO").
Use null for anything not on the bill. Never guess a number. Set a field's confidence to "low" if the text is unclear, cut off, handwritten and hard to read, or you had to infer it.`;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json(500, { error: "read-bill is missing OPENAI_API_KEY" });

  let path: unknown;
  try {
    ({ path } = await req.json());
  } catch {
    return json(400, { error: "Send { path }" });
  }
  if (typeof path !== "string" || !path) return json(400, { error: "Send { path }" });

  // Download as the caller, so storage policies decide whether this bill is theirs to read.
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: file, error } = await supabase.storage.from("bills").download(path);
  if (error || !file) return json(404, { error: "Bill not found" });

  const image = encodeBase64(new Uint8Array(await file.arrayBuffer()));
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") ?? "gpt-5.4-mini",
      reasoning_effort: "low",
      response_format: { type: "json_schema", json_schema: { name: "bill", strict: true, schema } },
      messages: [
        { role: "system", content: instructions },
        {
          role: "user",
          content: [
            { type: "text", text: "Read this bill." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    console.error("OpenAI error", res.status, await res.text());
    return json(502, { error: "Couldn't read the bill right now" });
  }

  const completion = await res.json();
  const content = completion.choices?.[0]?.message?.content;
  try {
    return json(200, { bill: JSON.parse(content) });
  } catch {
    console.error("Unparseable reply", content);
    return json(502, { error: "Couldn't read the bill right now" });
  }
});
