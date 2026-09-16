"use client";

import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { logWispFault } from "@/lib/notes/fault-log";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try again.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const message = errorMessage(error);
  useEffect(() => {
    logWispFault(message);
  }, [message]);

  return (
    <main className="flex min-h-0 flex-col items-center justify-center gap-3 px-6 py-8 text-center text-fg">
      <span className="text-red-500" aria-hidden="true">
        <TriangleAlert className="size-8" strokeWidth={2} />
      </span>
      <h1 className="font-display text-lg">Something went wrong</h1>
      <p className="max-w-md text-sm break-words text-muted">{message}</p>
      <p className="max-w-xs text-xs text-subtle">
        A “Wisp log” note was written with this. Local notes are still on the
        device.
      </p>
    </main>
  );
}
