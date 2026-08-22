/**
 * The schedule itself: reading the declared settings into the two slots,
 * deciding which one a moment belongs to, and saying how long until the next
 * change.
 *
 * Pure on purpose — no ctx, no clock of its own. Everything here is a
 * function of the settings object and a minute-of-day, which is what makes
 * midnight wrap-around and half-configured forms testable rather than
 * hopeful.
 */

/** The value that means "leave this surface alone". */
export const KEEP = "keep";

/** The two slots a day has here: light hours and dark hours. */
export const SLOT_IDS = ["day", "night"] as const;
export type SlotId = (typeof SLOT_IDS)[number];

export type Settings = Record<string, unknown>;

/**
 * The declared defaults, mirroring the `value` of each field in
 * manifest.json.
 *
 * They have to exist twice: the manifest's copy is what the settings form
 * shows, but the stored settings object does not exist at all until the user
 * saves that form — and a schedule that does nothing until someone opens its
 * settings page is a schedule that looks broken. A stored key always wins.
 */
export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  dayTime: "07:00",
  dayApp: "light",
  dayReader: "warm",
  nightTime: "19:00",
  nightApp: "dark",
  nightReader: "dark",
};

export function withDefaults(stored: Settings | null | undefined): Settings {
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

export type Slot = {
  id: SlotId;
  /** Minute of the day the slot starts at, 0–1439. */
  startsAt: number;
  /** `HH:MM`, normalized — what the plugin shows back to the user. */
  label: string;
  /** A theme value for that surface, or KEEP. */
  app: string;
  reader: string;
};

/**
 * A stored start time. The host's `time` field always writes 24-hour
 * `HH:MM`, but a settings object can also arrive from the reading agent or
 * an older version of this plugin, so the parse stays tolerant of the shapes
 * a person types — and refuses everything else rather than defaulting a typo
 * to midnight.
 */
export function parseTimeOfDay(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  const match = /^(\d{1,2})(?:\s*[:：.]\s*(\d{1,2}))?$/.exec(text);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = match[2] === undefined ? 0 : Number(match[2]);
  if (!Number.isInteger(hours) || hours > 23) return null;
  if (!Number.isInteger(minutes) || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** `HH:MM` for a minute-of-day. */
export function formatTimeOfDay(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function themeValue(raw: unknown): string {
  return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : KEEP;
}

/**
 * The two slots, earliest first. A slot drops out when its start time is
 * unusable or when it would change nothing; two slots that start at the same
 * minute collapse to the day one, since a single moment cannot begin both.
 */
export function readSlots(settings: Settings): Slot[] {
  const slots: Slot[] = [];
  for (const id of SLOT_IDS) {
    const startsAt = parseTimeOfDay(settings[`${id}Time`]);
    if (startsAt === null) continue;
    if (slots.some((slot) => slot.startsAt === startsAt)) continue;
    const app = themeValue(settings[`${id}App`]);
    const reader = themeValue(settings[`${id}Reader`]);
    if (app === KEEP && reader === KEEP) continue;
    slots.push({ id, startsAt, label: formatTimeOfDay(startsAt), app, reader });
  }
  return slots.sort((left, right) => left.startsAt - right.startsAt);
}

/**
 * The slot in force at `minuteOfDay`: the latest one that has already
 * started, or — before the first start of the day — the other one, which has
 * been running since yesterday. That wrap is the whole point of a day being
 * a cycle: with day at 07:00 and night at 19:00, 02:00 is still night.
 */
export function activeSlot(slots: readonly Slot[], minuteOfDay: number): Slot | null {
  if (slots.length === 0) return null;
  let current = slots[slots.length - 1];
  for (const slot of slots) {
    if (slot.startsAt <= minuteOfDay) current = slot;
    else break;
  }
  return current;
}

/** Minutes until the next slot starts; a full day when only one is usable. */
export function minutesUntilNextSlot(
  slots: readonly Slot[],
  minuteOfDay: number,
): number {
  if (slots.length === 0) return 24 * 60;
  const next = slots.find((slot) => slot.startsAt > minuteOfDay);
  if (next) return next.startsAt - minuteOfDay;
  return 24 * 60 - minuteOfDay + slots[0].startsAt;
}

/** Minute of the day a Date falls on, in the device's own timezone. */
export function minuteOfDay(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}
