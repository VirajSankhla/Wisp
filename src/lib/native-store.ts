import { Capacitor } from "@capacitor/core";
import { WispOverlay } from "wisp-overlay";

type Bridge = {
  readStore?: (name: string) => string;
  writeStore?: (name: string, json: string) => void;
  storeRev?: () => number;
};

function bridge(): Bridge | undefined {
  if (typeof window === "undefined") return undefined;
  const native = (window as Window & { WispNative?: Bridge }).WispNative;
  if (!native || typeof native !== "object") return undefined;
  if ("addListener" in native) return undefined;
  return native;
}

export function readNativeStore(name: string): string {
  try {
    const value = bridge()?.readStore?.(name);
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

export function writeNativeStore(name: string, json: string) {
  try {
    bridge()?.writeStore?.(name, json);
  } catch {
    /* overlay webview only */
  }
  if (Capacitor.isNativePlatform()) {
    void WispOverlay.writeStore({ name, json }).catch(() => {});
  }
}

export async function readNativeStoreAsync(name: string): Promise<string> {
  const sync = readNativeStore(name);
  if (sync) return sync;
  if (!Capacitor.isNativePlatform()) return "";
  try {
    const result = await WispOverlay.readStore({ name });
    return result.value ?? "";
  } catch {
    return "";
  }
}

export function nativeStoreRev(): number {
  try {
    const value = bridge()?.storeRev?.();
    return typeof value === "number" ? value : -1;
  } catch {
    return -1;
  }
}
