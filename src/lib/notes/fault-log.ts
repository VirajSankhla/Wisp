import { useNotesStore } from "./store.ts";

export const FAULT_LOG_ID = "wisp.fault-log";

let last = { at: 0, message: "" };

export function isNativeBridgeNoise(message: string) {
  return /error invoking resize|non-injected object|java bridge method/i.test(
    message,
  );
}

export function logWispFault(message: string, extra?: string) {
  const text = [message.trim(), extra?.trim()].filter(Boolean).join("\n");
  if (!text) return;
  const now = Date.now();
  if (text === last.message && now - last.at < 5000) return;
  last = { at: now, message: text };
  try {
    useNotesStore.getState().appendFaultLog(text);
  } catch {
    /* store not ready */
  }
}

export function installFaultLogger() {
  if (typeof window === "undefined") return () => {};
  const onError = (event: ErrorEvent) => {
    const message = event.message || "Unknown error";
    logWispFault(message, event.filename ? `${event.filename}:${event.lineno}` : "");
    if (isNativeBridgeNoise(message)) event.preventDefault();
  };
  const onReject = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "Unhandled rejection";
    logWispFault(message);
    if (isNativeBridgeNoise(message)) event.preventDefault();
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onReject);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onReject);
  };
}
