import { registerPlugin } from "@capacitor/core";
import type { WispOverlayPlugin } from "./definitions";

const WispOverlay = registerPlugin<WispOverlayPlugin>("WispOverlay", {
  web: () => import("./web").then((m) => new m.WispOverlayWeb()),
});

export * from "./definitions";
export { WispOverlay };
