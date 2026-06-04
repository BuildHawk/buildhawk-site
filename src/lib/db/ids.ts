/**
 * Short prefixed IDs. Greppable in logs, URL-safe, collision-resistant.
 * Uses crypto.randomUUID slices for portability (no external nanoid dep).
 */

import { randomBytes } from "node:crypto";

const ALPHA = "0123456789abcdefghijkmnpqrstuvwxyz"; // no l, o for clarity

function nano(len = 16) {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHA[bytes[i]! % ALPHA.length];
  return out;
}

export const ids = {
  tenant: () => `ten_${nano(16)}`,
  user: () => `usr_${nano(16)}`,
  membership: () => `mem_${nano(16)}`,
  invite: () => `inv_${nano(16)}`,
  integration: () => `int_${nano(16)}`,
  magicLink: () => `mgl_${nano(20)}`,
  audit: () => `aud_${nano(16)}`,
  usage: () => `usg_${nano(16)}`,
  article: () => `art_${nano(16)}`,
};

export function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  if (!base) return `tenant-${nano(6)}`;
  return `${base}-${nano(4)}`;
}
