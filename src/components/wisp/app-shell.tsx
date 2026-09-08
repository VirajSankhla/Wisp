"use client";

import { useEffect, useRef, type TouchEvent } from "react";
import { Plus } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listNotes, upsertNote } from "@/lib/notes/server";
import { useNotesStore } from "@/lib/notes/store";
import type { Note } from "@/lib/notes/types";
import { cn } from "@/lib/utils";
import { DesktopScene } from "./desktop-scene";
import { WispMark } from "./mark";
import { WispPanel } from "./panel";

const PUSH_DEBOUNCE_MS = 450;
const pending = new Set<string>();
let pushTimer: ReturnType<typeof setTimeout> | null = null;
const lastPushed = new Map<string, number>();

function queuePush(note: Note) {
  pending.add(note.id);
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void flushPush();
  }, PUSH_DEBOUNCE_MS);
}

async function flushPush() {
  const ids = [...pending];
  pending.clear();
  const { notes } = useNotesStore.getState();
  for (const id of ids) {
    const note = notes[id];
    if (!note) continue;
    if (lastPushed.get(id) === note.updatedAt) continue;
    try {
      await upsertNote({ data: note });
      lastPushed.set(id, note.updatedAt);
    } catch {
      pending.add(id);
    }
  }
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

export function WispApp() {
  const panelOpen = useNotesStore((s) => s.panelOpen);
  const hasHydrated = useNotesStore((s) => s.hasHydrated);
  const noteCount = useNotesStore(
    (s) => Object.values(s.notes).filter((n) => !n.deletedAt).length,
  );
  const { user } = useCurrentUserState();
  const searchRef = useRef<HTMLInputElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const unsub = useNotesStore.persist.onFinishHydration(() => {
      useNotesStore.getState().seedIfEmpty();
      useNotesStore.getState().setHasHydrated(true);
    });
    void useNotesStore.persist.rehydrate();
    return unsub;
  }, []);

  useEffect(() => {
    if (!hasHydrated || !user) return;
    let cancelled = false;
    void (async () => {
      try {
        const remote = await listNotes();
        if (cancelled) return;
        if (!Array.isArray(remote)) return;
        useNotesStore.getState().mergeRemote(remote);
        const { notes } = useNotesStore.getState();
        for (const note of Object.values(notes)) {
          queuePush(note);
        }
      } catch {
        // Offline or unsigned — local notes stay exactly as they are.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, user]);

  useEffect(() => {
    if (!user) return;
    return useNotesStore.subscribe((state, prev) => {
      if (state.notes === prev.notes) return;
      for (const note of Object.values(state.notes)) {
        const before = prev.notes[note.id];
        if (!before || before.updatedAt !== note.updatedAt) {
          queuePush(note);
        }
      }
    });
  }, [user]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        const s = useNotesStore.getState();
        if (s.devicesOpen) {
          s.setDevicesOpen(false);
          return;
        }
        if (s.guideOpen) {
          s.setGuideOpen(false);
          return;
        }
        if (s.selectedId) {
          s.setSelectedId(null);
          return;
        }
        if (s.searchOpen) {
          s.setSearchOpen(false);
          return;
        }
        s.setPanelOpen(false);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useNotesStore.getState().setPanelOpen(true);
        useNotesStore.getState().setSearchOpen(true);
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        useNotesStore.getState().createNote();
      } else if (e.key === "/") {
        e.preventDefault();
        useNotesStore.getState().setPanelOpen(true);
        useNotesStore.getState().setSearchOpen(true);
      } else if (e.key === "?") {
        e.preventDefault();
        const s = useNotesStore.getState();
        s.setGuideOpen(!s.guideOpen);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onTouchStart(e: TouchEvent) {
    const t = e.changedTouches[0];
    if (!t) return;
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    const t = e.changedTouches[0];
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    const fromRight = start.x > window.innerWidth - 56;
    if (!panelOpen && dx < 0 && fromRight) {
      useNotesStore.getState().setPanelOpen(true);
    } else if (panelOpen && dx > 0) {
      useNotesStore.getState().setPanelOpen(false);
    }
  }

  return (
    <div
      className="relative h-dvh overflow-hidden bg-bg text-fg"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <DesktopScene panelOpen={panelOpen} />

      <button
        type="button"
        className="absolute inset-0 z-0"
        aria-label="Tuck Wisp to the edge"
        onClick={() => useNotesStore.getState().setPanelOpen(false)}
      />

      <div
        className={cn(
          "wisp-handle absolute top-1/2 right-0 flex -translate-y-1/2 flex-col items-stretch overflow-hidden rounded-l-2xl bg-bg-elevated/90 text-accent shadow-panel backdrop-blur-md transition-[transform,opacity] duration-300 ease-smooth",
          panelOpen
            ? "pointer-events-none z-10 translate-x-full opacity-0"
            : "z-30 translate-x-0 opacity-100",
        )}
      >
        <button
          type="button"
          onClick={() => useNotesStore.getState().createNote()}
          aria-label="New note"
          className="grid h-11 w-11 place-items-center hover:bg-fg/6"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => useNotesStore.getState().setPanelOpen(true)}
          aria-label="Open Wisp"
          className="grid h-14 w-11 place-items-center hover:bg-fg/6"
        >
          <WispMark className="size-5" />
        </button>
        <p className="pb-2 text-center text-xs tabular-nums text-muted">
          {noteCount}
        </p>
      </div>

      <div
        className={cn(
          "wisp-scrim absolute inset-0 z-10 bg-bg/40 transition-opacity duration-300 ease-smooth md:bg-transparent",
          panelOpen
            ? "opacity-100 md:pointer-events-none md:opacity-0"
            : "pointer-events-none opacity-0",
        )}
        onClick={() => useNotesStore.getState().setPanelOpen(false)}
      />

      <aside
        className={cn(
          "wisp-panel absolute inset-y-0 right-0 z-20 flex w-full flex-col md:w-panel",
          "p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))]",
          "transition-transform duration-300 ease-smooth",
          panelOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-bg-panel shadow-panel backdrop-blur-xl">
          <WispPanel searchRef={searchRef} />
        </div>
      </aside>
    </div>
  );
}
