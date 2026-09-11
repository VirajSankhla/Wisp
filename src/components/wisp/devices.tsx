"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Copy, QrCode, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { AndroidOverlayCard } from "@/components/wisp/android-overlay";
import { Button } from "@/components/ui/button";
import { useNotesStore } from "@/lib/notes/store";
import {
  encodeConnectionCode,
  mintConnectionCode,
  parseConnectionCode,
  PairingError,
} from "@/lib/pairing/codes";
import { pairingQrSvg } from "@/lib/pairing/qr";
import {
  buildPeerSync,
  downloadPeerSync,
  encodePeerSync,
  openPeerSync,
  parsePeerSyncText,
  peerSyncFitsQr,
} from "@/lib/pairing/sync";
import {
  clearVault,
  hasVault,
  loadVault,
  saveVaultFromSecret,
  vaultSecret,
} from "@/lib/pairing/vault";

type Mode = "home" | "offer" | "enter" | "send" | "receive";

export function DevicesPanel({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>("home");
  const [connected, setConnected] = useState(false);
  const [code, setCode] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [paste, setPaste] = useState("");
  const [packet, setPacket] = useState("");
  const [packetQr, setPacketQr] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConnected(hasVault());
  }, []);

  async function showCode() {
    setError(null);
    const existing = loadVault();
    let secret: Uint8Array;
    if (existing) {
      secret = vaultSecret(existing);
    } else {
      const offer = mintConnectionCode();
      secret = offer.secret;
      await saveVaultFromSecret(secret);
      setConnected(true);
    }
    const next = encodeConnectionCode(secret);
    setCode(next);
    setQrSvg(pairingQrSvg(next));
    setCopied(false);
    setMode("offer");
  }

  async function copyText(text: string, ok = "Copied") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast(ok);
    } catch {
      toast("Select the text and copy it");
    }
  }

  async function enterCode() {
    setError(null);
    try {
      const parsed = parseConnectionCode(paste);
      await saveVaultFromSecret(parsed.secret);
      setConnected(true);
      setMode("home");
      toast("Same lock. Now send notes from the other device.");
    } catch (err) {
      setError(err instanceof PairingError ? err.message : "Could not use that code");
    }
  }

  async function prepareSend() {
    setError(null);
    try {
      const bundle = await buildPeerSync(useNotesStore.getState().notes);
      const text = encodePeerSync(bundle);
      setPacket(text);
      setPacketQr(peerSyncFitsQr(text) ? pairingQrSvg(text) : "");
      setCopied(false);
      setMode("send");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Connect a device first");
    }
  }

  async function sharePacket() {
    if (!packet) return;
    const file = new File([packet], "wisp-sync.json", { type: "application/json" });
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
      canShare?: (data: ShareData) => boolean;
    };
    try {
      if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
        await nav.share({ files: [file], title: "Wisp notes" });
        return;
      }
    } catch {
      /* user cancelled or share failed — fall through */
    }
    downloadPeerSync(JSON.parse(packet));
    toast("Saved a file — send it to the other device");
  }

  async function applySnapshot(raw: unknown) {
    const result = await openPeerSync(raw);
    if (!result.ok) {
      setError(result.error);
      toast(result.error);
      return;
    }
    const stats = useNotesStore.getState().mergeRemote(result.notes);
    setError(null);
    setMode("home");
    toast(
      stats.applied
        ? `Merged ${stats.applied} notes`
        : "Nothing newer in that snapshot",
    );
  }

  async function onReceiveFile(file: File) {
    try {
      await applySnapshot(JSON.parse(await file.text()));
    } catch {
      const message = "Could not read that snapshot";
      setError(message);
      toast(message);
    }
  }

  async function onReceivePaste() {
    setError(null);
    try {
      await applySnapshot(parsePeerSyncText(paste));
    } catch {
      setError("Paste the packet from the other device");
    }
  }

  const vault = loadVault();

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
        <h2 className="font-display text-lg tracking-tight">Devices</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-muted">
        {mode === "home" ? (
          <div className="space-y-5">
            <p className="text-fg">
              There is no cloud in the middle. The QR is a lock. Notes still
              travel as a packet you copy, share, or save.
            </p>
            <AndroidOverlayCard />
            <ol className="list-decimal space-y-2 pl-5 text-fg">
              <li>
                <span className="font-medium">Same lock, once.</span> Show a
                code here, paste it on the other device (5 minutes).
              </li>
              <li>
                <span className="font-medium">Send notes, whenever.</span> Copy
                the packet on the device that has the latest notes. Paste or
                open it on the other.
              </li>
            </ol>
            {connected ? (
              <p className="text-xs text-subtle">
                This device has the lock{vault ? ` · ${vault.id}` : ""}.
              </p>
            ) : (
              <p className="text-xs text-subtle">No lock on this device yet.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => void showCode()}>
                <QrCode className="size-3.5" />
                {connected ? "Invite another device" : "1. Show a code"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setPaste("");
                  setError(null);
                  setMode("enter");
                }}
              >
                <Smartphone className="size-3.5" />
                1. Enter a code
              </Button>
            </div>
            {connected ? (
              <div className="space-y-3 rounded-2xl bg-fg/4 px-3 py-3">
                <p className="text-fg">2. Move notes</p>
                <p>
                  WhatsApp, AirDrop, USB, email-to-self, or a file — anything
                  that gets the packet to the other screen. Wisp never phones
                  home.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => void prepareSend()}>
                    Send notes
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPaste("");
                      setError(null);
                      setMode("receive");
                    }}
                  >
                    Receive notes
                  </Button>
                </div>
                <button
                  type="button"
                  className="text-xs text-subtle hover:text-fg"
                  onClick={() => {
                    clearVault();
                    setConnected(false);
                    toast("Lock forgotten on this device");
                  }}
                >
                  Forget lock
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {mode === "offer" ? (
          <div className="space-y-4">
            <p className="text-fg">
              This QR is only the lock — it does not contain your notes. Paste
              the code on the other device within 5 minutes.
            </p>
            <div
              className="mx-auto max-w-56 overflow-hidden rounded-2xl"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="break-all text-center font-mono text-xs leading-relaxed tracking-wide text-fg">
              {code}
            </p>
            <div className="flex justify-center gap-2">
              <Button type="button" size="sm" onClick={() => void copyText(code, "Code copied")}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy code"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setMode("home")}>
                Done
              </Button>
            </div>
            <p>
              Then come back here → Send notes. On the other device → Receive
              notes.
            </p>
          </div>
        ) : null}

        {mode === "enter" ? (
          <div className="space-y-4">
            <p className="text-fg">Paste the WISP.… lock from the other device.</p>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder="WISP.…"
              className="h-24 w-full rounded-xl bg-fg/6 px-3 py-2 font-mono text-xs text-fg placeholder:text-subtle focus:outline-none"
            />
            {error ? <p className="text-danger">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => void enterCode()}>
                Use this lock
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setMode("home")}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {mode === "send" ? (
          <div className="space-y-4">
            <p className="text-fg">
              Copy this packet, share it, or save the file. Open it in Receive
              notes on the other device.
            </p>
            {packetQr ? (
              <div
                className="mx-auto max-w-56 overflow-hidden rounded-2xl"
                dangerouslySetInnerHTML={{ __html: packetQr }}
              />
            ) : (
              <p className="text-xs">
                Too many notes to fit in a QR. Copy the packet or save the file
                instead.
              </p>
            )}
            <textarea
              readOnly
              value={packet}
              className="h-28 w-full rounded-xl bg-fg/6 px-3 py-2 font-mono text-[10px] text-fg focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => void copyText(packet, "Packet copied")}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                Copy packet
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void sharePacket()}>
                Share / save file
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setMode("home")}>
                Done
              </Button>
            </div>
          </div>
        ) : null}

        {mode === "receive" ? (
          <div className="space-y-4">
            <p className="text-fg">
              Paste the packet, or open the file the other device sent you.
            </p>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder="Paste the Wisp packet here"
              className="h-28 w-full rounded-xl bg-fg/6 px-3 py-2 font-mono text-[10px] text-fg placeholder:text-subtle focus:outline-none"
            />
            {error ? <p className="text-danger">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => void onReceivePaste()}>
                Merge pasted packet
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                Open file
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setError(null);
                  setMode("home");
                }}
              >
                Cancel
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void onReceiveFile(file);
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
