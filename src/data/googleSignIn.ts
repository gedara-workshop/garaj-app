import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

// Over an HTTPS tunnel, Expo Go would make the redirect exps://, which Supabase rejects
// (it falls back to the Site URL). Asking for exp:// keeps it on a scheme Supabase accepts;
// the browser sheet hands the URL straight back, so Expo Go never has to open it.
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Opens Google's sign-in page in a secure browser sheet, then swaps the one-time code it
 * sends back for a session. Resolves false if the person closed the sheet.
 * The redirect is garaj:// in the app, exp:// in Expo Go and the page URL on web; each must
 * be in Supabase's Redirect URLs list.
 */
export async function signInWithGoogle() {
  const redirectTo = Linking.createURL("/", inExpoGo ? { scheme: "exp" } : undefined);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return false;

  const params = new URL(result.url).searchParams;
  const problem = params.get("error_description") ?? params.get("error");
  if (problem) throw new Error(problem);
  const code = params.get("code");
  if (!code) throw new Error("Google didn't send back a sign-in code");

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return true;
}
