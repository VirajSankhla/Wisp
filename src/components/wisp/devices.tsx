"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, Copy, QrCode, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { AndroidOverlayCard } from "@/components/wisp/android-overlay";
import { DesktopOverlayCard } from "@/components/wisp/desktop-overlay";
import { Button } from "@/components/ui/button";
import { useNotesStore } from "@/lib/notes/store";
import {
  encodeConnectionCode,
  mintConnectionCode,
  parseConnectionCode,
  PairingError,
} from "@/lib/pairing/codes";
import { encodeInvite, isInviteShape, parseInvite } from "@/lib/pairing/invite";
import { pairingQrSvg } from "@/lib/pairing/qr";
import {
  buildJsonBinRemote,
  clearRemote,
  connectAndPush,
  loadRemote,
  parseJsonBinId,
  parseJsonBinKey,
  validateRemoteUrl,
} from "@/lib/pairing/remote";
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

type Mode = "home" | "offer" | "enter" | "send" | "receive" | "apiHelp";

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
  const [apiUrl, setApiUrl] = useState("");
  const [apiHeader, setApiHeader] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [binId, setBinId] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const jsonBinUrl = buildJsonBinRemote(binId, masterKey).url;

  useEffect(() => {
    setConnected(hasVault());
    const remote = loadRemote();
    if (!remote) return;
    setApiUrl(remote.url);
    setApiHeader(remote.header);
    if (/^https:\/\/api\.jsonbin\.io\/v3\/b\/[^/]+$/.test(remote.url)) {
      setBinId(parseJsonBinId(remote.url));
      setMasterKey(parseJsonBinKey(remote.header));
    } else if (remote.url) {
      setAdvanced(true);
    }
  }, []);

  async function persistApi() {
    const remote = advanced
      ? { url: validateRemoteUrl(apiUrl), header: apiHeader }
      : (() => {
          const built = buildJsonBinRemote(binId, masterKey);
          if (!built.url) throw new Error("Add the bin ID from jsonbin.io");
          return { url: validateRemoteUrl(built.url), header: built.header };
        })();
    const result = await connectAndPush(remote);
    setApiUrl(remote.url);
    setApiHeader(remote.header);
    setConnected(hasVault());
    return result;
  }

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
    let next: string;
    try {
      await persistApi();
      const remote = loadRemote();
      next = remote ? encodeInvite(secret, remote) : encodeConnectionCode(secret);
    } catch {
      next = encodeConnectionCode(secret);
    }
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
      if (isInviteShape(paste)) {
        const parsed = parseInvite(paste);
        await saveVaultFromSecret(parsed.secret);
        const sent = await connectAndPush(parsed.remote);
        setApiUrl(parsed.remote.url);
        setApiHeader(parsed.remote.header);
        setConnected(true);
        setMode("home");
        toast(
          sent === "pushed"
            ? "Connected. Notes on this phone are on the API."
            : "Connected. Could not reach the API yet.",
        );
        return;
      }
      const parsed = parseConnectionCode(paste);
      await saveVaultFromSecret(parsed.secret);
      if (apiUrl.trim()) {
        try {
          await persistApi();
        } catch {
          /* lock still saved */
        }
      }
      setConnected(true);
      setMode("home");
      toast("Same lock. Add the API URL on this device if you have not.");
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
              Optional. Wisp does not run a cloud. If you want both devices to
              keep matching over mobile data, point them at any JSON store you
              control. Notes stay encrypted on the way.
            </p>
            <AndroidOverlayCard />
            <DesktopOverlayCard />
            <div className="space-y-2">
              <p className="text-xs font-medium text-fg">API (optional)</p>
              <p className="text-xs text-subtle">
                jsonbin.io is the default free host. Saving it uploads the notes
                already on this device so the other side can see them.
              </p>
              <button
                type="button"
                className="text-left text-xs text-accent underline-offset-2 hover:underline"
                onClick={() => setMode("apiHelp")}
              >
                Full instructions on how to connect
              </button>
              {advanced ? (
                <>
                  <label className="text-xs text-subtle">API URL (GET + PUT JSON)</label>
                  <input
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://api.jsonbin.io/v3/b/…"
                    className="h-9 w-full rounded-xl bg-fg/6 px-3 font-mono text-xs text-fg placeholder:text-subtle focus:outline-none"
                  />
                  <label className="text-xs text-subtle">Optional header</label>
                  <input
                    value={apiHeader}
                    onChange={(e) => setApiHeader(e.target.value)}
                    placeholder="X-Master-Key: …"
                    className="h-9 w-full rounded-xl bg-fg/6 px-3 font-mono text-xs text-fg placeholder:text-subtle focus:outline-none"
                  />
                </>
              ) : (
                <>
                  <label className="text-xs text-subtle">Bin ID</label>
                  <input
                    value={binId}
                    onChange={(e) => setBinId(parseJsonBinId(e.target.value))}
                    placeholder="Paste the bin id or its URL"
                    className="h-9 w-full rounded-xl bg-fg/6 px-3 font-mono text-xs text-fg placeholder:text-subtle focus:outline-none"
                  />
                  <label className="text-xs text-subtle">Master key</label>
                  <input
                    value={masterKey}
                    onChange={(e) => setMasterKey(parseJsonBinKey(e.target.value))}
                    placeholder="Paste X-Master-Key"
                    className="h-9 w-full rounded-xl bg-fg/6 px-3 font-mono text-xs text-fg placeholder:text-subtle focus:outline-none"
                  />
                  {jsonBinUrl ? (
                    <p className="break-all font-mono text-[10px] text-subtle">{jsonBinUrl}</p>
                  ) : null}
                </>
              )}
              <button
                type="button"
                className="text-left text-xs text-subtle underline-offset-2 hover:underline"
                onClick={() => setAdvanced((v) => !v)}
              >
                {advanced ? "Use jsonbin.io instead" : "Use a different host"}
              </button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void (async () => {
                    try {
                      const sent = await persistApi();
                      toast(
                        sent === "pushed"
                          ? "API saved. Existing notes were sent."
                          : "API saved. Could not send notes yet — check the URL and key.",
                      );
                    } catch (err) {
                      toast(err instanceof Error ? err.message : "Could not save API");
                    }
                  })();
                }}
              >
                Save API
              </Button>
            </div>
            {connected ? (
              <p className="text-xs text-subtle">
                This device has the lock{vault ? ` · ${vault.id}` : ""}
                {apiUrl ? " · API saved" : " · no API yet"}.
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
                <p className="text-fg">No API, or offline</p>
                <p>
                  Send an encrypted packet. Same lock still required.
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
                    clearRemote();
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

        {mode === "apiHelp" ? (
          <div className="space-y-4 text-sm leading-relaxed">
            <p className="text-fg">Connect an API (JSONBin)</p>
            <p>
              Wisp does not host your notes. An API is only a box both devices
              can GET and PUT. The payload is encrypted. You do not need an
              API for one device.
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-muted">
              <li>
                Open{" "}
                <span className="text-fg">jsonbin.io</span>, create a bin,
                leave the body as <span className="font-mono text-fg">{"{}"}</span>.
              </li>
              <li>
                Copy the bin id and the <span className="text-fg">X-Master-Key</span>{" "}
                — paste each straight into its field. Wisp builds the URL and
                header for you.
              </li>
              <li>
                Tap <span className="text-fg">Save API</span>. Wisp uploads the
                notes already on this device, then keeps them matching.
              </li>
              <li>
                Tap <span className="text-fg">Show a code</span> and scan it on
                the other device. The QR carries the lock and the URL.
              </li>
            </ol>
            <p className="text-xs text-subtle">
              Using a different host? Tap{" "}
              <span className="text-fg">Use a different host</span> on the
              Devices screen for a raw URL + header field — any host that
              accepts GET and PUT of JSON works, with one optional header as{" "}
              <span className="font-mono">Name: value</span>.
            </p>
            <Button type="button" size="sm" onClick={() => setMode("home")}>
              Back to Devices
            </Button>
          </div>
        ) : null}

        {mode === "offer" ? (
          <div className="space-y-4">
            <p className="text-fg">
              Scan or paste this on the other device. If you saved an API, the
              QR carries that URL too — they do not need the same Wi-Fi.
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
              Short WISP. codes are only the lock. WISP2. invites include the
              API. Packet send is the offline fallback.
            </p>
          </div>
        ) : null}

        {mode === "enter" ? (
          <div className="space-y-4">
            <p className="text-fg">Paste a WISP. lock or a WISP2. invite.</p>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder="WISP.… or WISP2.…"
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
