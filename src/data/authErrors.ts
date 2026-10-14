import type { AuthError } from "@supabase/supabase-js";

// Plain words for the errors people can actually hit while signing in.
const messages: Record<string, string> = {
  otp_expired: "That code didn't work or has expired. Check it, or get a new one.",
  over_sms_send_rate_limit: "Too many codes sent. Wait a minute, then try again.",
  over_request_rate_limit: "Too many tries. Wait a minute, then try again.",
  sms_send_failed: "We couldn't send the SMS. Check the number and try again.",
  phone_provider_disabled: "Phone sign in isn't switched on yet.",
  validation_failed: "Check the number and try again.",
};

export const authErrorMessage = (error: AuthError) =>
  (error.code && messages[error.code]) || "Something went wrong. Check your connection and try again.";
