"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  desktopOverlayRunning,
  isTauri,
  startDesktopOverlay,
  stopDesktopOverlay,
} from "@/lib/desktop-overlay";
import { loadPrefs, savePrefs } from "@/lib/prefs";

export function DesktopOverlayCard() {
  const [show, setShow] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;
    setShow(true);
    void desktopOverlayRunning().then(setRunning);
  }, []);

  if (!show) {
    if (typeof navigator === "undefined") return null;
    const ua = navigator.userAgent;
    if (!/Windows|Macintosh|Linux/i.test(ua) || /Android|iPhone|iPad/i.test(ua)) {
      return null;
    }
    return (
      <div className="space-y-3 rounded-2xl bg-fg/4 px-3 py-3">
        <p className="text-fg">Edge tab (this computer)</p>
        <p>
          A browser or installed PWA cannot sit over other programs. Install
          the Wisp Windows app from GitHub Releases, then enable the edge tab
          in Devices.
        </p>
      </div>
    );
  }

  async function enable() {
    try {
      await startDesktopOverlay();
      setRunning(true);
      savePrefs({ ...loadPrefs(), desktopOverlay: true });
      toast("Edge tab is on. It stays above other windows.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not start the overlay");
    }
  }

  async function disable() {
    await stopDesktopOverlay();
    setRunning(false);
    savePrefs({ ...loadPrefs(), desktopOverlay: false });
    toast("Edge tab hidden");
  }

  return (
    <div className="space-y-3 rounded-2xl bg-fg/4 px-3 py-3">
      <p className="text-fg">Edge tab (this computer)</p>
      <p>
        A drop stays on the right of the screen, above other windows
        (including this one). Click it to open headings. Notes stay live
        with this list. It will not cover exclusive full-screen games.
      </p>
      <div className="flex flex-wrap gap-2">
        {running ? (
          <Button type="button" size="sm" variant="outline" onClick={() => void disable()}>
            Hide edge tab
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={() => void enable()}>
            Enable edge tab
          </Button>
        )}
      </div>
    </div>
  );
}
