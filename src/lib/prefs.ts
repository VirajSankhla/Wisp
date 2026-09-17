export type Density = "compact" | "regular" | "large";

export type Prefs = {
  density: Density;
  overlayRows: 3 | 4 | 5;
};

const KEY = "wisp.prefs.v1";

const DEFAULTS: Prefs = {
  density: "regular",
  overlayRows: 4,
};

export const DENSITY_META: Record<
  Density,
  { label: string; handle: number; heading: number; pad: number }
> = {
  compact: { label: "Compact", handle: 36, heading: 14, pad: 6 },
  regular: { label: "Regular", handle: 44, heading: 16, pad: 8 },
  large: { label: "Large", handle: 56, heading: 18, pad: 10 },
};

export function loadPrefs(): Prefs {
  if (typeof localStorage === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    const density: Density =
      parsed.density === "compact" || parsed.density === "large"
        ? parsed.density
        : "regular";
    const overlayRows: 3 | 4 | 5 =
      parsed.overlayRows === 3 || parsed.overlayRows === 5 ? parsed.overlayRows : 4;
    return { density, overlayRows };
  } catch {
    return { ...DEFAULTS };
  }
}

export function savePrefs(prefs: Prefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
  applyPrefs(prefs);
}

export function overlayListMax(prefs: Prefs) {
  const meta = DENSITY_META[prefs.density];
  const row = meta.pad * 2 + Math.round(meta.heading * 1.35) + 6;
  return prefs.overlayRows * row;
}

export function applyPrefs(prefs: Prefs = loadPrefs()) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.wispDensity = prefs.density;
  document.documentElement.style.setProperty(
    "--overlay-list-max",
    `${overlayListMax(prefs)}px`,
  );
  document.documentElement.style.setProperty(
    "--overlay-heading",
    `${DENSITY_META[prefs.density].heading}px`,
  );
}
