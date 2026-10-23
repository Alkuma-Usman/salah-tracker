import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from "adhan";
export const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export type Prayer = (typeof prayers)[number];
export type History = Record<string, Partial<Record<Prayer, boolean>>>;
export type Settings = {
  city: string;
  latitude: number;
  longitude: number;
  method:
    "MuslimWorldLeague" | "NorthAmerica" | "UmmAlQura" | "Karachi" | "Egyptian";
  hanafi: boolean;
  reminders: boolean;
};
export const defaults: Settings = {
  city: "Manchester",
  latitude: 53.4808,
  longitude: -2.2426,
  method: "MuslimWorldLeague",
  hanafi: false,
  reminders: false,
};
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function shiftDate(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
export function count(history: History, date: Date) {
  return prayers.filter((p) => history[dateKey(date)]?.[p]).length;
}
export function timesFor(date: Date, settings: Settings) {
  const params = CalculationMethod[settings.method]();
  params.madhab = settings.hanafi ? Madhab.Hanafi : Madhab.Shafi;
  const times = new PrayerTimes(
    new Coordinates(settings.latitude, settings.longitude),
    date,
    params,
  );
  return [times.fajr, times.dhuhr, times.asr, times.maghrib, times.isha];
}
export function nextPrayer(now: Date, settings: Settings) {
  for (const offset of [0, 1]) {
    const times = timesFor(shiftDate(now, offset), settings);
    const index = times.findIndex((t) => t > now);
    if (index >= 0) return { name: prayers[index], time: times[index] };
  }
  return null;
}
export function streak(history: History, today: Date) {
  let date = count(history, today) === 5 ? today : shiftDate(today, -1);
  let total = 0;
  while (count(history, date) === 5 && total < 36600) {
    total++;
    date = shiftDate(date, -1);
  }
  return total;
}
export function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
export function validSettings(value: unknown): value is Settings {
  if (!value || typeof value !== "object") return false;
  const s = value as Settings;
  return (
    typeof s.city === "string" &&
    s.city.trim().length > 0 &&
    Number.isFinite(s.latitude) &&
    Math.abs(s.latitude) <= 90 &&
    Number.isFinite(s.longitude) &&
    Math.abs(s.longitude) <= 180 &&
    [
      "MuslimWorldLeague",
      "NorthAmerica",
      "UmmAlQura",
      "Karachi",
      "Egyptian",
    ].includes(s.method) &&
    typeof s.hanafi === "boolean" &&
    typeof s.reminders === "boolean"
  );
}
export function validHistory(value: unknown): value is History {
  return (
    !!value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.entries(value).every(
      ([key, day]) =>
        /^\d{4}-\d{2}-\d{2}$/.test(key) &&
        !!day &&
        typeof day === "object" &&
        Object.entries(day).every(
          ([p, v]) => prayers.includes(p as Prayer) && typeof v === "boolean",
        ),
    )
  );
}
