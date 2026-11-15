const DEFAULT_TIMEZONE = "Asia/Seoul";

function resolveTimezone() {
  const tz = String(process.env.TIMEZONE || "").trim();
  if (!tz) return DEFAULT_TIMEZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

const TIMEZONE = resolveTimezone();

function formatDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map: Record<string, string> = {};

  for (const part of parts) {
    if (part.type === "year" || part.type === "month" || part.type === "day") {
      map[part.type] = part.value;
    }
  }

  return `${map.year}-${map.month}-${map.day}`;
}

function getTodayDateKey() {
  return formatDateKey(new Date());
}

export { TIMEZONE, getTodayDateKey };
