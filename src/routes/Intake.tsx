import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { intake, STAR_SIGNS } from "@/content/intake";
import { say } from "@/lib/copy";
import { defaultSettingFrom, typeCodeFrom, typeDescriptionFor } from "@/lib/intake";
import { play } from "@/lib/sound";
import { useApp } from "@/store/app";
import { Button } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Sticker";
import { WeightedMCQ } from "@/components/activities/WeightedMCQ";
import { Wordmark } from "@/components/brand/Wordmark";
import { allCompetencyScores, bandFor } from "@/lib/scoring";
import competencies from "@/content/competencies.json";

type Stage = "intro" | "pairs" | "defaults" | "baseline" | "star" | "result";

/**
 * §6.5 The seven-minute intake. One decision per screen, thumb-reachable, and a
 * progress bar that tells the truth about how much is left — the most common
 * reason people abandon an assessment is not knowing.
 */
export default function Intake() {
  const bite = useApp((s) => s.bite);
  const completeIntake = useApp((s) => s.completeIntake);
  const recordScore = useApp((s) => s.recordScore);
  const events = useApp((s) => s.events);

  const [stage, setStage] = useState<Stage>("intro");
  const [pairAnswers, setPairAnswers] = useState<Record<string, string>>({});
  const [pairIndex, setPairIndex] = useState(0);
  const [settingVotes, setSettingVotes] = useState<number[]>([]);
  const [settingIndex, setSettingIndex] = useState(0);
  const [baselineIndex, setBaselineIndex] = useState(0);
  const [starSign, setStarSign] = useState<string | null>(null);

  const totalSteps = intake.pairs.length + intake.default_setting_items.length + intake.baseline.length + 1;
  const doneSteps =
    Object.keys(pairAnswers).length + settingVotes.length + baselineIndex + (starSign ? 1 : 0);

  const typeCode = useMemo(() => typeCodeFrom(pairAnswers), [pairAnswers]);
  const description = typeDescriptionFor(typeCode);
  const setting = defaultSettingFrom(settingVotes);

  if (stage === "intro") {
    return (
      <Frame>
        <span className="label">The intake</span>
        <h1 className="setup mt-2 text-2xl">
          Seven
          <br />
          minutes.
        </h1>
        <p className="punchline mt-4">
          Twelve forced choices, six questions about what you do by default, and twelve situations
          with no obvious right answer. At the end you get a four-letter code and a starting profile.
        </p>
        <ul className="mt-5 space-y-2.5">
          {[
            "There are no trick questions and no timer.",
            "The situations are graded on a continuum. Most options are defensible; some are more defensible.",
            "Your employer never sees the intake — only the competency bands, and only if you're on a cohort.",
          ].map((line) => (
            <li key={line} className="q-card p-3.5 text-sm">
              {line}
            </li>
          ))}
        </ul>
        <Button full size="lg" className="mt-6" onClick={() => setStage("pairs")}>
          Begin
        </Button>
      </Frame>
    );
  }

  if (stage === "pairs") {
    const pair = intake.pairs[pairIndex];
    return (
      <Frame progress={doneSteps / totalSteps}>
        <span className="label">
          Forced choice · {pairIndex + 1} of {intake.pairs.length}
        </span>
        <p className="mt-2 font-display text-lg font-bold">Which is more you? Pick fast.</p>

        <AnimatePresence mode="wait">
          <motion.div
            key={pair.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.16 }}
            className="mt-4 grid gap-3"
          >
            {(["a", "b"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setPairAnswers((a) => ({ ...a, [pair.id]: key }));
                  play("tap");
                  if (pairIndex + 1 >= intake.pairs.length) setStage("defaults");
                  else setPairIndex((i) => i + 1);
                }}
                className="loud-card min-h-[104px] p-4 text-left font-display text-lg font-bold leading-snug"
              >
                {say(pair[key].label, bite)}
              </button>
            ))}
          </motion.div>
        </AnimatePresence>
      </Frame>
    );
  }

  if (stage === "defaults") {
    const item = intake.default_setting_items[settingIndex];
    return (
      <Frame progress={doneSteps / totalSteps}>
        <span className="label">
          Default setting · {settingIndex + 1} of {intake.default_setting_items.length}
        </span>
        <p className="mt-2 whitespace-pre-line text-md">{say(item.prompt, bite)}</p>
        <ul className="mt-4 space-y-2.5">
          {item.options.map((option, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  setSettingVotes((v) => [...v, option.setting]);
                  play("tap");
                  if (settingIndex + 1 >= intake.default_setting_items.length) setStage("baseline");
                  else setSettingIndex((index) => index + 1);
                }}
                className="q-card min-h-[56px] w-full px-4 py-3.5 text-left text-md"
              >
                {say(option.label, bite)}
              </button>
            </li>
          ))}
        </ul>
      </Frame>
    );
  }

  if (stage === "baseline") {
    const item = intake.baseline[baselineIndex];
    return (
      <Frame progress={doneSteps / totalSteps}>
        <span className="label">
          Baseline · {baselineIndex + 1} of {intake.baseline.length}
        </span>
        <div className="mt-2">
          <WeightedMCQ
            key={item.id}
            item={item}
            bite={bite}
            onComplete={(quality) => {
              if (item.scored) {
                recordScore({
                  itemId: item.id,
                  quality,
                  weights: item.competency_weights,
                  difficulty: item.difficulty,
                });
              }
              if (baselineIndex + 1 >= intake.baseline.length) setStage("star");
              else setBaselineIndex((i) => i + 1);
            }}
          />
        </div>
      </Frame>
    );
  }

  if (stage === "star") {
    return (
      <Frame progress={doneSteps / totalSteps}>
        <span className="label">One last thing</span>
        <p className="mt-2 font-display text-lg font-bold">What's your star sign?</p>
        <p className="punchline mt-2">Recorded. Not used for anything. We were just curious.</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {STAR_SIGNS.map((sign) => (
            <Button
              key={sign}
              variant="quiet"
              size="lg"
              onClick={() => {
                setStarSign(sign);
                play("reveal");
                setStage("result");
              }}
            >
              {sign}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => {
            setStarSign("Declined");
            setStage("result");
          }}
        >
          I'd rather not
        </Button>
      </Frame>
    );
  }

  const scores = allCompetencyScores(events);
  const settingDetail = intake.default_settings.find((s) => s.number === setting);

  return (
    <Frame>
      <div className="loud-card grain relative overflow-hidden p-5">
        <div className="flex items-center justify-between">
          <Wordmark className="text-md" />
          <span className="font-mono text-xs uppercase tracking-[0.12em]">{typeCode}</span>
        </div>
        <p className="setup mt-4 text-xl">{description?.name ?? "Unclassified"}</p>
        <p className="mt-3 text-md">{description ? say(description.diagnosis, bite) : ""}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="q-card bg-paper p-3.5">
            <p className="label">Reliably good at</p>
            <p className="mt-1 text-sm">{description ? say(description.strength, bite) : ""}</p>
          </div>
          <div className="q-card bg-paper p-3.5">
            <p className="label">Watch out for</p>
            <p className="mt-1 text-sm">{description ? say(description.watch_out, bite) : ""}</p>
          </div>
        </div>

        {settingDetail && (
          <div className="mt-3 q-card bg-paper p-3.5">
            <p className="label">Your default setting</p>
            <p className="mt-1 font-display text-lg font-bold">
              {settingDetail.number}. {settingDetail.label}
            </p>
            <p className="mt-1 text-sm text-muted">{say(settingDetail.body, bite)}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Sticker colour="magenta" rotate={-4}>
            {starSign ?? "No sign"}
          </Sticker>
          <Sticker colour="cyan" rotate={3}>
            Starting profile
          </Sticker>
        </div>
      </div>

      <h2 className="setup mt-8 text-xl">Where you're starting</h2>
      <ul className="mt-4 space-y-2">
        {competencies.competencies.map((competency) => {
          const score = scores[competency.code as keyof typeof scores];
          return (
            <li key={competency.code} className="q-card p-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold">{competency.name}</span>
                <span className="font-mono text-xs text-muted">
                  {score === null ? "—" : `${score} · ${bandFor(score).label}`}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-track">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${score ?? 0}%`,
                    background: `var(${competency.colour})`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="punchline mt-4">
        Twelve situations is a starting point, not a verdict. The number moves as you do the units.
      </p>

      <Link
        to="/learn"
        onClick={() =>
          completeIntake({
            typeCode,
            starSign,
            defaultSetting: settingDetail?.label ?? null,
            completedAt: Date.now(),
          })
        }
        className="mt-6 block"
      >
        <Button full size="lg">
          Start Unit 01
        </Button>
      </Link>
    </Frame>
  );
}

function Frame({ children, progress }: { children: React.ReactNode; progress?: number }) {
  return (
    <div className="mx-auto min-h-[100dvh] max-w-prose px-5 py-6">
      {progress !== undefined && (
        <div
          className="mb-6 h-1.5 rounded-full bg-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
      {children}
    </div>
  );
}
