"use client";

import { useEffect, useRef, type TouchEvent } from "react";
import { Plus } from "lucide-react";
import { collapseNativeOverlay } from "@/lib/overlay";
import { installFaultLogger } from "@/lib/notes/fault-log";
import { startRemoteSync } from "@/lib/pairing/remote";
import { useNotesStore } from "@/lib/notes/store";
import { cn } from "@/lib/utils";
import { DesktopScene } from "./desktop-scene";
import { WispMark } from "./mark";
import { OverlaySheet } from "./overlay-sheet";
import { WispPanel } from "./panel";

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

function consumeLaunchQuery() {
  const url = new URL(window.location.href);
  const overlay = url.searchParams.get("overlay") === "1";
  const fresh = url.searchParams.get("new") === "1";
  const open = url.searchParams.get("open") === "1";
  if (fresh || open) {
    url.searchParams.delete("new");
    url.searchParams.delete("open");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next || "/");
  }
  return { overlay, fresh, open };
}

export function WispApp() {
  const panelOpen = useNotesStore((s) => s.panelOpen);
  const overlayMode =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("overlay") === "1";
  const noteCount = useNotesStore(
    (s) => Object.values(s.notes).filter((n) => !n.deletedAt).length,
  );
  const searchRef = useRef<HTMLInputElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const unsub = useNotesStore.persist.onFinishHydration(() => {
      const s = useNotesStore.getState();
      s.seedIfEmpty();
      s.setHasHydrated(true);
      const launch = consumeLaunchQuery();
      if (launch.overlay) {
        document.documentElement.classList.add("wisp-overlay-mode");
        s.setPanelOpen(true);
      }
      if (launch.fresh) s.createNote();
      else if (launch.open) s.setPanelOpen(true);
    });
    void useNotesStore.persist.rehydrate();
    return unsub;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    return startRemoteSync();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    return installFaultLogger();
  }, []);

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
        collapseNativeOverlay();
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
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
    const edge = Math.max(96, window.innerWidth * 0.28);
    const fromRight = start.x > window.innerWidth - edge;
    if (!panelOpen && dx < 0 && fromRight) {
      useNotesStore.getState().setPanelOpen(true);
    } else if (panelOpen && dx > 0) {
      useNotesStore.getState().setPanelOpen(false);
      collapseNativeOverlay();
    }
  }

  if (overlayMode) {
    return (
      <div className="bg-transparent text-fg overscroll-none">
        <OverlaySheet />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-dvh overflow-hidden text-fg overscroll-none",
        overlayMode ? "bg-transparent" : "bg-bg",
      )}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {overlayMode ? null : (
        <>
          <DesktopScene panelOpen={panelOpen} />
          <button
            type="button"
            className="absolute inset-0 z-0"
            aria-label="Tuck Wisp to the edge"
            onClick={() => useNotesStore.getState().setPanelOpen(false)}
          />
          <button
            type="button"
            aria-label="Pull Wisp from the edge"
            onClick={() => useNotesStore.getState().setPanelOpen(true)}
            className={cn(
              "wisp-edge-rail absolute inset-y-0 right-0 z-20 w-5 md:w-3",
              panelOpen ? "pointer-events-none opacity-0" : "opacity-100",
            )}
          />
          <div
            className={cn(
              "wisp-handle absolute top-1/2 z-30 flex -translate-y-1/2 flex-col items-stretch overflow-hidden rounded-l-2xl bg-bg-elevated/92 text-accent shadow-panel backdrop-blur-md transition-[transform,opacity,right] duration-300 ease-smooth",
              "right-[max(0.35rem,env(safe-area-inset-right))]",
              panelOpen
                ? "pointer-events-none translate-x-[120%] opacity-0"
                : "translate-x-0 opacity-100",
            )}
          >
            <button
              type="button"
              onClick={() => useNotesStore.getState().createNote()}
              aria-label="New note"
              className="grid h-12 w-12 place-items-center hover:bg-fg/6"
            >
              <Plus className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => useNotesStore.getState().setPanelOpen(true)}
              aria-label="Open Wisp"
              className="grid h-16 w-12 place-items-center hover:bg-fg/6"
            >
              <WispMark className="size-5" />
            </button>
            <p className="pb-2.5 text-center text-xs tabular-nums text-muted">
              {noteCount}
            </p>
          </div>
        </>
      )}

      {overlayMode ? null : (
        <div
          className={cn(
            "wisp-scrim absolute inset-0 z-10 bg-bg/40 transition-opacity duration-300 ease-smooth md:bg-transparent",
            panelOpen
              ? "opacity-100 md:pointer-events-none md:opacity-0"
              : "pointer-events-none opacity-0",
          )}
          onClick={() => useNotesStore.getState().setPanelOpen(false)}
        />
      )}

      <aside
        className={cn(
          "wisp-panel absolute inset-y-0 right-0 z-20 flex w-full flex-col md:w-panel",
          overlayMode
            ? "p-0"
            : "p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))]",
          "transition-transform duration-300 ease-smooth",
          overlayMode || panelOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {overlayMode ? (
          <OverlaySheet />
        ) : (
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-bg-panel shadow-panel backdrop-blur-xl">
            <WispPanel searchRef={searchRef} />
          </div>
        )}
      </aside>
    </div>
  );
}
