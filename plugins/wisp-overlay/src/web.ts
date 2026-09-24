import { WebPlugin } from "@capacitor/core";
import type { WispOverlayPlugin } from "./definitions.ts";

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
  async resize(): Promise<void> {}
  async setLook(): Promise<void> {}
  async readStore(): Promise<{ value: string }> {
    return { value: "" };
  }
  async writeStore(): Promise<void> {}
  async storeRev(): Promise<{ value: number }> {
    return { value: 0 };
  }
}
