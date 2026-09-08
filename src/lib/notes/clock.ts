/**
 * Timestamp policy for last-write-wins.
 *
 * Local edits stamp `updatedAt` with the device clock so offline work does not
 * depend on a server. The server (and any future peer sync) then:
 *   1. Clamps unreasonably *future* times to now + CLOCK_SKEW_MS
 *   2. Rejects writes whose clamped time is older than the stored row
 *
 * A year-9999 timestamp therefore cannot lock a note forever. A note edited
 * yesterday on an airplane still wins against an older cloud copy, because we
 * only clamp the future — the past is legitimate offline history.
 *
 * 5 minutes of skew covers ordinary clock drift without letting a client mint
 * a permanent "newest" value.
 */
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
