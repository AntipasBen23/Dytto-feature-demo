export function uid(prefix = "id") {
  // Short, readable, demo-safe ID (not crypto)
  const a = Math.random().toString(36).slice(2, 8);
  const b = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${a}${b}`;
}

export function nowLabel() {
  // Human-ish timestamp label for demo UI
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `Today, ${hh}:${mm}`;
}

export function relativeNow() {
  return "just now";
}