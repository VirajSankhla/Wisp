import { Capacitor } from "@capacitor/core";
import { WispOverlay } from "wisp-overlay";

export function isAndroidNative() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function collapseNativeOverlay() {
  const native = (window as Window & { WispNative?: { collapse?: () => void } })
    .WispNative;
  native?.collapse?.();
}

export { WispOverlay };
