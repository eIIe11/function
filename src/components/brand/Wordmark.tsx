import clsx from "clsx";

/**
 * §2.2 The full stop is not punctuation, it is the logo. It is always acid and
 * always present — "FUNCTION" without it is not the name.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx("font-display font-extrabold uppercase tracking-[-0.02em]", className)}>
      FUNCTION<span className="text-acid">.</span>
    </span>
  );
}

/** The two-layer ampersand device: Workplace & Yourself, one brand. */
export function Ampersand({ className }: { className?: string }) {
  return <span className={clsx("amp", className)} aria-hidden="true">&amp;</span>;
}
