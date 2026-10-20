import type { ReadBill } from "./bill";
import type { LogRecord } from "./types";

// New log entries that couldn't be sent (no signal at the fuel pump) wait here, on the phone,
// and are sent again when the app is open and online. Only new entries queue: edits and deletes
// need the latest data, so they ask the person to try again instead.

export type QueuedRecord = {
  userId: string;
  record: Omit<LogRecord, "id"> & { id: string };
  servicedItemIds: string[];
  billPath?: string;
  extracted?: ReadBill;
};

const KEY = "garaj.outbox";

export function loadOutbox(): QueuedRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveOutbox(list: QueuedRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Nothing better to do: the entry still shows until the app closes.
  }
}

/** True when the request never reached Supabase, as opposed to Supabase saying no. */
export function isNetworkError(e: unknown) {
  const message = e instanceof Error || (typeof e === "object" && e !== null) ? String((e as { message?: unknown }).message) : "";
  return /network request failed|failed to fetch|load failed|network ?error|timed? ?out|aborted/i.test(message);
}

/** Random v4 uuid, made on the phone so a retried insert can't create a duplicate. */
export function newId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
