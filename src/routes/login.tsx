"use client";

import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { SignedIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { DesktopScene } from "@/components/wisp/desktop-scene";
import { WispMark } from "@/components/wisp/mark";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-bg p-6 text-fg">
      <DesktopScene />
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-bg-panel p-6 shadow-panel backdrop-blur-xl">
        <div className="flex items-center gap-2 text-muted">
          <WispMark className="size-5 text-accent" />
          <span className="text-sm font-medium">Wisp</span>
        </div>
        <h1 className="mt-5 font-display text-3xl leading-tight tracking-[-0.03em]">
          The same notes on every screen
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Notes already live on this device. Sign in only if you want a cloud
          copy. Pairing devices (no account) is the other path.
        </p>

        {isPending ? (
          <div className="mt-6 h-11 animate-pulse rounded-md bg-fg/6" />
        ) : user ? (
          <div className="mt-6 space-y-4">
            <SignedIn>
              <UserButton />
            </SignedIn>
            <Button asChild className="w-full">
              <Link to="/">Back to notes</Link>
            </Button>
          </div>
        ) : authEnabled ? (
          <div className="mt-6 flex flex-col gap-2">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                Continue with {p.label}
              </Button>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">Sign-in is disabled.</p>
        )}

        <p className="mt-5 text-center text-xs text-subtle">
          <Link to="/" className="underline-offset-4 hover:text-fg hover:underline">
            Keep using Wisp on this device
          </Link>
        </p>
      </div>
    </main>
  );
}
