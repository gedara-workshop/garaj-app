import type { AuthError } from "@supabase/supabase-js";
import { translate } from "@/i18n";
import type { StringKey } from "@/i18n/en";

// Plain words for the errors people can actually hit while signing in.
const messages: Record<string, StringKey> = {
  otp_expired: "auth.otpExpired",
  over_sms_send_rate_limit: "auth.tooManyCodes",
  over_request_rate_limit: "auth.tooManyTries",
  sms_send_failed: "auth.smsFailed",
  phone_provider_disabled: "auth.phoneDisabled",
  validation_failed: "auth.checkNumber",
};

export const authErrorMessage = (error: AuthError) =>
  translate((error.code && messages[error.code]) || "auth.generic");
