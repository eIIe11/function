import { AXES, AXIS_POLES, type Axis } from "@/content/schema";
import { intake } from "@/content/intake";

/**
 * §6.5.1 Four axes, three forced-choice pairs each, one letter per axis. Ties
 * are impossible with three pairs, which is why there are three.
 */
export function typeCodeFrom(answers: Record<string, string>): string {
  return AXES.map((axis) => letterFor(axis, answers)).join("");
}

function letterFor(axis: Axis, answers: Record<string, string>): string {
  const [first, second] = AXIS_POLES[axis];
  const pairs = intake.pairs.filter((pair) => pair.axis === axis);
  let firstVotes = 0;
  let counted = 0;
  for (const pair of pairs) {
    const chosen = answers[pair.id];
    if (!chosen) continue;
    counted += 1;
    const letter = chosen === "a" ? pair.a.letter : pair.b.letter;
    if (letter === first) firstVotes += 1;
  }
  // Unanswered axis falls to the first pole rather than producing an invalid code.
  if (counted === 0) return first;
  return firstVotes * 2 >= counted ? first : second;
}

/** §6.5.2 The most-voted default setting, ties broken by the lower number. */
export function defaultSettingFrom(votes: number[]): number | null {
  if (votes.length === 0) return null;
  const tally = new Map<number, number>();
  for (const vote of votes) tally.set(vote, (tally.get(vote) ?? 0) + 1);
  return [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
}

export function typeDescriptionFor(code: string) {
  return intake.type_descriptions.find((type) => type.code === code) ?? null;
}
