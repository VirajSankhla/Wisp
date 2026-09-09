import { z } from "zod";
import type { Note } from "./types.ts";

export const noteSchema = z.object({
  id: z.string().min(1).max(80),
  heading: z.string().max(240),
  body: z.string().max(20000),
  tags: z.array(z.string().min(1).max(40)).max(24),
  pinned: z.boolean(),
  updatedAt: z.number().int().nonnegative(),
  deletedAt: z.number().int().nonnegative().nullable(),
});

export const BACKUP_KIND = "wisp.backup.v1" as const;

export const backupSchema = z.object({
  kind: z.literal(BACKUP_KIND),
  exportedAt: z.number().int().nonnegative(),
  notes: z.array(noteSchema),
});

export function noteFromParsed(data: z.infer<typeof noteSchema>): Note {
  return {
    id: data.id,
    heading: data.heading,
    body: data.body,
    tags: data.tags,
    pinned: data.pinned,
    updatedAt: data.updatedAt,
    deletedAt: data.deletedAt,
  };
}
