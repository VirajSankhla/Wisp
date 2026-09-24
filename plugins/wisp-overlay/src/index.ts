import { registerPlugin } from "@capacitor/core";
import type { WispOverlayPlugin } from "./definitions.ts";

const WispOverlay = registerPlugin<WispOverlayPlugin>("WispOverlay", {
  web: () => import("./web.ts").then((m) => new m.WispOverlayWeb()),
});

export * from "./definitions.ts";
export { WispOverlay };
