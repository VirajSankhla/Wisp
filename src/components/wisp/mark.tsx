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
      className={cn(animate && "wisp-flame", className)}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M12 3c-2.4 3.2-6.6 7.2-6.6 11.2A6.6 6.6 0 0 0 12 20.8 6.6 6.6 0 0 0 18.6 14.2C18.6 10.2 14.4 6.2 12 3Z"
        fill="#FFFFFF"
      />
      <path
        className="wisp-flame-core"
        d="M12 8.2c-1.2 1.7-3.2 3.7-3.2 5.7A3.2 3.2 0 0 0 12 17.1a3.2 3.2 0 0 0 3.2-3.2c0-2-2-4-3.2-5.7Z"
        fill="#12110F"
        opacity="0.22"
      />
    </svg>
  );
}
