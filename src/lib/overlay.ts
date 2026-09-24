import { Capacitor } from "@capacitor/core";
import { WispOverlay } from "wisp-overlay";
import { isNativeBridgeNoise, logWispFault } from "@/lib/notes/fault-log";
import {
  collapseDesktopOverlay,
  isTauri,
  resizeDesktopOverlay,
} from "./desktop-overlay";

type NativeBridge = {
  collapse?: () => void;
  resize?: (width: number, height: number) => void;
  ready?: (width: number, height: number) => void;
  keepOpen?: () => void;
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
  if (isTauri()) {
    void collapseDesktopOverlay().catch(() => {});
    return;
  }
  try {
    native()?.collapse?.();
  } catch (err) {
    logWispFault(err instanceof Error ? err.message : "collapse failed");
  }
}

export function overlayKeepOpen() {
  try {
    native()?.keepOpen?.();
  } catch {
    /* overlay webview only */
  }
}

let resizeTimer = 0;
let overlayLocked = false;

export function unlockOverlaySize() {
  overlayLocked = false;
}

export function reportOverlaySize(el: HTMLElement) {
  if (overlayLocked) return;
  const bridge = native();
  const resize = bridge?.resize;
  if (!resize) return;
  const r = el.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(r.width));
  const height = Math.max(1, Math.ceil(r.height));
  if (typeof window !== "undefined") {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      try {
        resize(width, height);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!isNativeBridgeNoise(message)) logWispFault("Overlay resize failed", message);
      }
    }, 40);
  }
}

export function revealNativeOverlay(el: HTMLElement) {
  overlayLocked = false;
  const r = el.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(r.width));
  const height = Math.max(1, Math.ceil(r.height));
  if (isTauri()) {
    void resizeDesktopOverlay(width, height).catch(() => {});
    return;
  }
  const bridge = native();
  try {
    if (typeof bridge?.ready === "function") {
      bridge.ready(width, height);
      return;
    }
    bridge?.resize?.(width, height);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!isNativeBridgeNoise(message)) logWispFault("Overlay reveal failed", message);
  }
}

export { WispOverlay };
