import { useState } from "react";
import type { Item, OpenResponsePayloadSchema } from "@/content/schema";
import type { z } from "zod";
import { say, type BiteLevel } from "@/lib/copy";
import { Button } from "@/components/ui/Button";
import { Debrief } from "./Debrief";

type Payload = z.infer<typeof OpenResponsePayloadSchema>;

/**
 * §9.15 / §10.5 The mess. There is no strongest option, so the learner writes a
 * justification and then marks it against the published rubric themselves. The
 * self-mark is the teaching moment — reading the criteria after committing to an
 * answer is what surfaces the thing they missed. Server-side AI review can
 * refine the score later; it must never be the gate on progressing.
 */
export function OpenResponse({
  item,
  bite,
  onComplete,
  xpGained,
}: {
  item: Item;
  bite: BiteLevel;
  onComplete: (quality: number, answer: string) => void;
  xpGained?: number;
}) {
  const payload = item.payload as Payload;
  const [text, setText] = useState("");
  const [stage, setStage] = useState<"writing" | "marking" | "debrief">("writing");
  const [hit, setHit] = useState<string[]>([]);

  const quality = hit.length / payload.rubric.length;
  const short = text.trim().length < payload.min_chars;

  return (
    <div>
      <p className="whitespace-pre-line text-md">{say(item.prompt, bite)}</p>

      <label className="label mt-5 block" htmlFor={`${item.id}-answer`}>
        Your answer
      </label>
      <textarea
        id={`${item.id}-answer`}
        value={text}
        readOnly={stage !== "writing"}
        onChange={(event) => setText(event.target.value)}
        rows={7}
        className="q-card mt-1.5 w-full resize-y p-3.5 text-md"
        placeholder="What you'd do, and the reason it's defensible…"
      />
      <p className="label mt-1.5">
        {text.trim().length} / {payload.min_chars} characters minimum
      </p>

      {stage === "writing" && (
        <Button full size="lg" className="mt-4" disabled={short} onClick={() => setStage("marking")}>
          {short ? "A bit more than that" : "Mark it against the rubric"}
        </Button>
      )}

      {stage === "marking" && (
        <div className="q-card mt-5 p-4">
          <p className="label">Now mark your own answer. Honestly — nobody else sees this.</p>
          <ul className="mt-3 space-y-2.5">
            {payload.rubric.map((criterion) => {
              const on = hit.includes(criterion.criterion);
              return (
                <li key={criterion.criterion}>
                  <label className="flex min-h-[56px] cursor-pointer items-start gap-3 rounded-card border border-line p-3.5">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setHit((h) =>
                          on ? h.filter((c) => c !== criterion.criterion) : [...h, criterion.criterion],
                        )
                      }
                      className="mt-0.5 h-5 w-5 accent-violet"
                    />
                    <span>
                      <span className="text-sm font-semibold">{criterion.criterion}</span>
                      <span className="mt-1 block text-sm text-muted">
                        {say(criterion.detail, bite)}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <Button full size="lg" className="mt-4" onClick={() => setStage("debrief")}>
            {hit.length} of {payload.rubric.length} — see how it's usually handled
          </Button>
        </div>
      )}

      {stage === "debrief" && (
        <Debrief
          bite={bite}
          verdict={item.debrief.verdict}
          principle={item.debrief.principle}
          quality={quality}
          xpGained={xpGained}
          onContinue={() => onComplete(quality, text)}
        />
      )}
    </div>
  );
}
