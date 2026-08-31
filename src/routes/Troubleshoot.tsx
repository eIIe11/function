import { useState } from "react";
import { Link } from "react-router-dom";
import support from "@/content/support-resources.json";
import { Button } from "@/components/ui/Button";

type Problem = {
  id: string;
  label: string;
  diagnosis: string;
  moves: string[];
  unit?: { id: string; label: string };
};

/**
 * §12.3 Troubleshoot. Someone opens this at 11pm with a specific problem, so it
 * is a symptom list and not a search box. Every branch gives concrete moves
 * first and a unit second, and one branch routes out of the product entirely.
 */
const PROBLEMS: Problem[] = [
  {
    id: "stuck",
    label: "I'm stuck and I've been stuck for a while",
    diagnosis:
      "Stuck and waiting look identical from the inside. Only one of them needs someone else to move first.",
    moves: [
      "Search the exact wording of the problem — the error text, the phrase from the brief — in your docs and message history.",
      "Find the last time someone did this and copy the shape of their version.",
      "Write, in one sentence, exactly where you're stuck. Most of the time this ends it.",
      "Send that sentence to the person most likely to know, with what you've already done attached.",
    ],
    unit: { id: "w01-agency", label: "Unit 01 — Nobody Is Coming to Save You" },
  },
  {
    id: "late",
    label: "I've missed a deadline or I'm about to",
    diagnosis:
      "The lateness is already fixed in place. What's still moving is how much warning the other person gets.",
    moves: [
      "Tell them now, before they ask. The gap between them finding out and you telling them is the part that damages trust.",
      "Give a new time you can actually hit, not the one that sounds better.",
      "Say what they'll get by the original deadline, even if it's partial.",
      "Skip the paragraph of apology. One line, then the plan.",
    ],
  },
  {
    id: "mistake",
    label: "I've made a mistake and someone else is affected",
    diagnosis:
      "Owning it early costs you a bad ten minutes. Owning it late costs you the assumption that you'd tell them.",
    moves: [
      "Tell the person who can fix it, not the person who's easiest to tell.",
      "Lead with the impact and who's affected, not with how it happened.",
      "Bring the fix, or the two options for a fix, in the same message.",
      "Say what you'll change so it doesn't recur — once, specifically, then stop.",
    ],
  },
  {
    id: "overloaded",
    label: "I have more work than hours and it isn't getting better",
    diagnosis:
      "Sustained overload is a real problem with a real escalation path. Absorbing it quietly is not resilience.",
    moves: [
      "List everything with its actual deadline. The list is almost always different from the feeling.",
      "Take it to your manager with a specific request: which of these moves, or what gets dropped.",
      "Ask for a decision, not for sympathy. \"I can do two of these three by Friday — which two?\"",
      "If the answer is \"all of it\" more than twice, that is information about the job, not about you.",
    ],
  },
  {
    id: "coping",
    label: "This isn't about a task. I'm not coping.",
    diagnosis:
      "Then this is the wrong tool, and that's not a failure of yours. Below are people whose actual job this is.",
    moves: [],
  },
];

export default function Troubleshoot() {
  const [open, setOpen] = useState<string | null>(null);
  const country = support.countries[support.default_country as keyof typeof support.countries];
  const problem = PROBLEMS.find((p) => p.id === open);

  return (
    <div>
      <h1 className="setup text-xl">What's gone wrong?</h1>
      <p className="punchline mt-2">
        Pick the closest one. You get the moves first and the reading second.
      </p>

      <ul className="mt-5 space-y-2.5">
        {PROBLEMS.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setOpen(open === p.id ? null : p.id)}
              aria-expanded={open === p.id}
              className="q-card min-h-[56px] w-full px-4 py-3.5 text-left text-md"
            >
              {p.label}
            </button>
          </li>
        ))}
      </ul>

      {problem && (
        <section className="q-card mt-5 border-l-4 border-l-accent p-4" aria-live="polite">
          <p className="label">What's actually happening</p>
          <p className="mt-1.5 text-md">{problem.diagnosis}</p>

          {problem.moves.length > 0 && (
            <>
              <p className="label mt-5">Do these, in this order</p>
              <ol className="mt-2 space-y-2">
                {problem.moves.map((move, i) => (
                  <li key={i} className="flex gap-3 text-md">
                    <span className="font-mono text-xs text-muted">{i + 1}</span>
                    <span>{move}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          {problem.unit && (
            <Link to={`/learn/${problem.unit.id}`} className="mt-5 block">
              <Button full variant="quiet">
                {problem.unit.label}
              </Button>
            </Link>
          )}

          {problem.id === "coping" && (
            <div className="mt-5">
              <p className="label">{country.label}</p>
              <ul className="mt-2 space-y-2.5">
                {country.resources.map((resource) => (
                  <li key={resource.name} className="q-card bg-paper p-3.5">
                    <p className="text-sm font-semibold">{resource.name}</p>
                    <p className="mt-1 text-sm text-muted">{resource.what}</p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block font-mono text-xs underline underline-offset-4"
                    >
                      {resource.contact}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm">
                {country.emergency.what} <strong>{country.emergency.contact}</strong>
              </p>
              <p className="label mt-4">
                Nothing you tap on this screen is recorded, scored, or visible to an employer.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
