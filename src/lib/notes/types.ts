export type Note = {
  id: string;
  heading: string;
  body: string;
  tags: string[];
  pinned: boolean;
  updatedAt: number;
  deletedAt: number | null;
};
