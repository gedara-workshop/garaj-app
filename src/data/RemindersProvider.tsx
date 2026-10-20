import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState, Linking, Platform } from "react-native";
import { vehicleName } from "@/components/VehicleCard";
import { formatDate } from "./format";
import { useGarage } from "./GarageProvider";
import {
  defaultReminderSettings,
  planReminders,
  renewalLabel,
  type PlannedReminder,
  type ReminderSettings,
} from "./rules";

// Renewal reminders are local notifications scheduled on this phone from the renewal dates in
// Supabase. They are rebuilt whenever the dates or settings change, and on every launch, so a
// reinstall or a new phone gets them back as soon as the garage loads.

/** The web build can't schedule notifications, so reminders are phone only. */
export const remindersSupported = Platform.OS !== "web";

type Permission = "granted" | "denied" | "undetermined";

type Reminders = {
  settings: ReminderSettings;
  setSettings: (s: ReminderSettings) => void;
  permission: Permission;
  /** Shows the system prompt, or opens Settings if it was turned down before. */
  turnOn: () => Promise<void>;
  /** "Not now" on the Turn on reminders screen: don't show it again by itself. */
  promptDismissed: boolean;
  dismissPrompt: () => void;
};

const SETTINGS_KEY = "garaj.reminders.settings";
const DISMISSED_KEY = "garaj.reminders.promptDismissed";
const CHANNEL = "reminders";

// localStorage comes from expo-sqlite (installed in supabase.ts) and persists on the phone.
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Settings are a convenience: if storage fails they reset to defaults next launch.
  }
}

if (remindersSupported) {
  // Show reminders even while the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** "Revenue license due in 30 days" / "Revenue license expires today". Says the number, not the feeling. */
function content(r: PlannedReminder): Notifications.NotificationContentInput {
  const what = renewalLabel[r.renewal.kind];
  const plate = [r.vehicle.province, r.vehicle.plate].filter(Boolean).join(" ");
  return {
    title:
      r.daysBefore === 0
        ? `${what} ${r.renewal.kind === "insurance" ? "renews" : "expires"} today`
        : `${what} due in ${r.daysBefore} days`,
    body: `${vehicleName(r.vehicle)} (${plate}), ${formatDate(r.renewal.expiresOn)}`,
    data: { vehicleId: r.vehicle.id },
  };
}

async function reschedule(plan: PlannedReminder[]) {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Renewal reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  // Garaj schedules nothing else, so starting from a clean slate is safe.
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of plan) {
    await Notifications.scheduleNotificationAsync({
      content: content(r),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL },
    });
  }
}

const RemindersContext = createContext<Reminders | null>(null);

export function RemindersProvider({ children }: { children: ReactNode }) {
  const { vehicles, renewals, isLoading } = useGarage();
  const [settings, setSettingsState] = useState(() => load(SETTINGS_KEY, defaultReminderSettings));
  const [promptDismissed, setPromptDismissed] = useState(() => load(DISMISSED_KEY, { value: false }).value);
  const [permission, setPermission] = useState<Permission>("undetermined");

  // Checked on launch and whenever the app comes back, since reminders can be turned on in Settings.
  useEffect(() => {
    if (!remindersSupported) return;
    const check = () => Notifications.getPermissionsAsync().then((p) => setPermission(p.status as Permission));
    check();
    const sub = AppState.addEventListener("change", (state) => state === "active" && check());
    return () => sub.remove();
  }, []);

  // Tapping a reminder opens that vehicle, whether the app was running or started by the tap.
  useEffect(() => {
    if (!remindersSupported || isLoading) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const vehicleId = response?.notification.request.content.data?.vehicleId;
      if (typeof vehicleId === "string") router.push({ pathname: "/vehicle/[id]", params: { id: vehicleId } });
    };
    Notifications.getLastNotificationResponseAsync().then((r) => {
      open(r);
      Notifications.clearLastNotificationResponseAsync();
    });
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [isLoading]);

  // Rebuild the schedule from the garage whenever anything it depends on changes.
  useEffect(() => {
    if (!remindersSupported || isLoading || permission !== "granted") return;
    reschedule(planReminders(vehicles, renewals, settings)).catch((e) => console.warn("Reminders not scheduled", e));
  }, [vehicles, renewals, settings, permission, isLoading]);

  const setSettings = useCallback((s: ReminderSettings) => {
    setSettingsState(s);
    save(SETTINGS_KEY, s);
  }, []);

  const turnOn = useCallback(async () => {
    if (!remindersSupported) return;
    const current = await Notifications.getPermissionsAsync();
    if (current.status === "denied" && !current.canAskAgain) {
      await Linking.openSettings();
      return;
    }
    const next = await Notifications.requestPermissionsAsync();
    setPermission(next.status as Permission);
  }, []);

  const dismissPrompt = useCallback(() => {
    setPromptDismissed(true);
    save(DISMISSED_KEY, { value: true });
  }, []);

  const value = useMemo(
    () => ({ settings, setSettings, permission, turnOn, promptDismissed, dismissPrompt }),
    [settings, setSettings, permission, turnOn, promptDismissed, dismissPrompt]
  );

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders() {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error("useReminders must be used inside RemindersProvider");
  return ctx;
}
