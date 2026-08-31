import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { Wordmark, Ampersand } from "@/components/brand/Wordmark";
import { Sticker } from "@/components/ui/Sticker";
import { useApp } from "@/store/app";
import { play, unlockAudio } from "@/lib/sound";
import type { Side } from "@/store/app";

/**
 * §5.1 The fork. Two doors, one brand, and the choice is the whole page — no
 * nav, no hero carousel, no scroll before the decision. Choosing floods the
 * screen in that side's colour and locks the accent for the rest of the session.
 */
export default function Fork() {
  const navigate = useNavigate();
  const chooseSide = useApp((s) => s.chooseSide);
  const [flooding, setFlooding] = useState<Side | null>(null);

  function choose(side: Side, to: string) {
    unlockAudio();
    play("reveal");
    chooseSide(side);
    setFlooding(side);
    window.setTimeout(() => navigate(to), 420);
  }

  return (
    <div className="grain relative flex min-h-[100dvh] flex-col overflow-hidden bg-paper px-5 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        <div className="flex items-baseline gap-3">
          <Wordmark className="text-xl" />
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
            Become annoyingly capable.
          </span>
        </div>

        <h1 className="setup mt-8 text-2xl">
          Nobody
          <br />
          taught you
          <br />
          this.
        </h1>
        <p className="punchline mt-4">
          The bit between education and competence. Twelve units, no lectures, and a simulator that
          argues back.
        </p>

        <div className="relative mt-8 grid flex-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
          <Door
            colour="cyan"
            eyebrow="For employers"
            headline="I EMPLOY THEM."
            subhead="Please help."
            body="Cohorts, seat licences, capability reporting that isn't a completion percentage."
            onClick={() => choose("workplace", "/workplace")}
          />

          <div className="hidden items-center justify-center sm:flex">
            <Ampersand className="text-hero leading-none" />
          </div>

          <Door
            colour="acid"
            eyebrow="For you"
            headline="I AM THEM."
            subhead="I'd like to be better at life."
            body="Buy once. Ten units, a capability profile, and a certificate that means something."
            onClick={() => choose("yourself", "/yourself")}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Sticker colour="magenta" rotate={-3}>
            7-minute intake
          </Sticker>
          <Sticker colour="violet" rotate={2}>
            No streaks
          </Sticker>
          <Sticker colour="tangerine" rotate={-2}>
            No leaderboard
          </Sticker>
        </div>
      </div>

      {flooding && (
        <motion.div
          aria-hidden="true"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.42, ease: [0.7, 0, 0.3, 1] }}
          className="pointer-events-none fixed inset-0 z-50 origin-bottom"
          style={{ background: flooding === "workplace" ? "var(--cyan)" : "var(--acid)" }}
        />
      )}
    </div>
  );
}

function Door({
  colour,
  eyebrow,
  headline,
  subhead,
  body,
  onClick,
}: {
  colour: "cyan" | "acid";
  eyebrow: string;
  headline: string;
  subhead: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="loud-card group flex min-h-[190px] flex-col p-5 text-left transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-loud-press"
      style={{ background: colour === "cyan" ? "var(--cyan)" : "var(--acid)" }}
    >
      <span className="label text-ink">{eyebrow}</span>
      <span className="setup mt-2 block text-xl">{headline}</span>
      <span className="mt-1.5 block font-body text-md font-semibold">{subhead}</span>
      <span className="mt-auto block pt-4 font-body text-sm">{body}</span>
    </button>
  );
}
