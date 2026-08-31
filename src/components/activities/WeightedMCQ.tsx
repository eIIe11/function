import { useState } from "react";
import clsx from "clsx";
import type { Item } from "@/content/schema";
import { say, type BiteLevel } from "@/lib/copy";
import { play } from "@/lib/sound";
import { Debrief } from "./Debrief";

type Props = {
  item: Item;
  bite: BiteLevel;
  onComplete: (quality: number) => void;
  /** Cold opens collect the answer without judging it. */
  suppressXp?: boolean;
  xpGained?: number;
};

/**
 * §9.1 Weighted MCQ. Options are never labelled right or wrong: the chosen one
 * gets a full-strength ink border, everything else fades back, and the debrief
 * explains the consequence. No red crosses.
 */
export function WeightedMCQ({ item, bite, onComplete, suppressXp, xpGained }: Props) {
  const [chosen, setChosen] = useState<string | null>(null);
  const options = item.options ?? [];
  const choice = options.find((o) => o.id === chosen);

  return (
    <div>
      <p className="whitespace-pre-line text-md">{say(item.prompt, bite)}</p>

      <ul className="mt-4 space-y-2.5">
        {options.map((option) => {
          const isChosen = option.id === chosen;
          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={chosen !== null}
                aria-pressed={isChosen}
                onClick={() => {
                  setChosen(option.id);
                  play(option.quality >= 0.85 ? "correct" : "weak");
                }}
                className={clsx(
                  "q-card w-full px-4 py-3.5 text-left text-md transition-opacity",
                  "min-h-[56px] disabled:cursor-default",
                  isChosen && "q-chosen",
                  chosen !== null && !isChosen && "opacity-45",
                )}
              >
                {say(option.label, bite)}
              </button>
            </li>
          );
        })}
      </ul>

      {choice && (
        <Debrief
          bite={bite}
          consequence={choice.consequence}
          verdict={item.debrief.verdict}
          principle={item.debrief.principle}
          quality={suppressXp ? undefined : choice.quality}
          xpGained={xpGained}
          onContinue={() => onComplete(choice.quality)}
        />
      )}
    </div>
  );
}
