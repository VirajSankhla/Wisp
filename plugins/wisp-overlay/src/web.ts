import { WebPlugin } from "@capacitor/core";
import type { WispOverlayPlugin } from "./definitions";

export class WispOverlayWeb extends WebPlugin implements WispOverlayPlugin {
  async canDrawOverlays(): Promise<{ value: boolean }> {
    return { value: false };
  }
  async requestPermission(): Promise<void> {}
  async start(): Promise<void> {
    throw this.unimplemented("Overlay is Android-only.");
  }
  async stop(): Promise<void> {}
  async isRunning(): Promise<{ value: boolean }> {
    return { value: false };
  }
  async localAddress(): Promise<{ value: string }> {
    return { value: "" };
  }
  async publishSnapshot(): Promise<void> {}
  async takeIncoming(): Promise<{ value: string }> {
    return { value: "" };
  }
  async resize(): Promise<void> {}
}
