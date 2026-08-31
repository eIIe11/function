import { describe, expect, it } from "vitest";
import { defaultSettingFrom, typeCodeFrom, typeDescriptionFor } from "./intake";
import { intake } from "@/content/intake";
import { AXES, AXIS_POLES, TypeCodeSchema } from "@/content/schema";

function answersPicking(letterIndex: 0 | 1): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const pair of intake.pairs) {
    const wanted = AXIS_POLES[pair.axis][letterIndex];
    answers[pair.id] = pair.a.letter === wanted ? "a" : "b";
  }
  return answers;
}

describe("typeCodeFrom", () => {
  it("produces a valid code for every consistent set of answers", () => {
    for (const index of [0, 1] as const) {
      const code = typeCodeFrom(answersPicking(index));
      expect(TypeCodeSchema.safeParse(code).success).toBe(true);
    }
  });

  it("produces a described type, never an orphan code", () => {
    expect(typeDescriptionFor(typeCodeFrom(answersPicking(0)))).not.toBeNull();
    expect(typeDescriptionFor(typeCodeFrom(answersPicking(1)))).not.toBeNull();
  });

  it("still returns a valid code when the intake is abandoned part-way", () => {
    const code = typeCodeFrom({});
    expect(code).toHaveLength(AXES.length);
    expect(TypeCodeSchema.safeParse(code).success).toBe(true);
  });

  it("takes the majority of the three pairs on an axis", () => {
    const answers = answersPicking(0);
    const approachPairs = intake.pairs.filter((p) => p.axis === "approach");
    const flipped = approachPairs[0];
    answers[flipped.id] = answers[flipped.id] === "a" ? "b" : "a";
    // Two of three still point at the first pole.
    expect(typeCodeFrom(answers)[0]).toBe(AXIS_POLES.approach[0]);
  });
});

describe("defaultSettingFrom", () => {
  it("returns the most-voted setting", () => {
    expect(defaultSettingFrom([3, 3, 7])).toBe(3);
  });

  it("breaks ties on the lower number so the result is deterministic", () => {
    expect(defaultSettingFrom([9, 2])).toBe(2);
  });

  it("returns null when nothing was answered", () => {
    expect(defaultSettingFrom([])).toBeNull();
  });
});

describe("the intake content itself", () => {
  it("has exactly three forced-choice pairs per axis", () => {
    for (const axis of AXES) {
      expect(intake.pairs.filter((p) => p.axis === axis)).toHaveLength(3);
    }
  });

  it("describes all sixteen reachable codes", () => {
    expect(new Set(intake.type_descriptions.map((t) => t.code)).size).toBe(16);
  });
});
