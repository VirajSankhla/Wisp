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
              Wisp is a heading-first notebook. The list is an index. Tags exist
              for search, not decoration. It works fully offline, with no account.
            </p>
            <ul className="space-y-2">
              <li>
                <span className="text-fg">N</span> — new note
              </li>
              <li>
                <span className="text-fg">/ or Ctrl+K</span> — search headings and
                #tags
              </li>
              <li>
                <span className="text-fg">Esc</span> — back, then tuck to the edge
              </li>
              <li>
                <span className="text-fg">?</span> — this guide
              </li>
              <li>
                On a phone, swipe in from the right edge. On a laptop, click the
                desk to tuck, the handle to open.
              </li>
              <li>
                Pair devices, then save a signed snapshot to share memory
                without an account.
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
              The same Wisp installs as an app. No store listing required.
            </p>
            <div>
              <p className="font-medium text-fg">Phone (Android)</p>
              <p className="mt-1">
                Chrome menu → Install app / Add to Home screen. It opens
                full-screen, works offline, and keeps your notes on the device.
              </p>
            </div>
            <div>
              <p className="font-medium text-fg">iPhone</p>
              <p className="mt-1">
                Safari Share → Add to Home Screen. iOS does not allow a
                third-party swipe-from-edge overlay; the home-screen icon is the
                honest path.
              </p>
            </div>
            <div>
              <p className="font-medium text-fg">Windows / Mac / ChromeOS</p>
              <p className="mt-1">
                Chrome or Edge → the install icon in the address bar, or menu →
                Install Wisp. You get a standalone window. Pair a device, or sign
                in, only if you want another screen to share memory.
              </p>
            </div>
            <div>
              <p className="font-medium text-fg">Later: a real .exe / .apk</p>
              <p className="mt-1">
                Wrap this same UI in Tauri (desktop, data folder you choose) or
                Capacitor (Android). That is a packaging step, not a rewrite.
              </p>
            </div>
          </div>
        ) : null}

        {tab === "backup" ? (
          <div className="space-y-4">
            <p className="text-fg">
              {liveCount} notes on this device. A backup is a JSON file you can
              keep wherever you like — including a folder on D: — and import on
              another screen.
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
              Only files with kind <span className="text-fg">wisp.backup.v1</span>{" "}
              are accepted as backups. A paired-device snapshot uses{" "}
              <span className="text-fg">wisp.peer-sync.v1</span> and is opened
              from Devices, not here. Sign-in sync stays optional.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
