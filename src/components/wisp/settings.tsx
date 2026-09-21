"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isAndroidNative, WispOverlay } from "@/lib/overlay";
import { isTauri, setDesktopOverlayLook } from "@/lib/desktop-overlay";
import {
  DENSITY_META,
  loadPrefs,
  savePrefs,
  type Density,
  type Prefs,
} from "@/lib/prefs";
import { cn } from "@/lib/utils";

const DENSITIES: Density[] = ["compact", "regular", "large"];
const ROWS: Array<3 | 4 | 5> = [3, 4, 5];

export function SettingsPanel({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());

  useEffect(() => {
    applyNative(prefs);
  }, [prefs]);

  function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
    applyNative(next);
    toast("Saved on this device");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1 px-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          aria-label="Back to headings"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <h2 className="font-display text-lg tracking-tight">Settings</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-muted">
        <div className="space-y-6">
          <section className="space-y-3">
            <p className="text-fg">Edge drop size</p>
            <p className="text-xs text-subtle">
              Size of the circular drop on the screen edge, and the heading
              type in the overlay. Applies immediately on this device — leave
              the app to see the drop on the edge.
            </p>
            <div className="flex flex-wrap gap-2">
              {DENSITIES.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => update({ density: id })}
                  className={cn(
                    "h-9 rounded-full px-3 text-xs font-medium",
                    prefs.density === id
                      ? "bg-accent text-accent-fg"
                      : "bg-fg/6 text-muted hover:text-fg",
                  )}
                >
                  {DENSITY_META[id].label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-fg">Headings in the overlay</p>
            <p className="text-xs text-subtle">
              How many headings show before the overlay list scrolls. The
              overlay and this app share the same notes on this device.
            </p>
            <div className="flex flex-wrap gap-2">
              {ROWS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => update({ overlayRows: n })}
                  className={cn(
                    "h-9 rounded-full px-3 text-xs font-medium",
                    prefs.overlayRows === n
                      ? "bg-accent text-accent-fg"
                      : "bg-fg/6 text-muted hover:text-fg",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-fg">Where to enable the overlay</p>
            <p className="text-xs text-subtle">
              Open Devices (phone icon). On Android, enable the edge tab and
              allow “Display over other apps.” The drop stays on the right
              even while you are in Wisp. Notes you create in either place
              show up in both. On Windows, use the Wisp installer and enable
              the edge tab there — a browser window cannot draw over other
              programs.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function applyNative(prefs: Prefs) {
  const handleDp = DENSITY_META[prefs.density].handle;
  if (isAndroidNative()) {
    void WispOverlay.setLook({ handleDp }).catch(() => {});
  }
  if (isTauri()) {
    void setDesktopOverlayLook(handleDp).catch(() => {});
  }
}
