import { motion } from "framer-motion";
import type { Copy } from "@/content/schema";
import { say, type BiteLevel } from "@/lib/copy";
import { Button } from "@/components/ui/Button";

type Props = {
  bite: BiteLevel;
  /** Omitted mid-simulator, where the consequence is the whole feedback. */
  verdict?: Copy;
  /** Omitted mid-simulator so the principle lands once, at the end. */
  principle?: Copy;
  /** Per-choice consequence, shown above the verdict when there is one. */
  consequence?: Copy;
  quality?: number;
  xpGained?: number;
  onContinue: () => void;
  continueLabel?: string;
};

/**
 * §10.3 The debrief is QUIET, always. It never says "wrong" — it says what
 * happened next, then names the principle. Colour is a 4px left rule and
 * nothing else, so a weak answer does not feel like a punishment screen.
 */
export function Debrief({
  bite,
  verdict,
  principle,
  consequence,
  quality,
  xpGained,
  onContinue,
  continueLabel = "Continue",
}: Props) {
  const strength =
    quality === undefined
      ? "var(--line)"
      : quality >= 0.85
        ? "var(--acid)"
        : quality >= 0.5
          ? "var(--cyan)"
          : "var(--tangerine)";

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      className="q-card mt-5 overflow-hidden"
      aria-live="polite"
    >
      <div className="border-l-4 p-4 sm:p-5" style={{ borderColor: strength }}>
        {consequence && (
          <>
            <p className="label">What happens next</p>
            <p className="mt-1.5 text-md">{say(consequence, bite)}</p>
          </>
        )}

        {verdict && (
          <>
            <p className={consequence ? "label mt-5" : "label"}>Debrief</p>
            <p className="mt-1.5 whitespace-pre-line text-md">{say(verdict, bite)}</p>
          </>
        )}

        {principle && (
          <>
            <p className="label mt-5">The principle</p>
            <p className="mt-1.5 font-display text-lg font-bold leading-tight">
              {say(principle, bite)}
            </p>
          </>
        )}

        <div className="mt-5 flex items-center justify-between gap-4">
          {xpGained !== undefined ? (
            <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
              +{xpGained} XP
            </span>
          ) : (
            <span />
          )}
          <Button onClick={onContinue}>{continueLabel}</Button>
        </div>
      </div>
    </motion.section>
  );
}
