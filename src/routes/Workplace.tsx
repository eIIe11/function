import { Link } from "react-router-dom";
import { Sticker } from "@/components/ui/Sticker";
import competencies from "@/content/competencies.json";
import { units } from "@/content/units";
import { Button } from "@/components/ui/Button";

/** §5.3 FUNCTION. Workplace — the buyer is HR, L&D or a founder. Boardroom register. */
export default function Workplace() {
  return (
    <div data-side="workplace">
      <section className="grain relative overflow-hidden border-b-[3px] border-ink bg-cyan px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <span className="label text-ink">FUNCTION. Workplace</span>
          <h1 className="setup mt-3 text-2xl">
            Your grads are
            <br />
            clever and
            <br />
            stuck.
          </h1>
          <p className="punchline mt-4 text-ink">
            They can do the work. They can't ask for what they need, read a room, or tell you they're
            blocked before the deadline. That's the gap this closes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/membership#corporate">
              <Button size="lg">See seat pricing</Button>
            </Link>
            <Link to="/learn">
              <Button size="lg" variant="quiet">
                Try Unit 01 free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="setup text-xl">What you actually get</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Ten measured competencies",
                body: "Weighted scoring on how someone behaves in a scenario, not whether they finished a video. Reported as bands, with the evidence attached.",
              },
              {
                title: "Cohorts and pathways",
                body: "Assign a pathway to a cohort, set a due date, and see where a group is genuinely weak rather than who logged in.",
              },
              {
                title: "Your scenarios, not ours",
                body: "Author scenarios using your own tools, clients and escalation paths. They validate against the same schema as ours.",
              },
            ].map((card) => (
              <article key={card.title} className="q-card p-5">
                <h3 className="font-display text-lg font-extrabold leading-tight">{card.title}</h3>
                <p className="mt-2 text-sm text-muted">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-paper-2 px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="setup text-xl">Measured, not guessed</h2>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {competencies.competencies.map((competency) => (
              <li key={competency.code} className="q-card flex gap-3 bg-paper p-4">
                <span className="font-mono text-xs font-semibold text-muted">{competency.code}</span>
                <span>
                  <span className="block text-sm font-semibold">{competency.name}</span>
                  <span className="mt-0.5 block text-sm text-muted">{competency.definition}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="punchline mt-5">
            One thing we don't report: the Capacity unit. Whether someone is struggling is between
            them and their GP, not on your dashboard.
          </p>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3">
            <h2 className="setup text-xl">The curriculum</h2>
            <Sticker colour="cyan" rotate={3}>
              {units.length} live
            </Sticker>
          </div>
          <ol className="mt-6 space-y-2.5">
            {units.map((unit) => (
              <li key={unit.id} className="q-card flex items-baseline gap-4 p-4">
                <span className="font-mono text-xs text-muted">
                  {String(unit.number).padStart(2, "0")}
                </span>
                <span>
                  <span className="block font-display text-lg font-bold leading-tight">
                    {unit.title.boardroom}
                  </span>
                  <span className="mt-1 block text-sm text-muted">{unit.subtitle.boardroom}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="punchline mt-4">
            Unit count at launch is still open — see the open decisions in the repo.
          </p>
        </div>
      </section>
    </div>
  );
}
