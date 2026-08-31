import { useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import type { Item, TriagePayloadSchema } from "@/content/schema";
import type { z } from "zod";
import { say, type BiteLevel } from "@/lib/copy";
import { play } from "@/lib/sound";
import { Button } from "@/components/ui/Button";
import { Debrief } from "./Debrief";

type Payload = z.infer<typeof TriagePayloadSchema>;

/**
 * §9.6 Triage. Deliberately tap-to-sort rather than drag-and-drop: one card at
 * a time, buckets as big thumb targets along the bottom. Dragging eight cards
 * into four zones is fine on a desktop and miserable at 375px.
 */
export function Triage({
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
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const done = index >= payload.demands.length;
  const demand = payload.demands[index];

  const correctCount = payload.demands.filter((d) => placed[d.id] === d.correct_bucket).length;
  const quality = correctCount / payload.demands.length;

  if (done) {
    return (
      <div>
        <p className="label">Sorted</p>
        <p className="mt-1 font-display text-xl font-extrabold">
          {correctCount} of {payload.demands.length} where they belong
        </p>

        <ul className="mt-4 space-y-2.5">
          {payload.demands.map((d) => {
            const right = placed[d.id] === d.correct_bucket;
            const bucket = payload.buckets.find((b) => b.id === d.correct_bucket);
            return (
              <li
                key={d.id}
                className="q-card border-l-4 p-3.5"
                style={{ borderColor: right ? "var(--acid)" : "var(--tangerine)" }}
              >
                <p className="text-sm font-semibold">{say(d.label, bite)}</p>
                <p className="label mt-1.5">{bucket?.label}</p>
                <p className="mt-1 text-sm text-muted">{say(d.reason, bite)}</p>
              </li>
            );
          })}
        </ul>

        <Debrief
          bite={bite}
          verdict={item.debrief.verdict}
          principle={item.debrief.principle}
          quality={quality}
          xpGained={xpGained}
          onContinue={() => onComplete(quality)}
        />
      </div>
    );
  }

  return (
    <div>
      <p className="text-md">{say(item.prompt, bite)}</p>
      <p className="label mt-3">
        {index + 1} / {payload.demands.length}
      </p>

      <motion.div
        key={demand.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        className="loud-card mt-2 min-h-[124px] p-5"
      >
        <p className="font-display text-lg font-bold leading-snug">{say(demand.label, bite)}</p>
      </motion.div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {payload.buckets.map((bucket) => (
          <Button
            key={bucket.id}
            variant="quiet"
            size="lg"
            onClick={() => {
              setPlaced((p) => ({ ...p, [demand.id]: bucket.id }));
              play("tap");
              setIndex((i) => i + 1);
            }}
            className={clsx("font-display font-bold uppercase")}
          >
            {bucket.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
