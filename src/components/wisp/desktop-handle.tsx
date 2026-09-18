"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { DENSITY_META, loadPrefs } from "@/lib/prefs";
import { useNotesStore } from "@/lib/notes/store";
import { cn } from "@/lib/utils";
import { WispMark } from "./mark";

const PEEK_KEY = "wisp.desktop.peek";

export function DesktopHandle({
  panelOpen,
  noteCount,
}: {
  panelOpen: boolean;
  noteCount: number;
}) {
  const [peeked, setPeeked] = useState(false);
  const [density, setDensity] = useState(() => loadPrefs().density);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  useEffect(() => {
    try {
      setPeeked(localStorage.getItem(PEEK_KEY) === "1");
    } catch {
      /* ignore */
    }
    setDensity(loadPrefs().density);
  }, [panelOpen]);

  if (panelOpen) return null;

  const size = DENSITY_META[density].handle;

  function persistPeek(next: boolean) {
    setPeeked(next);
    try {
      localStorage.setItem(PEEK_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    const start = drag.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) + Math.abs(e.clientY - start.y) > 8) start.moved = true;
    if (!peeked && dx > 24) persistPeek(true);
    if (peeked && dx < -18) persistPeek(false);
  }

  function onPointerUp() {
    const start = drag.current;
    drag.current = null;
    if (!start?.moved) {
      if (peeked) persistPeek(false);
      else useNotesStore.getState().setPanelOpen(true);
    }
  }

  if (peeked) {
    return (
      <button
        type="button"
        aria-label="Show Wisp drop"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="absolute top-1/2 right-0 z-30 h-14 w-1.5 -translate-y-1/2 rounded-l-full bg-accent/80"
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Open Wisp, ${noteCount} notes`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ width: size, height: size }}
      className={cn(
        "absolute top-1/2 z-30 flex -translate-y-1/2 items-center justify-center rounded-full",
        "right-[max(0.5rem,env(safe-area-inset-right))]",
        "bg-[#12110F] text-[#F3EFE7] shadow-panel ring-1 ring-white/15",
      )}
    >
      <WispMark animate className="size-[58%]" />
    </button>
  );
}
