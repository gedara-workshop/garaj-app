import { translate } from "@/i18n";
import type { StringKey } from "@/i18n/en";

// Plain words for the errors people can actually hit while signing in or adding a sign-in method.
const messages: Record<string, StringKey> = {
  otp_expired: "auth.otpExpired",
  over_sms_send_rate_limit: "auth.tooManyCodes",
  over_request_rate_limit: "auth.tooManyTries",
  sms_send_failed: "auth.smsFailed",
  phone_provider_disabled: "auth.phoneDisabled",
  validation_failed: "auth.checkNumber",
  phone_exists: "auth.phoneTaken",
  identity_already_exists: "auth.googleTaken",
  manual_linking_disabled: "auth.linkingOff",
};

/** Takes an AuthError, a GoogleAuthError or anything else thrown; unknown ones get the generic message. */
export const authErrorMessage = (error: unknown) => {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : undefined;
  return translate((code && messages[code]) || "auth.generic");
};
