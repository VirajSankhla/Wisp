/**
 * Tombstones stay until a self-host operator opts in.
 *
 * They are required so a device that was offline during a delete still learns
 * the note is gone, instead of uploading a resurrection.
 *
 * Set WISP_TOMBSTONE_RETENTION_MS (milliseconds) on the *sync server* to purge
 * tombstones older than that window. Unset or 0 = keep forever (the default).
 * A device offline longer than the retention window may resurrect a note.
 */
export function tombstoneRetentionMs(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): number | null {
  const raw = env.WISP_TOMBSTONE_RETENTION_MS?.trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function shouldPurgeTombstone(
  deletedAtMs: number | null,
  now: number,
  retentionMs: number | null,
): boolean {
  if (retentionMs == null || deletedAtMs == null) return false;
  return now - deletedAtMs > retentionMs;
}
