import { cn } from "@/lib/utils";

/** Same three-bar index as the favicon — heading-first, not a mascot. */
export function WispMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("text-accent", className)}
    >
      <rect x="4" y="5.5" width="16" height="3.2" rx="1.6" fill="currentColor" />
      <rect
        x="4"
        y="10.4"
        width="12"
        height="3.2"
        rx="1.6"
        fill="currentColor"
        opacity="0.7"
      />
      <rect
        x="4"
        y="15.3"
        width="8"
        height="3.2"
        rx="1.6"
        fill="currentColor"
        opacity="0.42"
      />
    </svg>
  );
}
