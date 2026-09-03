import { useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import type { HotTakesPayloadSchema, Item } from "@/content/schema";
import type { z } from "zod";
import { say, type BiteLevel } from "@/lib/copy";
import { play } from "@/lib/sound";
import { Button } from "@/components/ui/Button";
import { Debrief } from "./Debrief";

type Payload = z.infer<typeof HotTakesPayloadSchema>;

type Props = {
  item: Item;
  bite: BiteLevel;
  onComplete: (quality: number) => void;
  xpGained?: number;
};

/**
 * §9.10 Hot takes. A swipe deck: left disagree, right agree, and the nuance
 * lands after each card so the fast format still teaches. Drag is an
 * enhancement — the two buttons underneath are the accessible primary control,
 * because a swipe-only interface is unusable with a keyboard.
 */
export function HotTakes({ item, bite, onComplete, xpGained }: Props) {
  const payload = item.payload as Payload;
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [nuance, setNuance] = useState<{ text: string; agreed: boolean; right: boolean } | null>(
    null,
  );
  const [done, setDone] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const agreeOpacity = useTransform(x, [20, 120], [0, 1]);
  const disagreeOpacity = useTransform(x, [-120, -20], [1, 0]);

  const card = payload.cards[index];

  function answer(agreed: boolean) {
    const right = agreed === card.agree_is_stronger;
    if (right) setCorrect((c) => c + 1);
    play(right ? "correct" : "weak");
    setNuance({ text: say(card.nuance, bite), agreed, right });
    x.set(0);
  }

  function next() {
    setNuance(null);
    if (index + 1 >= payload.cards.length) setDone(true);
    else setIndex((i) => i + 1);
  }

  if (done) {
    const quality = correct / payload.cards.length;
    return (
      <div>
        <p className="label">Deck complete</p>
        <p className="mt-1 font-display text-xl font-extrabold">
          {correct} of {payload.cards.length}
        </p>
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
        Card {index + 1} / {payload.cards.length}
      </p>

      <div className="relative mt-3 min-h-[210px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            drag={nuance ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            style={{ x, rotate }}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 90) answer(info.offset.x > 0);
              else x.set(0);
            }}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="loud-card relative touch-pan-y p-5"
          >
            <motion.span
              style={{ opacity: agreeOpacity }}
              className="label absolute right-3 top-3 text-ink"
              aria-hidden="true"
            >
              Agree
            </motion.span>
            <motion.span
              style={{ opacity: disagreeOpacity }}
              className="label absolute left-3 top-3 text-ink"
              aria-hidden="true"
            >
              Disagree
            </motion.span>
            <p className="mt-6 font-display text-lg font-bold leading-snug">
              {say(card.statement, bite)}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {nuance ? (
        <div className="q-card mt-4 border-l-4 p-4" style={{ borderColor: nuance.right ? "var(--acid)" : "var(--tangerine)" }} aria-live="polite">
          <p className="font-display text-lg font-extrabold">
            {nuance.right ? "You got it" : "Not this one"}
          </p>
          <p className="label mt-1">
            You said {nuance.agreed ? "agree" : "disagree"} — the stronger answer was{" "}
            {card.agree_is_stronger ? "agree" : "disagree"}
          </p>
          <p className="label mt-3">Why</p>
          <p className="mt-1 text-md">{nuance.text}</p>
          <div className="mt-4 flex justify-end">
            <Button onClick={next}>Next card</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[false, true].map((agreed) => (
            <Button
              key={String(agreed)}
              variant="quiet"
              size="lg"
              className="border-[3px] border-ink shadow-loud-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-loud-press"
              onClick={() => answer(agreed)}
            >
              {agreed ? "Agree" : "Disagree"}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
