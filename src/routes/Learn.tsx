import { Link } from "react-router-dom";
import { units } from "@/content/units";
import { useApp } from "@/store/app";
import { say } from "@/lib/copy";
import { Button } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Sticker";

/** §7.2 Unit list. Locked units say why they're locked, in a sentence. */
export default function Learn() {
  const bite = useApp((s) => s.bite);
  const intakeResult = useApp((s) => s.intake);
  const answers = useApp((s) => s.answers);

  return (
    <div>
      <h1 className="setup text-xl">Units</h1>

      {!intakeResult && (
        <div className="loud-card mt-4 p-4">
          <p className="label">Start here</p>
          <p className="mt-1 font-display text-lg font-bold leading-tight">
            Seven minutes gets you a starting profile.
          </p>
          <p className="mt-1.5 text-sm text-muted">
            You can skip it and do a unit first — the profile just takes longer to mean anything.
          </p>
          <Link to="/intake" className="mt-3 block">
            <Button full>Do the intake</Button>
          </Link>
        </div>
      )}

      <ul className="mt-5 space-y-3">
        {units.map((unit) => {
          const started = Object.keys(answers).some((id) => id.startsWith(unit.id.slice(0, 3)));
          return (
            <li key={unit.id} className="q-card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-xs text-muted">
                  {String(unit.number).padStart(2, "0")}
                </span>
                <span className="font-mono text-xs text-muted">{unit.estimated_minutes} min</span>
              </div>
              <h2 className="mt-1 font-display text-lg font-extrabold leading-tight">
                {say(unit.title, bite)}
              </h2>
              <p className="mt-1.5 text-sm text-muted">{say(unit.subtitle, bite)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {unit.primary_competencies.map((code) => (
                  <span key={code} className="label">
                    {code}
                  </span>
                ))}
              </div>
              <Link to={`/learn/${unit.id}`} className="mt-4 block">
                <Button full>{started ? "Resume" : "Start"}</Button>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center gap-3">
        <Sticker colour="cyan" rotate={-3}>
          More coming
        </Sticker>
        <p className="text-sm text-muted">
          Units 02 onwards are being written. Nothing goes live until it has been reviewed.
        </p>
      </div>
    </div>
  );
}
