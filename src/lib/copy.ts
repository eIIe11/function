import type { Copy } from "@/content/schema";

/**
 * §2.3 Bite level. B2C defaults to spicy, B2B to boardroom; an org admin can
 * enable spicy per cohort. Resolution happens in exactly one place so no
 * component can accidentally hard-code a register.
 */
export type BiteLevel = "spicy" | "boardroom";

export function say(copy: Copy, bite: BiteLevel): string {
  return copy[bite];
}

/** Default bite level for a side, before the learner or admin overrides it. */
export function defaultBite(side: "workplace" | "yourself"): BiteLevel {
  return side === "workplace" ? "boardroom" : "spicy";
}
