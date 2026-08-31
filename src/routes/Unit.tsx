import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { getUnit } from "@/content/units";
import { say } from "@/lib/copy";
import { useApp } from "@/store/app";
import { Button } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Sticker";
import { ItemRenderer } from "@/components/activities/ItemRenderer";
import { Simulator } from "@/components/activities/Simulator";
import { allCompetencyScores, bandFor, levelFor } from "@/lib/scoring";
import competencies from "@/content/competencies.json";

type Step =
  | { kind: "cold_open" }
  | { kind: "idea" }
  | { kind: "science" }
  | { kind: "recognise"; index: number }
  | { kind: "simulator"; index: number }
  | { kind: "mess" }
  | { kind: "build_it" }
  | { kind: "revisit" }
  | { kind: "close" };

/**
 * §7.4 The unit loop, in order: cold open, idea, science, recognise, simulate,
 * mess, build it, revisit the cold open, close. Every step writes to the store
 * as it completes so closing the tab loses nothing.
 */
export default function Unit() {
  const { unitId } = useParams();
  const unit = getUnit(unitId ?? "");
  const bite = useApp((s) => s.bite);
  const answers = useApp((s) => s.answers);
  const events = useApp((s) => s.events);
  const xp = useApp((s) => s.xp);
  const recordScore = useApp((s) => s.recordScore);
  const awardBadge = useApp((s) => s.awardBadge);
  const [step, setStep] = useState<Step>({ kind: "cold_open" });

  if (!unit) {
    return (
      <div>
        <h1 className="setup text-xl">Not a unit</h1>
        <Link to="/learn" className="mt-4 inline-block">
          <Button>Back to units</Button>
        </Link>
      </div>
    );
  }

  const steps: Step[] = [
    { kind: "cold_open" },
    { kind: "idea" },
    { kind: "science" },
    ...unit.recognise.map((_, index) => ({ kind: "recognise", index }) as Step),
    ...unit.simulator.map((_, index) => ({ kind: "simulator", index }) as Step),
    { kind: "mess" },
    { kind: "build_it" },
    { kind: "revisit" },
    { kind: "close" },
  ];
  const position = steps.findIndex((s) => JSON.stringify(s) === JSON.stringify(step));

  function advance() {
    const next = steps[position + 1];
    if (next) {
      setStep(next);
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="label">
          Unit {String(unit.number).padStart(2, "0")} · {stepLabel(step)}
        </span>
        <span className="font-mono text-xs text-muted">
          {position + 1}/{steps.length}
        </span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-track">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${((position + 1) / steps.length) * 100}%` }}
        />
      </div>

      <motion.div
        key={JSON.stringify(step)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-5"
      >
        {step.kind === "cold_open" && (
          <>
            <h1 className="setup text-xl">{say(unit.title, bite)}</h1>
            <p className="punchline mt-2">{say(unit.subtitle, bite)}</p>
            <div className="mt-5">
              <ItemRenderer item={unit.cold_open} bite={bite} onDone={advance} />
            </div>
          </>
        )}

        {step.kind === "idea" && (
          <article className="max-w-read">
            <h2 className="setup text-xl">{say(unit.idea.heading, bite)}</h2>
            {unit.idea.blocks.map((block, i) => (
              <section key={i} className="mt-5">
                {block.heading && (
                  <h3 className="font-display text-lg font-extrabold leading-tight">
                    {say(block.heading, bite)}
                  </h3>
                )}
                <p className="mt-2 whitespace-pre-line text-md">{say(block.body, bite)}</p>
              </section>
            ))}
            <Button full size="lg" className="mt-6" onClick={advance}>
              Continue
            </Button>
          </article>
        )}

        {step.kind === "science" && (
          <article className="max-w-read">
            <h2 className="setup text-xl">{say(unit.science.heading, bite)}</h2>
            <ul className="mt-5 space-y-3">
              {unit.science.findings.map((finding) => (
                <li key={finding.effect} className="q-card p-4">
                  <p className="font-display text-lg font-bold leading-tight">{finding.effect}</p>
                  <p className="mt-1.5 text-md">{say(finding.body, bite)}</p>
                  <p className="mt-2 font-mono text-xs text-muted">{finding.citation}</p>
                </li>
              ))}
            </ul>
            <Button full size="lg" className="mt-6" onClick={advance}>
              Continue
            </Button>
          </article>
        )}

        {step.kind === "recognise" && (
          <ItemRenderer
            key={unit.recognise[step.index].id}
            item={unit.recognise[step.index]}
            bite={bite}
            onDone={advance}
          />
        )}

        {step.kind === "simulator" && (
          <Simulator
            key={unit.simulator[step.index].id}
            scenario={unit.simulator[step.index]}
            bite={bite}
            onComplete={(quality) => {
              recordScore({
                itemId: unit.simulator[step.index].id,
                quality,
                weights: unit.simulator[step.index].competency_weights,
                difficulty: "core",
              });
              advance();
            }}
          />
        )}

        {step.kind === "mess" && <ItemRenderer item={unit.mess} bite={bite} onDone={advance} />}

        {step.kind === "build_it" && (
          <ItemRenderer item={unit.build_it} bite={bite} onDone={advance} />
        )}

        {step.kind === "revisit" && (
          <Revisit
            unitId={unit.id}
            previousQuality={answers[unit.cold_open.id] as number | undefined}
            promptTitle={say(unit.cold_open.prompt, bite)}
            onContinue={() => {
              awardBadge("honest-cold-open");
              advance();
            }}
          />
        )}

        {step.kind === "close" && (
          <Close
            principle={say(unit.close.principle, bite)}
            xp={xp}
            events={events}
            onFinish={() => awardBadge("nobody-came")}
          />
        )}
      </motion.div>
    </div>
  );
}

function stepLabel(step: Step): string {
  switch (step.kind) {
    case "cold_open":
      return "Cold open";
    case "idea":
      return "The idea";
    case "science":
      return "The science bit";
    case "recognise":
      return "Recognise it";
    case "simulator":
      return "Simulator";
    case "mess":
      return "The mess";
    case "build_it":
      return "Build it";
    case "revisit":
      return "Back to the top";
    case "close":
      return "Close";
  }
}

/** §7.4.7 The cold open comes back. The unit's argument is the difference. */
function Revisit({
  promptTitle,
  previousQuality,
  onContinue,
}: {
  unitId: string;
  promptTitle: string;
  previousQuality?: number;
  onContinue: () => void;
}) {
  return (
    <div>
      <h2 className="setup text-xl">Remember this?</h2>
      <p className="mt-3 whitespace-pre-line text-md text-muted">{promptTitle}</p>
      <div className="q-card mt-5 border-l-4 border-l-accent p-4">
        <p className="label">Then</p>
        <p className="mt-1 text-md">
          {previousQuality === undefined
            ? "You skipped it."
            : previousQuality >= 0.85
              ? "You picked the strongest option before we taught you anything, which means the instinct was already there."
              : "You picked an option that keeps you waiting for someone else to move."}
        </p>
        <p className="label mt-4">Now</p>
        <p className="mt-1 text-md">
          Three moves: search the exact wording, find a previous example, write the blocker in one
          sentence. Then ask — with progress attached.
        </p>
      </div>
      <Button full size="lg" className="mt-6" onClick={onContinue}>
        Finish the unit
      </Button>
    </div>
  );
}

function Close({
  principle,
  xp,
  events,
  onFinish,
}: {
  principle: string;
  xp: number;
  events: Parameters<typeof allCompetencyScores>[0];
  onFinish: () => void;
}) {
  const scores = allCompetencyScores(events);
  const { level, next, progress } = levelFor(xp);

  return (
    <div>
      <div className="loud-card grain relative overflow-hidden p-5">
        <p className="label">Unit complete</p>
        <p className="setup mt-2 text-xl">{principle}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Sticker rotate={-4}>{xp} XP</Sticker>
          <Sticker colour="violet" rotate={3}>
            {level.name}
          </Sticker>
        </div>
        {next && (
          <>
            <div className="mt-4 h-1.5 rounded-full bg-track">
              <div
                className="h-full rounded-full bg-magenta"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="label mt-2">
              {next.xp - xp} XP to {next.name}
            </p>
          </>
        )}
      </div>

      <h3 className="setup mt-8 text-lg">Where you moved</h3>
      <ul className="mt-3 space-y-2">
        {competencies.competencies.map((competency) => {
          const score = scores[competency.code as keyof typeof scores];
          if (score === null) return null;
          return (
            <li key={competency.code} className="q-card flex items-baseline justify-between p-3.5">
              <span className="text-sm font-semibold">{competency.name}</span>
              <span className="font-mono text-xs text-muted">
                {score} · {bandFor(score).label}
              </span>
            </li>
          );
        })}
      </ul>

      <Link to="/learn" className="mt-6 block" onClick={onFinish}>
        <Button full size="lg">
          Back to units
        </Button>
      </Link>
    </div>
  );
}
