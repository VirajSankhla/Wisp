"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Copy, QrCode, Smartphone } from "lucide-react";
import { toast } from "sonner";
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
  openPeerSync,
} from "@/lib/pairing/sync";
import {
  clearVault,
  hasVault,
  loadVault,
  saveVaultFromSecret,
  vaultSecret,
} from "@/lib/pairing/vault";

type Mode = "home" | "offer" | "enter" | "receive";

export function DevicesPanel({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>("home");
  const [connected, setConnected] = useState(false);
  const [code, setCode] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [paste, setPaste] = useState("");
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

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast("Code copied");
    } catch {
      toast("Select the code and copy it");
    }
  }

  async function enterCode() {
    setError(null);
    try {
      const parsed = parseConnectionCode(paste);
      await saveVaultFromSecret(parsed.secret);
      setConnected(true);
      setMode("home");
      toast("Connected — this device shares that Wisp memory");
    } catch (err) {
      setError(err instanceof PairingError ? err.message : "Could not use that code");
    }
  }

  async function shareNotes() {
    try {
      const bundle = await buildPeerSync(useNotesStore.getState().notes);
      downloadPeerSync(bundle);
      toast("Encrypted notes saved — open that file on the other device");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Connect a device first");
    }
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
          <div className="space-y-4">
            <p className="text-fg">
              Connect your own machines with a one-time code or QR. No Google.
              No X. No account.
            </p>
            {connected ? (
              <p className="text-xs text-subtle">
                This device is connected
                {vault ? ` · ${vault.id}` : ""}.
              </p>
            ) : (
              <p>Not connected yet.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => void showCode()}>
                <QrCode className="size-3.5" />
                {connected ? "Invite another device" : "Show a code"}
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
                Enter a code
              </Button>
            </div>
            {connected ? (
              <div className="space-y-3 rounded-2xl bg-fg/4 px-3 py-3">
                <p className="text-fg">Share memory</p>
                <p>
                  Save an encrypted snapshot and open it on the other device.
                  Both must have used the same connection code.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => void shareNotes()}>
                    Save notes for the other device
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
                    toast("Connection forgotten on this device");
                  }}
                >
                  Forget connection
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {mode === "offer" ? (
          <div className="space-y-4">
            <p className="text-fg">
              Scan this QR on your other device, or copy the code and paste it
              there. It expires in 5 minutes.
            </p>
            <div
              className="mx-auto max-w-56 overflow-hidden rounded-2xl"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="break-all text-center font-mono text-xs leading-relaxed tracking-wide text-fg">
              {code}
            </p>
            <div className="flex justify-center gap-2">
              <Button type="button" size="sm" onClick={() => void copyCode()}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy code"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setMode("home")}
              >
                Done
              </Button>
            </div>
            <p>
              On the other screen: Devices → Enter a code. After that, save
              notes here and receive them there.
            </p>
          </div>
        ) : null}

        {mode === "enter" ? (
          <div className="space-y-4">
            <p className="text-fg">
              Paste the WISP.… code from your other device.
            </p>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder="WISP.…"
              className="h-24 w-full rounded-xl bg-fg/6 px-3 py-2 font-mono text-xs text-fg placeholder:text-subtle focus:outline-none"
            />
            {error ? <p className="text-danger">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => void enterCode()}>
                Connect
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setMode("home")}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {mode === "receive" ? (
          <div className="space-y-4">
            <p className="text-fg">
              Open the encrypted snapshot from a device that used the same
              code.
            </p>
            <Button type="button" size="sm" onClick={() => fileRef.current?.click()}>
              Choose file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void onReceiveFile(file);
              }}
            />
            {error ? <p className="text-danger">{error}</p> : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setError(null);
                setMode("home");
              }}
            >
              Cancel
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
