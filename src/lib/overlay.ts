import { Capacitor } from "@capacitor/core";
import { WispOverlay } from "wisp-overlay";
import { isNativeBridgeNoise, logWispFault } from "@/lib/notes/fault-log";

type NativeBridge = {
  collapse?: () => void;
  resize?: (width: number, height: number) => void;
  publishSnapshot?: (json: string) => void;
  takeIncoming?: () => string;
  localAddress?: () => string;
};

function native(): NativeBridge | undefined {
  const bridge = (window as Window & { WispNative?: NativeBridge }).WispNative;
  if (!bridge || typeof bridge !== "object") return undefined;
  if ("addListener" in bridge) return undefined;
  return bridge;
}

export function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function collapseNativeOverlay() {
  try {
    native()?.collapse?.();
  } catch (err) {
    logWispFault(err instanceof Error ? err.message : "collapse failed");
  }
}

export function reportOverlaySize(el: HTMLElement) {
  const bridge = native();
  if (!bridge || typeof bridge.resize !== "function") return;
  const r = el.getBoundingClientRect();
  try {
    bridge.resize(Math.max(1, Math.ceil(r.width)), Math.max(1, Math.ceil(r.height)));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!isNativeBridgeNoise(message)) logWispFault("Overlay resize failed", message);
  }
}

export async function lanAddress(): Promise<string> {
  try {
    const fromBridge = native()?.localAddress?.();
    if (fromBridge) return fromBridge;
    const result = await WispOverlay.localAddress();
    return result.value ?? "";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!isNativeBridgeNoise(message)) logWispFault("LAN address failed", message);
    return "";
  }
}

export async function publishLanSnapshot(json: string) {
  try {
    native()?.publishSnapshot?.(json);
  } catch {
    /* overlay webview only */
  }
  try {
    await WispOverlay.publishSnapshot({ json });
  } catch {
    /* web no-op */
  }
}

export async function takeLanIncoming(): Promise<string> {
  try {
    const fromBridge = native()?.takeIncoming?.();
    if (fromBridge) return fromBridge;
  } catch {
    /* ignore */
  }
  try {
    const result = await WispOverlay.takeIncoming();
    return result.value ?? "";
  } catch {
    return "";
  }
}

export { WispOverlay };
