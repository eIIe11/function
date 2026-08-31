import type { Item } from "@/content/schema";
import type { BiteLevel } from "@/lib/copy";
import { useApp } from "@/store/app";
import { HotTakes } from "./HotTakes";
import { OpenResponse } from "./OpenResponse";
import { SequenceSort } from "./SequenceSort";
import { Subtext } from "./Subtext";
import { Triage } from "./Triage";
import { WeightedMCQ } from "./WeightedMCQ";
import { CommitmentPicker } from "./CommitmentPicker";

type Props = {
  item: Item;
  bite: BiteLevel;
  onDone: () => void;
};

/**
 * One place that maps an item type to its activity, so adding an interaction
 * type is a single switch arm plus a component — and so scoring and answer
 * persistence can never be forgotten by an individual activity.
 */
export function ItemRenderer({ item, bite, onDone }: Props) {
  const recordScore = useApp((s) => s.recordScore);
  const saveAnswer = useApp((s) => s.saveAnswer);
  const addCommitment = useApp((s) => s.addCommitment);

  function finish(quality: number, answer?: unknown) {
    if (answer !== undefined) saveAnswer(item.id, answer);
    if (item.scored) {
      recordScore({
        itemId: item.id,
        quality,
        weights: item.competency_weights,
        difficulty: item.difficulty,
      });
    }
    onDone();
  }

  switch (item.type) {
    case "hot_takes":
      return <HotTakes item={item} bite={bite} onComplete={finish} />;
    case "sequence":
      return <SequenceSort item={item} bite={bite} onComplete={finish} />;
    case "triage":
      return <Triage item={item} bite={bite} onComplete={finish} />;
    case "subtext":
      return <Subtext item={item} bite={bite} onComplete={finish} />;
    case "open_response":
      return (
        <OpenResponse
          item={item}
          bite={bite}
          onComplete={(quality, answer) => finish(quality, answer)}
        />
      );
    case "commitment":
      return (
        <CommitmentPicker
          item={item}
          bite={bite}
          onCommit={(cue, behaviour) => {
            addCommitment(cue, behaviour);
            saveAnswer(item.id, { cue, behaviour });
            onDone();
          }}
        />
      );
    case "cold_open":
      // §7.4.1 Answered before any teaching, so it collects the answer and
      // awards XP for honesty without grading it.
      return (
        <WeightedMCQ
          item={item}
          bite={bite}
          suppressXp
          onComplete={(quality) => finish(quality, quality)}
        />
      );
    default:
      return <WeightedMCQ item={item} bite={bite} onComplete={finish} />;
  }
}
