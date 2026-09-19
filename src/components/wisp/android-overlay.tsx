"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isAndroidNative, WispOverlay } from "@/lib/overlay";

export function AndroidOverlayCard() {
  const [show, setShow] = useState(false);
  const [running, setRunning] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isAndroidNative()) return;
    setShow(true);
    void refresh();
  }, []);

  async function refresh() {
    const [draw, run] = await Promise.all([
      WispOverlay.canDrawOverlays(),
      WispOverlay.isRunning(),
    ]);
    setAllowed(draw.value);
    setRunning(run.value);
  }

  async function enable() {
    try {
      const draw = await WispOverlay.canDrawOverlays();
      if (!draw.value) {
        toast("Android will open a permission screen. Allow Wisp, then tap Enable again.");
        await WispOverlay.requestPermission();
        return;
      }
      await WispOverlay.start();
      await refresh();
      toast("Edge tab is on — leave Wisp and look at the right side of the screen");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not start the overlay");
    }
  }

  async function disable() {
    await WispOverlay.stop();
    await refresh();
    toast("Edge tab hidden");
  }

  if (!show) return null;

  return (
    <div className="space-y-3 rounded-2xl bg-fg/4 px-3 py-3">
      <p className="text-fg">Edge tab (this phone)</p>
      <p>
        Places a drop on the right edge of Android, over the home screen and
        other apps. It hides while Wisp itself is open, so you are not looking
        at two copies of the same notes. Leave Wisp to use it.
      </p>
      <p className="text-xs text-subtle">
        {allowed
          ? running
            ? "Enabled. Notes in the overlay are the same notes as in this app."
            : "Permission is granted. Enable the tab."
          : "Android needs “Display over other apps” for Wisp."}
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
