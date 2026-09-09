import { cn } from "@/lib/utils";

export function DesktopScene({ panelOpen }: { panelOpen: boolean }) {
  return (
    <div className="wisp-desk pointer-events-none absolute inset-0 overflow-hidden">
      <div className="wisp-grain absolute inset-0" />
      <div
        className={cn(
          "absolute top-[18%] left-[12%] max-w-md transition-opacity duration-300 ease-smooth",
          panelOpen ? "opacity-100" : "opacity-40",
        )}
      >
        <p className="font-display text-4xl leading-tight tracking-tight text-fg/90 md:text-5xl">
          Write it down.
          <br />
          Let it sit at the edge.
        </p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
          No account. A heading, a tuck, and a connection code when you want
          the same memory on another screen.
        </p>
      </div>
    </div>
  );
}
