"use client";

import { useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadBackup, parseBackup } from "@/lib/notes/backup";
import { SAMPLE_IDS } from "@/lib/notes/samples";
import { useNotesStore } from "@/lib/notes/store";
import { cn } from "@/lib/utils";

type Tab = "use" | "install" | "backup";

export function WispGuide({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("use");
  const fileRef = useRef<HTMLInputElement>(null);
  const notes = useNotesStore((s) => s.notes);
  const liveCount = Object.values(notes).filter((n) => !n.deletedAt).length;
  const hasStarters = SAMPLE_IDS.some((id) => notes[id] && !notes[id].deletedAt);

  async function onImportFile(file: File) {
    try {
      const raw: unknown = JSON.parse(await file.text());
      const parsed = parseBackup(raw);
      if (!parsed.ok) {
        toast(parsed.error);
        return;
      }
      const result = useNotesStore.getState().importNotes(parsed.notes);
      toast(
        result.applied
          ? `Merged ${result.applied} notes from backup`
          : "No newer notes in that backup",
      );
    } catch {
      toast("Could not read that backup");
    }
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
        <h2 className="font-display text-lg tracking-tight">Guide</h2>
      </div>

      <div className="mt-2 flex gap-1 px-4">
        {(
          [
            ["use", "Use"],
            ["install", "Install"],
            ["backup", "Backup"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "h-9 rounded-full px-3 text-xs font-medium transition-colors duration-150",
              tab === id
                ? "bg-accent text-accent-fg"
                : "bg-fg/6 text-muted hover:text-fg",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-muted">
        {tab === "use" ? (
          <div className="space-y-4">
            <p className="text-fg">
              Wisp is a heading-first notebook. It works fully offline. There
              is no sign-in.
            </p>
            <ul className="space-y-2">
              <li>
                <span className="text-fg">N</span> — new note
              </li>
              <li>
                <span className="text-fg">/ or Ctrl+K</span> — search headings
                and #tags
              </li>
              <li>
                <span className="text-fg">Esc</span> — back, then tuck to the
                edge
              </li>
              <li>
                <span className="text-fg">?</span> — this guide
              </li>
              <li>
                Phone: swipe in from the right. Laptop: click the desk to tuck.
              </li>
              <li>
                Phone and laptop do not sync by themselves. Pair with a QR
                (the lock), then Send notes on one and Receive notes on the
                other — copy, share, or a file.
              </li>
            </ul>
            {hasStarters ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  useNotesStore.getState().clearStarterNotes();
                  toast("Starter notes removed");
                }}
              >
                Remove starter notes
              </Button>
            ) : null}
          </div>
        ) : null}

        {tab === "install" ? (
          <div className="space-y-4">
            <p className="text-fg">
              You can use Wisp as an app without an account store, an .exe, or
              an .apk. Install it from this page.
            </p>
            <div>
              <p className="font-medium text-fg">Windows, Mac, Chromebook</p>
              <p className="mt-1">
                Chrome or Edge → the install icon in the address bar, or menu →
                Install Wisp. You get a standalone window. That is the app.
              </p>
            </div>
            <div>
              <p className="font-medium text-fg">Android — over other apps</p>
              <p className="mt-1">
                Install the Wisp .apk (not the browser install). Open Wisp →
                Devices → Enable edge tab. Android will ask “Display over other
                apps.” Allow it. A drop sits on the right edge of the whole
                phone. Tap it for notes. Drag it to the × at the bottom of the
                screen to hide it. Wisp only asks to draw over other apps —
                not contacts, storage, or notifications.
              </p>
            </div>
            <div>
              <p className="font-medium text-fg">iPhone & iPad</p>
              <p className="mt-1">
                Safari only: Share → Add to Home Screen. Apple does not let any
                third-party app (Wisp included) float over Instagram, WhatsApp,
                or a game the way a PC game bar does. The home-screen icon is
                the honest iPhone path.
              </p>
            </div>
            <div>
              <p className="font-medium text-fg">Pop a note from anywhere (iPhone)</p>
              <p className="mt-1">
                The closest thing to a game overlay: Shortcuts → New Shortcut →
                Open URLs → your Wisp address with <span className="text-fg">?new=1</span>{" "}
                at the end. Then Settings → Accessibility → Touch → Back Tap →
                Double Tap → that shortcut. Double-tap the back of the phone and
                Wisp opens on a new heading.
              </p>
            </div>
            <p>
              On this screen, swipe in from the right or tap the droplet. iOS
              steals the very last pixels of the edge, so the tab sits a little
              inward on purpose.
            </p>
            <p>
              A classic .exe / .apk is packaging from the same project — the
              overlay drop over other apps (Android) and over other windows
              (Windows) needs that packaging; a browser tab or installed PWA
              cannot do it.
            </p>
          </div>
        ) : null}

        {tab === "backup" ? (
          <div className="space-y-4">
            <p className="text-fg">
              {liveCount} notes on this device. A backup is a JSON file you
              keep wherever you like.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  downloadBackup(notes);
                  toast("Backup downloaded");
                }}
              >
                Download backup
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                Import backup
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void onImportFile(file);
                }}
              />
            </div>
            <p>
              Backups use <span className="text-fg">wisp.backup.v1</span>.
              Connected-device snapshots are encrypted and opened from Devices.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
