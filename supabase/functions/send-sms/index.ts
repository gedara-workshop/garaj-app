// Supabase Auth "Send SMS" hook: Supabase calls this instead of a built-in SMS provider,
// and it sends the sign-in code through Text.lk, a Sri Lankan SMS gateway.
// Deploy with JWT checks off (Supabase Auth signs the request itself, verified below):
//   npx supabase functions deploy send-sms --no-verify-jwt
// Secrets: SEND_SMS_HOOK_SECRET (from Authentication > Hooks), TEXTLK_API_TOKEN, TEXTLK_SENDER_ID.
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const TEXTLK_URL = "https://app.text.lk/api/v3/sms/send";

type HookPayload = { user: { phone: string }; sms: { otp: string } };

const fail = (status: number, message: string) =>
  new Response(JSON.stringify({ error: { http_code: status, message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET");
  const token = Deno.env.get("TEXTLK_API_TOKEN");
  const senderId = Deno.env.get("TEXTLK_SENDER_ID");
  if (!hookSecret || !token || !senderId) return fail(500, "send-sms is missing a secret");

  // Only Supabase Auth can call this: it signs every request with the hook secret.
  let payload: HookPayload;
  try {
    const wh = new Webhook(hookSecret.replace("v1,whsec_", ""));
    payload = wh.verify(await req.text(), Object.fromEntries(req.headers)) as HookPayload;
  } catch {
    return fail(401, "Invalid hook signature");
  }

  // Supabase sends "+94771234567"; Text.lk wants "94771234567".
  const recipient = payload.user.phone.replace(/\D/g, "");
  const message = `Your Garaj code is ${payload.sms.otp}. Don't share it with anyone.`;

  try {
    const res = await fetch(TEXTLK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ recipient, sender_id: senderId, type: "plain", message }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || body?.status !== "success") {
      // Log Text.lk's reason (never the code) so failures show up in the function logs.
      console.error("Text.lk send failed", res.status, body?.message);
      return fail(502, "Could not send the SMS");
    }
  } catch (err) {
    console.error("Text.lk unreachable", err);
    return fail(502, "Could not send the SMS");
  }

  return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
});
