type Internals = {
  invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
};

function internals(): Internals | undefined {
  if (typeof window === "undefined") return undefined;
  const value = (window as Window & { __TAURI_INTERNALS__?: Internals })
    .__TAURI_INTERNALS__;
  if (!value || typeof value.invoke !== "function") return undefined;
  return value;
}

export function isTauri() {
  return Boolean(internals());
}

export async function startDesktopOverlay() {
  await internals()?.invoke("overlay_start");
}

export async function stopDesktopOverlay() {
  await internals()?.invoke("overlay_stop");
}

export async function desktopOverlayRunning() {
  const value = await internals()?.invoke("overlay_running");
  return Boolean(value);
}

export async function resizeDesktopOverlay(width: number, height: number) {
  await internals()?.invoke("overlay_resize", { width, height });
}

export async function collapseDesktopOverlay() {
  await internals()?.invoke("overlay_collapse");
}

export async function setDesktopOverlayLook(handle: number) {
  await internals()?.invoke("overlay_set_look", { handle });
}
