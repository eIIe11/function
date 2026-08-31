import { useState } from "react";
import clsx from "clsx";
import type { CommitmentPayloadSchema, Item } from "@/content/schema";
import type { z } from "zod";
import { say, type BiteLevel } from "@/lib/copy";
import { Button } from "@/components/ui/Button";

type Payload = z.infer<typeof CommitmentPayloadSchema>;

/**
 * §7.4.6 Build It. Unscored by design: a commitment is a plan, not a
 * performance. Cue and Behaviour are separate fields because the cue is the
 * half people omit, and if–then structure is the part with an evidence base.
 */
export function CommitmentPicker({
  item,
  bite,
  onCommit,
}: {
  item: Item;
  bite: BiteLevel;
  onCommit: (cue: string, behaviour: string) => void;
}) {
  const payload = item.payload as Payload;
  const [cue, setCue] = useState("");
  const [behaviour, setBehaviour] = useState("");
  const ready = cue.trim().length > 3 && behaviour.trim().length > 3;

  return (
    <div>
      <p className="whitespace-pre-line text-md">{say(item.prompt, bite)}</p>

      <ul className="mt-4 space-y-2.5">
        {payload.suggestions.map((suggestion, i) => {
          const suggestedCue = say(suggestion.cue, bite);
          const suggestedBehaviour = say(suggestion.behaviour, bite);
          const selected = cue === suggestedCue && behaviour === suggestedBehaviour;
          return (
            <li key={i}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setCue(suggestedCue);
                  setBehaviour(suggestedBehaviour);
                }}
                className={clsx("q-card w-full p-3.5 text-left", selected && "q-chosen")}
              >
                <span className="label">Cue</span>
                <span className="mt-0.5 block text-sm">{suggestedCue}</span>
                <span className="label mt-2 block">Behaviour</span>
                <span className="mt-0.5 block text-sm">{suggestedBehaviour}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 space-y-3">
        <div>
          <label className="label block" htmlFor={`${item.id}-cue`}>
            Cue — when does this happen?
          </label>
          <input
            id={`${item.id}-cue`}
            value={cue}
            onChange={(event) => setCue(event.target.value)}
            className="q-card mt-1.5 min-h-[48px] w-full px-3.5 text-md"
            placeholder="When I…"
          />
        </div>
        <div>
          <label className="label block" htmlFor={`${item.id}-behaviour`}>
            Behaviour — what will you do?
          </label>
          <input
            id={`${item.id}-behaviour`}
            value={behaviour}
            onChange={(event) => setBehaviour(event.target.value)}
            className="q-card mt-1.5 min-h-[48px] w-full px-3.5 text-md"
            placeholder="I will…"
          />
        </div>
      </div>

      <Button
        full
        size="lg"
        className="mt-5"
        disabled={!ready}
        onClick={() => onCommit(cue.trim(), behaviour.trim())}
      >
        Start the 30 days
      </Button>
      <p className="punchline mt-2">
        {say(item.debrief.verdict, bite)}
      </p>
    </div>
  );
}
