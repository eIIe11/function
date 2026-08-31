import { Link } from "react-router-dom";
import { Sticker } from "@/components/ui/Sticker";
import { Button } from "@/components/ui/Button";
import { intake } from "@/content/intake";

/** §5.4 FUNCTION. Yourself — the buyer is the learner. Spicy register. */
export default function Yourself() {
  return (
    <div data-side="yourself">
      <section className="grain relative overflow-hidden border-b-[3px] border-ink bg-acid px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <span className="label text-ink">FUNCTION. Yourself</span>
          <h1 className="setup mt-3 text-2xl">
            You're not
            <br />
            behind.
            <br />
            You're untaught.
          </h1>
          <p className="punchline mt-4 text-ink">
            Nobody sat you down and explained how to ask for a deadline extension, chase a senior
            person, or work out whether you're stuck or just waiting. Someone should have.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/intake">
              <Button size="lg">Start the 7-minute intake</Button>
            </Link>
            <Link to="/membership#individual">
              <Button size="lg" variant="quiet">
                See what it costs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="setup text-xl">How it works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-4">
            {[
              {
                step: "01",
                title: "Seven minutes",
                body: "Twelve forced choices, your default setting, and twelve real situations. You get a four-letter type code and a starting profile.",
              },
              {
                step: "02",
                title: "Do the thing",
                body: "Swipe decks, a fake inbox you actually reply to, chaotic mornings you have to triage. No videos of someone in a headset.",
              },
              {
                step: "03",
                title: "Get argued with",
                body: "Simulators branch. Pick a weak option and the next scene is genuinely harder, which is also how work does it.",
              },
              {
                step: "04",
                title: "One behaviour, 30 days",
                body: "A cue and a behaviour, four check-ins, then it ends. No streak to break and nothing to lose at 11:59pm.",
              },
            ].map((card) => (
              <li key={card.step} className="q-card p-5">
                <span className="font-mono text-xs text-muted">{card.step}</span>
                <h3 className="mt-1 font-display text-lg font-extrabold leading-tight">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{card.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-line bg-paper-2 px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="setup text-xl">Sixteen ways of being at work</h2>
            <Sticker rotate={-3}>All equally annoying</Sticker>
          </div>
          <p className="punchline mt-3">
            The intake gives you one of these. It's a description, not a diagnosis, and you can change
            it by doing the units.
          </p>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {intake.type_descriptions.map((type) => (
              <li key={type.code} className="q-card bg-paper p-4">
                <span className="font-mono text-xs text-muted">{type.code}</span>
                <span className="mt-1 block font-display text-lg font-bold leading-tight">
                  {type.name}
                </span>
                <span className="mt-1.5 block text-sm text-muted">{type.strength.spicy}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="setup text-xl">Things we refuse to do</h2>
          <ul className="mt-5 space-y-2.5">
            {[
              "A leaderboard. Comparing your ability to ask for help against a stranger's is not motivating, it's just ranking.",
              "An infinite streak. Miss a Tuesday and nothing is taken away from you.",
              "Telling your employer how you're coping. Capacity is yours and it never leaves your account.",
              "Selling you a subscription you forget to cancel. You buy it once.",
            ].map((line) => (
              <li key={line} className="q-card border-l-4 border-l-magenta p-4 text-sm">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
