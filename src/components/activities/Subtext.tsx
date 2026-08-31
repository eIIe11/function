import { useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import type { Item, SubtextPayloadSchema } from "@/content/schema";
import type { z } from "zod";
import { say, type BiteLevel } from "@/lib/copy";
import { play } from "@/lib/sound";
import { Button } from "@/components/ui/Button";
import { Debrief } from "./Debrief";

type Payload = z.infer<typeof SubtextPayloadSchema>;

/**
 * §9.8 Subtext. The conversation arrives one line at a time, chat-style, and
 * after each line the learner reads what was actually meant. Earlier lines stay
 * on screen so the pattern across the whole conversation is visible.
 */
export function Subtext({
  item,
  bite,
  onComplete,
  xpGained,
}: {
  item: Item;
  bite: BiteLevel;
  onComplete: (quality: number) => void;
  xpGained?: number;
}) {
  const payload = item.payload as Payload;
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<string | null>(null);

  const line = payload.lines[index];
  const done = index >= payload.lines.length;

  const qualities = payload.lines.map((l) => {
    const pick = l.options.find((o) => o.id === chosen[l.id]);
    return pick?.quality ?? 0;
  });
  const quality = qualities.reduce((a, b) => a + b, 0) / payload.lines.length;

  const chosenOption = line?.options.find((o) => o.id === chosen[line.id]);

  return (
    <div>
      <p className="text-md">{say(item.prompt, bite)}</p>

      <ol className="mt-4 space-y-4">
        {payload.lines.slice(0, done ? payload.lines.length : index + 1).map((l, i) => {
          const pick = l.options.find((o) => o.id === chosen[l.id]);
          return (
            <li key={l.id}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="label">{l.speaker}</p>
                <p className="q-recessed mt-1.5 rounded-card px-4 py-3 text-md">
                  {say(l.line, bite)}
                </p>
              </motion.div>

              {i === index && !pick && (
                <ul className="mt-3 space-y-2.5">
                  {l.options.map((option) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setChosen((c) => ({ ...c, [l.id]: option.id }));
                          setRevealed(l.id);
                          play(option.quality >= 0.85 ? "correct" : "weak");
                        }}
                        className="q-card min-h-[52px] w-full px-4 py-3 text-left text-sm"
                      >
                        {say(option.label, bite)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {pick && (
                <div
                  className={clsx("q-card mt-3 border-l-4 p-3.5")}
                  style={{ borderColor: pick.quality >= 0.85 ? "var(--acid)" : "var(--tangerine)" }}
                >
                  <p className="text-sm font-semibold">{say(pick.label, bite)}</p>
                  <p className="mt-1.5 text-sm text-muted">{say(pick.consequence, bite)}</p>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!done && revealed === line?.id && chosenOption && (
        <Button
          full
          size="lg"
          className="mt-4"
          onClick={() => {
            setRevealed(null);
            setIndex((i) => i + 1);
          }}
        >
          {index + 1 >= payload.lines.length ? "See the pattern" : "Next line"}
        </Button>
      )}

      {done && (
        <Debrief
          bite={bite}
          verdict={item.debrief.verdict}
          principle={item.debrief.principle}
          quality={quality}
          xpGained={xpGained}
          onContinue={() => onComplete(quality)}
        />
      )}
    </div>
  );
}
