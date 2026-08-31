import { describe, expect, it } from "vitest";
import { units } from "./units";
import { intake } from "./intake";
import { MIN_ITEM_TYPES_PER_UNIT } from "./schema";
import badges from "./badges.json";

/**
 * §8.2 These are the content rules that a schema cannot state: they are about
 * the relationship between items, not the shape of one.
 */
describe("every unit", () => {
  it.each(units.map((unit) => [unit.id, unit] as const))("%s is varied enough", (_id, unit) => {
    const types = new Set(
      [unit.cold_open, unit.mess, unit.build_it, ...unit.recognise].map((i) => i.type),
    );
    expect(types.size).toBeGreaterThanOrEqual(MIN_ITEM_TYPES_PER_UNIT);
  });

  it.each(units.map((unit) => [unit.id, unit] as const))(
    "%s scores only against its own competencies",
    (_id, unit) => {
      const declared = new Set(unit.primary_competencies);
      const scored = [unit.cold_open, unit.mess, unit.build_it, ...unit.recognise].filter(
        (item) => item.scored,
      );
      for (const item of scored) {
        const codes = Object.keys(item.competency_weights ?? {});
        // A unit may touch adjacent competencies, but must exercise its own.
        expect(codes.some((code) => declared.has(code as never))).toBe(true);
      }
    },
  );

  it.each(units.map((unit) => [unit.id, unit] as const))(
    "%s offers a genuinely strongest option wherever it scores a choice",
    (_id, unit) => {
      for (const item of [unit.cold_open, ...unit.recognise]) {
        if (!item.options) continue;
        expect(Math.max(...item.options.map((o) => o.quality))).toBeGreaterThanOrEqual(0.9);
      }
    },
  );

  it.each(units.map((unit) => [unit.id, unit] as const))(
    "%s never scores its commitment",
    (_id, unit) => {
      // §12.2 Scoring a promise turns it into a performance.
      expect(unit.build_it.scored).toBe(false);
      expect(unit.build_it.competency_weights).toBeUndefined();
    },
  );

  it.each(units.map((unit) => [unit.id, unit] as const))(
    "%s has a mess scenario with no single right answer",
    (_id, unit) => {
      expect(unit.mess.type).toBe("open_response");
      expect(unit.mess.payload?.kind).toBe("open_response");
    },
  );
});

describe("the intake", () => {
  it("never scores the star sign", () => {
    // §6.5.4 Recorded, unscored, and never employer-visible.
    expect(intake.star_signs).toHaveLength(12);
    const ids = intake.baseline.map((item) => item.id);
    expect(ids.some((id) => /star|sign|zodiac/i.test(id))).toBe(false);
  });

  it("scores every Baseline item, since that is the point of it", () => {
    for (const item of intake.baseline) {
      expect(item.scored).toBe(true);
    }
  });
});

describe("badges", () => {
  it("describe the evidence rather than the reward", () => {
    for (const badge of badges) {
      expect(badge.evidence.length).toBeGreaterThan(10);
    }
  });

  it("have unique ids", () => {
    expect(new Set(badges.map((b) => b.id)).size).toBe(badges.length);
  });
});
