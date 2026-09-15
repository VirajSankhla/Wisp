import { fromB64, toB64 } from "./bytes.ts";
import { PairingError } from "./codes.ts";
import type { RemoteSync } from "./remote.ts";

export const INVITE_PREFIX = "WISP2.";

type InviteBody = {
  v: 2;
  s: string;
  u: string;
  h?: string;
};

export function encodeInvite(secret: Uint8Array, remote: RemoteSync): string {
  const body: InviteBody = {
    v: 2,
    s: toB64(secret),
    u: remote.url,
  };
  if (remote.header.trim()) body.h = remote.header.trim();
  return `${INVITE_PREFIX}${toB64(new TextEncoder().encode(JSON.stringify(body)))}`;
}

export function parseInvite(raw: string): { secret: Uint8Array; remote: RemoteSync } {
  const text = raw.trim().replace(/\s+/g, "");
  if (!text.startsWith(INVITE_PREFIX)) {
    throw new PairingError("That is not a Wisp invite");
  }
  let body: InviteBody;
  try {
    body = JSON.parse(
      new TextDecoder().decode(fromB64(text.slice(INVITE_PREFIX.length))),
    ) as InviteBody;
  } catch {
    throw new PairingError("That invite is damaged");
  }
  if (body.v !== 2 || !body.s || !body.u) {
    throw new PairingError("That invite is damaged");
  }
  const secret = fromB64(body.s);
  if (secret.length !== 48) throw new PairingError("That invite is damaged");
  return {
    secret,
    remote: { url: body.u, header: body.h ?? "" },
  };
}

export function isInviteShape(raw: string): boolean {
  return raw.trim().replace(/\s+/g, "").startsWith(INVITE_PREFIX);
}
