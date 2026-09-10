import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.wisp.notes",
  appName: "Wisp",
  webDir: "native-dist",
  android: {
    allowMixedContent: true,
  },
};

export default config;
