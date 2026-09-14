import { Capacitor } from "@capacitor/core";
import { WispOverlay } from "wisp-overlay";

type NativeBridge = {
  collapse?: () => void;
  resize?: (width: number, height: number) => void;
  publishSnapshot?: (json: string) => void;
  takeIncoming?: () => string;
  localAddress?: () => string;
};

function native(): NativeBridge | undefined {
  return (window as Window & { WispNative?: NativeBridge }).WispNative;
}

export function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function collapseNativeOverlay() {
  native()?.collapse?.();
}

export function reportOverlaySize(el: HTMLElement) {
  const resize = native()?.resize;
  if (!resize) return;
  const r = el.getBoundingClientRect();
  resize(Math.max(1, Math.ceil(r.width)), Math.max(1, Math.ceil(r.height)));
}

export async function lanAddress(): Promise<string> {
  const fromBridge = native()?.localAddress?.();
  if (fromBridge) return fromBridge;
  try {
    const result = await WispOverlay.localAddress();
    return result.value ?? "";
  } catch {
    return "";
  }
}

export async function publishLanSnapshot(json: string) {
  native()?.publishSnapshot?.(json);
  try {
    await WispOverlay.publishSnapshot({ json });
  } catch {
    /* web no-op */
  }
}

export async function takeLanIncoming(): Promise<string> {
  const fromBridge = native()?.takeIncoming?.();
  if (fromBridge) return fromBridge;
  try {
    const result = await WispOverlay.takeIncoming();
    return result.value ?? "";
  } catch {
    return "";
  }
}

export { WispOverlay };
