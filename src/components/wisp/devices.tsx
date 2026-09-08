"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, QrCode, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNotesStore } from "@/lib/notes/store";
import { pairingQrSvg } from "@/lib/pairing/qr";
import {
  consumeAccept,
  encodeEnvelope,
  makeAccept,
  parseAccept,
  parseOffer,
  PairingError,
  type PairAccept,
  type PairOffer,
} from "@/lib/pairing/session";
import {
  buildPeerSync,
  downloadPeerSync,
  verifyPeerSync,
} from "@/lib/pairing/sync";
import {
  clearOpenOffer,
  forgetTrusted,
  listTrusted,
  loadIdentity,
  loadOpenOffer,
  rememberTrusted,
  startOffer,
  type TrustedDevice,
} from "@/lib/pairing/store";

type Mode = "home" | "offer" | "scan" | "confirm" | "reply" | "connected" | "receive";

export function DevicesPanel({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>("home");
  const [trusted, setTrusted] = useState<TrustedDevice[]>([]);
  const [code, setCode] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [replySvg, setReplySvg] = useState("");
  const [replyText, setReplyText] = useState("");
  const [paste, setPaste] = useState("");
  const [pendingOffer, setPendingOffer] = useState<PairOffer | null>(null);
  const [name, setName] = useState("Wisp");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function refreshTrusted() {
    setTrusted(listTrusted());
  }

  useEffect(() => {
    refreshTrusted();
    void loadIdentity().then((id) => setName(id.name));
  }, []);

  async function showOffer() {
    setError(null);
    const started = await startOffer();
    setCode(started.code);
    setQrSvg(pairingQrSvg(started.qr));
    setMode("offer");
  }

  async function onPasteOffer() {
    setError(null);
    try {
      const offer = parseOffer(paste);
      setPendingOffer(offer);
      setMode("confirm");
    } catch (err) {
      setError(err instanceof PairingError ? err.message : "Could not read that code");
    }
  }

  async function confirmConnect() {
    if (!pendingOffer) return;
    setError(null);
    try {
      const me = await loadIdentity();
      const accept: PairAccept = await makeAccept(me, pendingOffer);
      rememberTrusted(pendingOffer.device);
      refreshTrusted();
      const encoded = encodeEnvelope(accept);
      setReplyText(encoded);
      setReplySvg(pairingQrSvg(encoded));
      setMode("reply");
    } catch (err) {
      setError(err instanceof PairingError ? err.message : "Pairing failed");
    }
  }

  async function finishHost() {
    setError(null);
    try {
      const stored = loadOpenOffer();
      if (!stored) throw new PairingError("No open pairing on this device");
      const accept = parseAccept(paste);
      const peer = await consumeAccept(stored, accept);
      rememberTrusted(peer);
      clearOpenOffer();
      refreshTrusted();
      setMode("connected");
      toast(`Connected to ${peer.name}`);
    } catch (err) {
      setError(err instanceof PairingError ? err.message : "Could not confirm pairing");
    }
  }

  async function shareNotes() {
    const me = await loadIdentity();
    const bundle = await buildPeerSync(me, useNotesStore.getState().notes);
    downloadPeerSync(bundle);
    toast("Signed notes saved — open that file on the other device");
  }

  async function applySnapshot(raw: unknown) {
    const result = await verifyPeerSync(raw, listTrusted());
    if (!result.ok) {
      setError(result.error);
      toast(result.error);
      return;
    }
    const stats = useNotesStore.getState().mergeRemote(result.bundle.notes);
    setError(null);
    setMode("home");
    toast(
      stats.applied
        ? `Merged ${stats.applied} notes from ${result.bundle.from.name}`
        : `Nothing newer from ${result.bundle.from.name}`,
    );
  }

  async function onReceiveFile(file: File) {
    try {
      const raw: unknown = JSON.parse(await file.text());
      await applySnapshot(raw);
    } catch {
      const message = "Could not read that snapshot";
      setError(message);
      toast(message);
    }
  }

  async function onReceivePaste() {
    try {
      const raw: unknown = JSON.parse(paste);
      await applySnapshot(raw);
    } catch {
      setError("Paste the JSON snapshot from the other device");
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
        <h2 className="font-display text-lg tracking-tight">Devices</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-muted">
        {mode === "home" ? (
          <div className="space-y-4">
            <p className="text-fg">
              Pair your own machines. No account required. After they trust
              each other, save a signed snapshot and open it on the other
              device — that is how they share memory today.
            </p>
            <p className="text-xs text-subtle">{name}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => void showOffer()}>
                <QrCode className="size-3.5" />
                Connect a device
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setPaste("");
                  setError(null);
                  setMode("scan");
                }}
              >
                <Smartphone className="size-3.5" />
                I have a code
              </Button>
            </div>
            {trusted.length === 0 ? (
              <p>No paired devices yet.</p>
            ) : (
              <ul className="space-y-2">
                {trusted.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-fg/5 px-3 py-2"
                  >
                    <span className="truncate text-fg">{d.name}</span>
                    <button
                      type="button"
                      className="text-xs text-subtle hover:text-fg"
                      onClick={() => {
                        forgetTrusted(d.id);
                        refreshTrusted();
                      }}
                    >
                      Forget
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {trusted.length > 0 ? (
              <div className="space-y-3 rounded-2xl bg-fg/4 px-3 py-3">
                <p className="text-fg">Share memory</p>
                <p>
                  This writes a <span className="text-fg">wisp.peer-sync.v1</span>{" "}
                  file signed by this device. The other machine only accepts it
                  if it already paired with this key. Not live sync.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => void shareNotes()}>
                    Save signed notes
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
              </div>
            ) : null}
          </div>
        ) : null}

        {mode === "offer" ? (
          <div className="space-y-4">
            <p className="text-fg">Scan this with Wisp on your other device.</p>
            <div
              className="mx-auto max-w-56 overflow-hidden rounded-2xl"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="text-center font-mono text-xs tracking-wide text-fg">
              {code}
            </p>
            <p>
              After they confirm, paste their reply below so this machine can
              trust them too.
            </p>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder="Paste confirmation"
              className="h-20 w-full rounded-xl bg-fg/6 px-3 py-2 text-xs text-fg placeholder:text-subtle focus:outline-none"
            />
            {error ? <p className="text-danger">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => void finishHost()}>
                Confirm
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  clearOpenOffer();
                  setMode("home");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {mode === "scan" ? (
          <div className="space-y-4">
            <p className="text-fg">Paste the QR payload or the pairing code envelope.</p>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder="WISP1.…"
              className="h-24 w-full rounded-xl bg-fg/6 px-3 py-2 text-xs text-fg placeholder:text-subtle focus:outline-none"
            />
            {error ? <p className="text-danger">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => void onPasteOffer()}>
                Continue
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

        {mode === "confirm" && pendingOffer ? (
          <div className="space-y-4">
            <p className="font-display text-xl text-fg">
              Connect to “{pendingOffer.device.name}”?
            </p>
            <p>This stores a trusted key for that device. It is not an account.</p>
            {error ? <p className="text-danger">{error}</p> : null}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setPendingOffer(null);
                  setMode("home");
                }}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={() => void confirmConnect()}>
                Connect
              </Button>
            </div>
          </div>
        ) : null}

        {mode === "reply" ? (
          <div className="space-y-4">
            <p className="text-fg">Connected. Show this to the other device.</p>
            <div
              className="mx-auto max-w-56 overflow-hidden rounded-2xl"
              dangerouslySetInnerHTML={{ __html: replySvg }}
            />
            <textarea
              readOnly
              value={replyText}
              className="h-20 w-full rounded-xl bg-fg/6 px-3 py-2 text-xs text-fg focus:outline-none"
            />
            <Button type="button" size="sm" onClick={() => setMode("connected")}>
              Done
            </Button>
          </div>
        ) : null}

        {mode === "connected" ? (
          <div className="space-y-4">
            <p className="font-display text-2xl text-fg">Connected</p>
            <p>
              The devices trust each other. Save a signed notes file on one
              and receive it on the other to share memory. Live transport is
              not in this build — failed pairing never touches existing notes.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => void shareNotes()}>
                Save signed notes
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setMode("home")}
              >
                Back to devices
              </Button>
            </div>
          </div>
        ) : null}

        {mode === "receive" ? (
          <div className="space-y-4">
            <p className="text-fg">
              Open a signed snapshot from a device you already paired.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
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
            <p>Or paste the JSON.</p>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder='{"kind":"wisp.peer-sync.v1",…}'
              className="h-24 w-full rounded-xl bg-fg/6 px-3 py-2 text-xs text-fg placeholder:text-subtle focus:outline-none"
            />
            {error ? <p className="text-danger">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => void onReceivePaste()}>
                Merge
              </Button>
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
