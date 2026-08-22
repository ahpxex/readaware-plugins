/** `bun test plugins/theme-schedule` — the schedule logic, clock excluded. */
import { describe, expect, test } from "bun:test";
import {
  KEEP,
  activeSlot,
  formatTimeOfDay,
  minutesUntilNextSlot,
  parseTimeOfDay,
  readSlots,
  withDefaults,
} from "./schedule";

const DAY_NIGHT = {
  dayTime: "07:00",
  dayApp: "light",
  dayReader: "warm",
  nightTime: "19:00",
  nightApp: "dark",
  nightReader: "dark",
};

describe("parseTimeOfDay", () => {
  test("accepts what the host writes and what a person might type", () => {
    expect(parseTimeOfDay("07:00")).toBe(7 * 60);
    expect(parseTimeOfDay("7:00")).toBe(7 * 60);
    expect(parseTimeOfDay(" 7:5 ")).toBe(7 * 60 + 5);
    expect(parseTimeOfDay("19.30")).toBe(19 * 60 + 30);
    expect(parseTimeOfDay("7：00")).toBe(7 * 60); // full-width colon
    expect(parseTimeOfDay("22")).toBe(22 * 60);
    expect(parseTimeOfDay("00:00")).toBe(0);
    expect(parseTimeOfDay("23:59")).toBe(23 * 60 + 59);
  });

  test("a typo is not a time — it must not become midnight", () => {
    for (const value of ["", "  ", "24:00", "7:60", "-1:00", "evening", "7:00pm", null, 7]) {
      expect(parseTimeOfDay(value)).toBeNull();
    }
  });

  test("round-trips through the display form", () => {
    expect(formatTimeOfDay(parseTimeOfDay("7:5")!)).toBe("07:05");
    expect(formatTimeOfDay(0)).toBe("00:00");
    expect(formatTimeOfDay(23 * 60 + 59)).toBe("23:59");
  });
});

describe("readSlots", () => {
  test("reads day and night, earliest first", () => {
    const slots = readSlots(DAY_NIGHT);
    expect(slots.map((slot) => [slot.id, slot.label])).toEqual([
      ["day", "07:00"],
      ["night", "19:00"],
    ]);
  });

  test("a night that starts before the day still sorts by the clock", () => {
    const slots = readSlots({ ...DAY_NIGHT, dayTime: "13:00", nightTime: "02:00" });
    expect(slots.map((slot) => slot.id)).toEqual(["night", "day"]);
  });

  test("drops a slot with no usable time and one that changes nothing", () => {
    expect(readSlots({ ...DAY_NIGHT, nightTime: "" }).map((s) => s.id)).toEqual(["day"]);
    expect(readSlots({ ...DAY_NIGHT, nightTime: "nope" }).map((s) => s.id)).toEqual(["day"]);
    expect(
      readSlots({ ...DAY_NIGHT, nightApp: KEEP, nightReader: KEEP }).map((s) => s.id),
    ).toEqual(["day"]);
  });

  test("both slots at the same minute collapse to the day one", () => {
    const slots = readSlots({ ...DAY_NIGHT, nightTime: "07:00" });
    expect(slots.map((slot) => slot.id)).toEqual(["day"]);
  });

  test("an untouched surface stays KEEP", () => {
    const slots = readSlots({ dayTime: "07:00", dayApp: "light" });
    expect(slots[0].reader).toBe(KEEP);
  });
});

describe("activeSlot", () => {
  const slots = readSlots(DAY_NIGHT);

  test("picks the slot that has already started", () => {
    expect(activeSlot(slots, 7 * 60)?.id).toBe("day");
    expect(activeSlot(slots, 12 * 60)?.id).toBe("day");
    expect(activeSlot(slots, 19 * 60)?.id).toBe("night");
    expect(activeSlot(slots, 23 * 60 + 59)?.id).toBe("night");
  });

  test("before the day starts, last night is still running", () => {
    expect(activeSlot(slots, 0)?.id).toBe("night");
    expect(activeSlot(slots, 6 * 60 + 59)?.id).toBe("night");
  });

  test("nothing configured, nothing active", () => {
    expect(activeSlot([], 12 * 60)).toBeNull();
  });

  test("a lone slot covers the whole day", () => {
    const one = readSlots({ ...DAY_NIGHT, nightTime: "" });
    expect(activeSlot(one, 3 * 60)?.id).toBe("day");
    expect(activeSlot(one, 21 * 60)?.id).toBe("day");
  });
});

describe("minutesUntilNextSlot", () => {
  const slots = readSlots(DAY_NIGHT);

  test("counts to the next start within the day", () => {
    expect(minutesUntilNextSlot(slots, 7 * 60)).toBe(12 * 60);
    expect(minutesUntilNextSlot(slots, 6 * 60)).toBe(60);
  });

  test("wraps past midnight to the first start of tomorrow", () => {
    expect(minutesUntilNextSlot(slots, 20 * 60)).toBe(11 * 60);
    expect(minutesUntilNextSlot(slots, 23 * 60 + 59)).toBe(7 * 60 + 1);
  });

  test("a lone slot is a full day away from itself", () => {
    const one = readSlots({ ...DAY_NIGHT, nightTime: "" });
    expect(minutesUntilNextSlot(one, 7 * 60)).toBe(24 * 60);
    expect(minutesUntilNextSlot([], 9 * 60)).toBe(24 * 60);
  });
});

describe("withDefaults", () => {
  test("an unsaved settings object still schedules day and night", () => {
    const slots = readSlots(withDefaults(null));
    expect(slots.map((slot) => slot.label)).toEqual(["07:00", "19:00"]);
    expect(slots[1].app).toBe("dark");
  });

  test("a stored value wins, including an emptied one", () => {
    const settings = withDefaults({ dayTime: "06:30", nightTime: "" });
    expect(settings.dayTime).toBe("06:30");
    expect(readSlots(settings).map((slot) => slot.label)).toEqual(["06:30"]);
  });

  test("the enabled flag defaults on", () => {
    expect(withDefaults(null).enabled).toBe(true);
    expect(withDefaults({ enabled: false }).enabled).toBe(false);
  });
});
