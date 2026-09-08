-- Per-user notes. Client generates ids so a note can be written offline first.
-- Tombstones (deleted_at_ms) stay until an operator opts into retention.
create table if not exists notes (
  id text not null,
  user_id text not null,
  heading text not null default '',
  body text not null default '',
  tags_json text not null default '[]',
  pinned boolean not null default false,
  updated_at_ms bigint not null,
  deleted_at_ms bigint,
  primary key (id, user_id)
);

create index if not exists notes_user_updated_idx on notes (user_id, updated_at_ms desc);
