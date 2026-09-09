export const CLOCK_SKEW_MS = 5 * 60 * 1000;

export function clampNoteTime(clientTs: number, now = Date.now()): number {
  if (!Number.isFinite(clientTs) || clientTs < 0) return now;
  const max = now + CLOCK_SKEW_MS;
  return clientTs > max ? max : Math.floor(clientTs);
}

export function isStaleWrite(
  incoming: number,
  existing: number | null | undefined,
): boolean {
  if (existing == null) return false;
  return incoming < existing;
}
