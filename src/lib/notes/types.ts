export type Note = {
  id: string;
  heading: string;
  body: string;
  tags: string[];
  pinned: boolean;
  updatedAt: number;
  deletedAt: number | null;
};

export type NoteDraft = Pick<
  Note,
  "id" | "heading" | "body" | "tags" | "pinned" | "updatedAt" | "deletedAt"
>;
