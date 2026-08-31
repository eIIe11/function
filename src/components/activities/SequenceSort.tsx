import { useState } from "react";
import { Reorder } from "framer-motion";
import type { Item, SequencePayloadSchema } from "@/content/schema";
import type { z } from "zod";
import { say, type BiteLevel } from "@/lib/copy";
import { play } from "@/lib/sound";
import { Button } from "@/components/ui/Button";
import { Debrief } from "./Debrief";

type Payload = z.infer<typeof SequencePayloadSchema>;

/**
 * §9.7 Sequence. Draggable on touch, but every row also has up/down buttons —
 * drag-only ordering is not keyboard operable and not reliably one-thumb.
 * Scoring is positional distance, so a nearly-right order scores nearly full.
 */
export function SequenceSort({
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
  const [order, setOrder] = useState<string[]>(() => shuffled(payload.steps.map((s) => s.id)));
  const [submitted, setSubmitted] = useState(false);

  const labels = new Map(payload.steps.map((s) => [s.id, say(s.label, bite)]));
  const quality = positionalQuality(order, payload.correct_order);

  function move(id: string, delta: number) {
    setOrder((current) => {
      const from = current.indexOf(id);
      const to = from + delta;
      if (to < 0 || to >= current.length) return current;
      const next = [...current];
      next.splice(from, 1);
      next.splice(to, 0, id);
      play("tap");
      return next;
    });
  }

  return (
    <div>
      <p className="text-md">{say(item.prompt, bite)}</p>

      <Reorder.Group axis="y" values={order} onReorder={setOrder} className="mt-4 space-y-2.5">
        {order.map((id, position) => {
          const correctPosition = payload.correct_order.indexOf(id);
          return (
            <Reorder.Item
              key={id}
              value={id}
              drag={submitted ? false : "y"}
              className="q-card flex items-stretch gap-2 p-2 pl-3"
              style={
                submitted
                  ? { borderColor: correctPosition === position ? "var(--acid)" : "var(--line)" }
                  : undefined
              }
            >
              <span className="mt-2.5 font-mono text-xs text-muted">{position + 1}</span>
              <span className="flex-1 self-center py-1.5 text-sm">{labels.get(id)}</span>
              {!submitted && (
                <span className="flex flex-col gap-1">
                  <button
                    type="button"
                    aria-label={`Move "${labels.get(id)}" up`}
                    onClick={() => move(id, -1)}
                    disabled={position === 0}
                    className="h-[26px] w-11 rounded-control border border-line text-xs disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move "${labels.get(id)}" down`}
                    onClick={() => move(id, 1)}
                    disabled={position === order.length - 1}
                    className="h-[26px] w-11 rounded-control border border-line text-xs disabled:opacity-30"
                  >
                    ↓
                  </button>
                </span>
              )}
              {submitted && (
                <span className="self-center px-2 font-mono text-xs text-muted">
                  #{correctPosition + 1}
                </span>
              )}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      {submitted ? (
        <Debrief
          bite={bite}
          verdict={item.debrief.verdict}
          principle={item.debrief.principle}
          quality={quality}
          xpGained={xpGained}
          onContinue={() => onComplete(quality)}
        />
      ) : (
        <Button
          full
          size="lg"
          className="mt-4"
          onClick={() => {
            setSubmitted(true);
            play(quality >= 0.85 ? "correct" : "weak");
          }}
        >
          Lock in this order
        </Button>
      )}
    </div>
  );
}

function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Quality falls off with total displacement rather than requiring an exact
 * match, so "escalated one step too early" scores far better than a reversal.
 */
export function positionalQuality(order: string[], correct: string[]): number {
  const n = correct.length;
  if (n < 2) return 1;
  const displacement = order.reduce(
    (sum, id, index) => sum + Math.abs(index - correct.indexOf(id)),
    0,
  );
  const worst = Math.floor(n / 2) * Math.ceil(n / 2) * 2;
  return Math.max(0, 1 - displacement / worst);
}
