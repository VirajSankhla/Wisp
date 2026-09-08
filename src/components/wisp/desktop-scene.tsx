"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { WispMark } from "./mark";

export function DesktopScene({ panelOpen }: { panelOpen?: boolean }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000 * 30);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="wisp-desk absolute inset-0" />
      <div className="wisp-grain absolute inset-0" />
      <div
        className={cn(
          "absolute top-1/5 left-8 max-w-xs transition-opacity duration-300 ease-smooth sm:left-12",
          panelOpen && "max-md:opacity-0",
        )}
      >
        <div className="flex items-center gap-2 text-muted">
          <WispMark className="size-5" />
          <span className="text-sm font-medium tracking-wide">Wisp</span>
        </div>
        <p className="mt-6 font-display text-4xl leading-tight tracking-tight text-fg sm:text-5xl">
          {format(now, "EEEE")}
          <span className="mt-1 block text-muted">{format(now, "d MMMM")}</span>
        </p>
        <p className="mt-5 max-w-xs text-sm leading-relaxed text-subtle">
          Notes that stay at the edge. Headings in the open, tags only when you
          search.
        </p>
      </div>
    </div>
  );
}
