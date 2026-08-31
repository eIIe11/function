import { useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import type { Scenario } from "@/content/schema";
import { say, type BiteLevel } from "@/lib/copy";
import { play } from "@/lib/sound";
import { Button } from "@/components/ui/Button";
import { Debrief } from "./Debrief";

type Props = {
  scenario: Scenario;
  bite: BiteLevel;
  /** Mean quality across the path taken, plus the path itself for the review. */
  onComplete: (quality: number, path: string[]) => void;
  xpGained?: number;
};

/**
 * §10 Simulator. A branching graph, not a quiz: a weak choice routes to a
 * harder node, so consequences compound the way they do at work. Context docs
 * are collapsed by default — finding the relevant one is part of the exercise.
 */
export function Simulator({ scenario, bite, onComplete, xpGained }: Props) {
  const [stage, setStage] = useState<"setup" | "playing" | "close">("setup");
  const [nodeId, setNodeId] = useState(scenario.entry);
  const [chosen, setChosen] = useState<string | null>(null);
  const [qualities, setQualities] = useState<number[]>([]);
  const [path, setPath] = useState<string[]>([]);
  const [openDoc, setOpenDoc] = useState<string | null>(null);

  const node = scenario.nodes[nodeId];
  const choice = node?.options.find((o) => o.id === chosen);
  const meanQuality = qualities.length
    ? qualities.reduce((a, b) => a + b, 0) / qualities.length
    : 0;

  if (stage === "setup") {
    return (
      <div>
        <p className="label">Simulator</p>
        <h3 className="mt-1 font-display text-xl font-extrabold leading-tight">
          {say(scenario.title, bite)}
        </h3>
        <p className="mt-3 whitespace-pre-line text-md">{say(scenario.setup, bite)}</p>

        {scenario.context_docs.length > 0 && (
          <div className="mt-5">
            <p className="label">What you have to hand</p>
            <ul className="mt-2 space-y-2">
              {scenario.context_docs.map((doc) => (
                <li key={doc.id} className="q-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenDoc((id) => (id === doc.id ? null : doc.id))}
                    aria-expanded={openDoc === doc.id}
                    className="flex min-h-[52px] w-full items-center justify-between gap-3 px-3.5 py-3 text-left"
                  >
                    <span>
                      <span className="label">{doc.kind}</span>
                      <span className="mt-0.5 block text-sm font-semibold">{doc.title}</span>
                      {doc.from && <span className="block text-sm text-muted">{doc.from}</span>}
                    </span>
                    <span aria-hidden="true" className="font-mono text-xs text-muted">
                      {openDoc === doc.id ? "−" : "+"}
                    </span>
                  </button>
                  {openDoc === doc.id && (
                    <p className="whitespace-pre-line border-t border-line bg-paper-2 px-3.5 py-3 text-sm">
                      {say(doc.body, bite)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button full size="lg" className="mt-5" onClick={() => setStage("playing")}>
          Start
        </Button>
      </div>
    );
  }

  if (stage === "close") {
    return (
      <Debrief
        bite={bite}
        principle={scenario.principle}
        quality={meanQuality}
        xpGained={xpGained}
        onContinue={() => onComplete(meanQuality, path)}
        continueLabel="Done"
      />
    );
  }

  return (
    <div>
      <p className="label">
        {say(scenario.title, bite)} · step {path.length + (choice ? 0 : 1)}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={nodeId}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
        >
          <p className="mt-2 whitespace-pre-line text-md">{say(node.prompt, bite)}</p>

          <ul className="mt-4 space-y-2.5">
            {node.options.map((option) => {
              const isChosen = option.id === chosen;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    disabled={chosen !== null}
                    aria-pressed={isChosen}
                    onClick={() => {
                      setChosen(option.id);
                      setQualities((q) => [...q, option.quality]);
                      setPath((p) => [...p, `${nodeId}/${option.id}`]);
                      play(option.quality >= 0.85 ? "correct" : "weak");
                    }}
                    className={clsx(
                      "q-card min-h-[56px] w-full px-4 py-3.5 text-left text-md",
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
        </motion.div>
      </AnimatePresence>

      {choice && (
        <Debrief
          bite={bite}
          consequence={choice.consequence}
          quality={choice.quality}
          onContinue={() => {
            if (choice.next === "END") {
              setStage("close");
            } else {
              setNodeId(choice.next);
            }
            setChosen(null);
          }}
          continueLabel={choice.next === "END" ? "See how it landed" : "What happens next"}
        />
      )}
    </div>
  );
}
