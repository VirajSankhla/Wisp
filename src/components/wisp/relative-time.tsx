import { formatDistanceToNowStrict } from "date-fns";

export function relativeTime(ms: number, from = Date.now()): string {
  const delta = from - ms;
  if (delta < 45_000) return "now";
  try {
    return formatDistanceToNowStrict(ms, { addSuffix: true });
  } catch {
    return "";
  }
}
