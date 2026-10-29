import type { OAuthResponse } from "@supabase/supabase-js";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

// Over an HTTPS tunnel, Expo Go would make the redirect exps://, which Supabase rejects
// (it falls back to the Site URL). Asking for exp:// keeps it on a scheme Supabase accepts;
// the browser sheet hands the URL straight back, so Expo Go never has to open it.
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** A failure Supabase reported in the redirect, with its error code (like identity_already_exists). */
export class GoogleAuthError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
  }
}

/**
 * Opens Google's page in a secure browser sheet, then swaps the one-time code it sends back
 * for a session. Resolves false if the person closed the sheet.
 * The redirect is garaj:// in the app, exp:// in Expo Go and the page URL on web; each must
 * be in Supabase's Redirect URLs list.
 */
async function runGoogleFlow(start: (redirectTo: string) => Promise<OAuthResponse>) {
  const redirectTo = Linking.createURL("/", inExpoGo ? { scheme: "exp" } : undefined);
  const { data, error } = await start(redirectTo);
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
  if (result.type !== "success") return false;

  // Supabase puts errors in the query or, for some, the fragment.
  const url = new URL(result.url);
  const params = new URLSearchParams([...url.searchParams, ...new URLSearchParams(url.hash.slice(1))]);
  const problem = params.get("error_description") ?? params.get("error");
  if (problem) throw new GoogleAuthError(problem, params.get("error_code") ?? undefined);
  const code = params.get("code");
  if (!code) throw new GoogleAuthError("Google didn't send back a sign-in code");

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return true;
}

export const signInWithGoogle = () =>
  runGoogleFlow((redirectTo) =>
    supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } })
  );

/**
 * Adds Google as a second way into the signed-in account. Needs "Allow manual linking" on in
 * Supabase. Fails with identity_already_exists if that Google account has its own Garaj account.
 */
export const linkGoogle = () =>
  runGoogleFlow((redirectTo) =>
    supabase.auth.linkIdentity({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } })
  );
