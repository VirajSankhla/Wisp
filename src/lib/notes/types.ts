export type NoteVersion = {
  heading: string;
  body: string;
  updatedAt: number;
};

export type Note = {
  id: string;
  heading: string;
  body: string;
  tags: string[];
  pinned: boolean;
  updatedAt: number;
  deletedAt: number | null;
  /**
   * Local-only edit history, newest first, capped at HISTORY_MAX. Never
   * synced or backed up — it's a per-device safety net, not portable state.
   */
  history?: NoteVersion[];
};
