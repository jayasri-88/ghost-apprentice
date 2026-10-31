const clock = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(iso) {
  return clock.format(new Date(iso));
}

export function manualDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function secondsFromStamp(stamp) {
  const [m, s] = String(stamp).split(":").map(Number);
  return m * 60 + (s || 0);
}
