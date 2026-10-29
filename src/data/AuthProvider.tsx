import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { clearGarage } from "./garageCache";
import { saveOutbox } from "./outbox";
import { supabase } from "./supabase";

type Auth = {
  session: Session | null;
  /** True until the saved session has been read from storage, so the splash screen can wait. */
  isLoading: boolean;
  signOut: () => Promise<void>;
  /** Deletes the account and everything only this person owns, then signs out on this phone. */
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      // If storage can't be read, carry on signed out rather than hang on the splash screen.
      .finally(() => setIsLoading(false));
    // Covers sign in, sign out and token refreshes from anywhere in the app.
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      // Signing out (here, on another device's "sign out everywhere", or a revoked session)
      // removes the garage saved on this phone, so the next person never sees it.
      if (event === "SIGNED_OUT") clearGarage();
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<Auth>(
    () => ({
      session,
      isLoading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      deleteAccount: async () => {
        const { error } = await supabase.functions.invoke("delete-account", { method: "POST" });
        if (error) throw error;
        // Nothing of theirs should stay behind on this phone either.
        saveOutbox([]);
        if (Platform.OS !== "web") await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
        // The account is gone on the server, so only the local session needs clearing.
        await supabase.auth.signOut({ scope: "local" });
      },
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside <AuthProvider>");
  return auth;
}
