import { describe, expect, it } from "vitest";
import {
  count,
  dateKey,
  defaults,
  nextPrayer,
  prayers,
  shiftDate,
  streak,
  timesFor,
  validHistory,
  validSettings,
} from "./model";
describe("prayer calculations", () => {
  it("calculates five ordered Manchester prayer times", () => {
    const times = timesFor(new Date(2026, 9, 23), defaults);
    expect(times).toHaveLength(5);
    times.forEach((t, i) => {
      expect(Number.isFinite(t.getTime())).toBe(true);
      if (i) expect(t.getTime()).toBeGreaterThan(times[i - 1].getTime());
    });
  });
  it("moves the next prayer to tomorrow after Isha", () => {
    const date = new Date(2026, 9, 23, 23, 59);
    const next = nextPrayer(date, defaults)!;
    expect(next.name).toBe("Fajr");
    expect(next.time.getTime()).toBeGreaterThan(date.getTime());
  });
  it("selects the next prayer during the day", () => {
    const times = timesFor(new Date(2026, 9, 23), defaults);
    expect(
      nextPrayer(new Date(times[1].getTime() + 1000), defaults)?.name,
    ).toBe("Asr");
  });
});
describe("tracking and storage", () => {
  it("counts complete days and preserves a streak during an unfinished day", () => {
    const today = new Date(2026, 9, 23);
    const full = Object.fromEntries(prayers.map((p) => [p, true]));
    const h = {
      [dateKey(shiftDate(today, -1))]: full,
      [dateKey(shiftDate(today, -2))]: full,
    };
    expect(count(h, today)).toBe(0);
    expect(streak(h, today)).toBe(2);
    expect(streak({ ...h, [dateKey(today)]: full }, today)).toBe(3);
  });
  it("rejects invalid settings and corrupted history", () => {
    expect(validSettings(defaults)).toBe(true);
    expect(validSettings({ ...defaults, latitude: 100 })).toBe(false);
    expect(validHistory({ "2026-10-23": { Fajr: true } })).toBe(true);
    expect(validHistory({ "2026-10-23": null })).toBe(false);
    expect(validHistory({ "2026-10-23": { Fajr: "yes" } })).toBe(false);
  });
});
