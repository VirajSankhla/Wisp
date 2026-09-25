import { cn } from "@/lib/utils";

export function WispMark({
  className,
  animate = false,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect
        x="3"
        y="4"
        width="13"
        height="16"
        rx="3"
        fill="#FFFFFF"
        fillOpacity="0.14"
        stroke="#FFFFFF"
        strokeOpacity="0.4"
      />
      <circle
        className={cn(animate && "wisp-mark-pulse")}
        cx="17.5"
        cy="12"
        r="5"
        fill="#FFFFFF"
      />
    </svg>
  );
}
