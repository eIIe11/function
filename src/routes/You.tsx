import { Link } from "react-router-dom";
import competencies from "@/content/competencies.json";
import badges from "@/content/badges.json";
import { useApp } from "@/store/app";
import { allCompetencyScores, bandFor, levelFor } from "@/lib/scoring";
import { Button } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Sticker";
import { isMuted, setMuted } from "@/lib/sound";
import { useState } from "react";

/** §12.1 Profile, locker and the settings that have to be honoured everywhere. */
export default function You() {
  const events = useApp((s) => s.events);
  const xp = useApp((s) => s.xp);
  const intake = useApp((s) => s.intake);
  const owned = useApp((s) => s.badges);
  const bite = useApp((s) => s.bite);
  const setBite = useApp((s) => s.setBite);
  const calm = useApp((s) => s.calm);
  const setCalm = useApp((s) => s.setCalm);
  const [muted, setLocalMuted] = useState(isMuted());

  const scores = allCompetencyScores(events);
  const { level, next, progress } = levelFor(xp);

  return (
    <div>
      <h1 className="setup text-xl">You</h1>

      <div className="q-card mt-4 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-lg font-extrabold">{level.name}</p>
          <p className="font-mono text-xs text-muted">{xp} XP</p>
        </div>
        {next && (
          <>
            <div className="mt-3 h-1.5 rounded-full bg-track">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="label mt-2">
              {next.xp - xp} XP to {next.name}
            </p>
          </>
        )}
        {intake && (
          <p className="label mt-4">
            Type {intake.typeCode}
            {intake.defaultSetting ? ` · default: ${intake.defaultSetting}` : ""}
          </p>
        )}
      </div>

      <h2 className="setup mt-8 text-lg">Capability</h2>
      <ul className="mt-3 space-y-2">
        {competencies.competencies.map((competency) => {
          const score = scores[competency.code as keyof typeof scores];
          return (
            <li key={competency.code} className="q-card p-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold">{competency.name}</span>
                <span className="font-mono text-xs text-muted">
                  {score === null ? "no evidence yet" : `${score} · ${bandFor(score).label}`}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-track">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${score ?? 0}%`, background: `var(${competency.colour})` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="setup mt-8 text-lg">Locker</h2>
      <p className="punchline mt-1">
        Badges are evidence, not decoration. Each one says what you actually did.
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3">
        {badges.map((badge) => {
          const has = owned.includes(badge.id);
          return (
            <li key={badge.id} className={has ? "" : "opacity-35"}>
              <div className="q-card flex h-full flex-col items-start gap-2 p-3.5">
                <Sticker
                  colour={badge.sticker.colour.replace("--", "") as "acid"}
                  rotate={badge.sticker.rotation}
                  className="text-xs"
                >
                  {has ? "Earned" : "Locked"}
                </Sticker>
                <span className="font-display text-md font-bold leading-tight">{badge.name}</span>
                <span className="text-sm text-muted">{badge.evidence}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="setup mt-8 text-lg">Settings</h2>
      <ul className="mt-3 space-y-2.5">
        <li className="q-card flex items-center justify-between gap-4 p-3.5">
          <span>
            <span className="block text-sm font-semibold">Register</span>
            <span className="block text-sm text-muted">
              Spicy is blunter. Boardroom is the same content, safe to read over your shoulder.
            </span>
          </span>
          <Button
            variant="quiet"
            onClick={() => setBite(bite === "spicy" ? "boardroom" : "spicy")}
          >
            {bite === "spicy" ? "Spicy" : "Boardroom"}
          </Button>
        </li>
        <li className="q-card flex items-center justify-between gap-4 p-3.5">
          <span>
            <span className="block text-sm font-semibold">Calm mode</span>
            <span className="block text-sm text-muted">
              One accent, no timers, no motion, no sound. Not a lesser version.
            </span>
          </span>
          <Button variant="quiet" onClick={() => setCalm(!calm)}>
            {calm ? "On" : "Off"}
          </Button>
        </li>
        <li className="q-card flex items-center justify-between gap-4 p-3.5">
          <span>
            <span className="block text-sm font-semibold">Sound</span>
            <span className="block text-sm text-muted">
              Six short UI sounds. Nothing on hover, nothing before you tap something.
            </span>
          </span>
          <Button
            variant="quiet"
            onClick={() => {
              setMuted(!muted);
              setLocalMuted(!muted);
            }}
          >
            {muted ? "Muted" : "On"}
          </Button>
        </li>
      </ul>

      <div className="q-card mt-6 border-l-4 border-l-violet p-4">
        <p className="label">Privacy</p>
        <p className="mt-1.5 text-sm">
          If you're on a company cohort, your employer sees competency bands and unit completion.
          They never see your intake answers, your written responses, your commitments, or anything
          from the Capacity unit.
        </p>
        <Link to="/troubleshoot" className="mt-3 inline-block">
          <Button variant="ghost">Something specific going wrong?</Button>
        </Link>
      </div>
    </div>
  );
}
