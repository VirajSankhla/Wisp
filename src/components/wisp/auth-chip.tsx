"use client";

import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Link } from "@tanstack/react-router";
import { Cloud, CloudOff } from "lucide-react";

export function AuthChip() {
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <div
        className="h-8 w-28 animate-pulse rounded-md bg-fg/6"
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      {user ? (
        <Cloud className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
      ) : (
        <CloudOff className="size-3.5 shrink-0 text-subtle" aria-hidden="true" />
      )}
      <span className="truncate text-xs text-muted">
        {user ? "Synced" : "On this device"}
      </span>
      <SignedIn>
        <div className="min-w-0 [&_span.text-sm]:max-w-[7rem] [&_span.text-sm]:truncate">
          <UserButton />
        </div>
      </SignedIn>
      <SignedOut>
        <Link
          to="/login"
          className="shrink-0 text-xs font-medium text-accent underline-offset-4 hover:underline"
        >
          Sync
        </Link>
      </SignedOut>
    </div>
  );
}
