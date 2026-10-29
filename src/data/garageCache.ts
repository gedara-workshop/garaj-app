// The last garage that loaded, kept on the phone so Garaj opens with no signal: at the fuel
// pump, in a basement car park, or out of data. One person at a time; cleared on sign out.
// Photos still show offline because expo-image caches them on disk by object path.

const KEY = "garaj.garage";

type Saved<T> = { userId: string; savedAt: number; data: T };

export function loadGarage<T>(userId: string): { data: T; savedAt: number } | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Saved<T> | null;
    return saved?.userId === userId ? { data: saved.data, savedAt: saved.savedAt } : undefined;
  } catch {
    return undefined;
  }
}

export function saveGarage<T>(userId: string, data: T, savedAt: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ userId, savedAt, data } satisfies Saved<T>));
  } catch {
    // Storage full or unavailable: the app still works online, it just won't open offline.
  }
}

export function clearGarage() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing else to do.
  }
}
