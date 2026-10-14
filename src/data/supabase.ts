import "expo-sqlite/localStorage/install";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

// Expo inlines EXPO_PUBLIC_ variables at build time, so they must be read by their full name.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Supabase is not configured. Copy .env.example to .env.local, fill it in, then restart Expo."
  );
}

// The session lives in expo-sqlite's localStorage so people stay signed in between launches.
// There is no URL to read a session from on a phone, hence detectSessionInUrl: false.
export const supabase = createClient(url, key, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh the session only while the app is open, so it doesn't run in the background.
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
