import { describe, expect, it } from "vitest";
import { allCompetencyScores, bandFor, competencyScore, levelFor, xpFor } from "./scoring";
import type { ScoredEvent } from "./scoring";

function event(quality: number, weights: ScoredEvent["weights"], at: number): ScoredEvent {
  return { quality, weights, at };
}

describe("competencyScore", () => {
  it("returns null when there is no evidence, rather than zero", () => {
    // §8.4 A learner with no evidence is unmeasured, not Emerging.
    expect(competencyScore([], "AGY")).toBeNull();
  });

  it("weights by the item's weight for that competency", () => {
    const events = [event(1, { AGY: 1 }, 1), event(0, { COM: 1 }, 2)];
    expect(competencyScore(events, "AGY")).toBe(100);
    expect(competencyScore(events, "COM")).toBe(0);
  });

  it("favours recent evidence so improvement shows", () => {
    const improving = [event(0, { AGY: 1 }, 1), event(1, { AGY: 1 }, 100)];
    const declining = [event(1, { AGY: 1 }, 1), event(0, { AGY: 1 }, 100)];
    expect(competencyScore(improving, "AGY")).toBeGreaterThan(50);
    expect(competencyScore(declining, "AGY")).toBeLessThan(50);
  });

  it("splits a partial weight across competencies", () => {
    const scores = allCompetencyScores([event(1, { AGY: 0.5, RES: 0.5 }, 1)]);
    expect(scores.AGY).toBe(100);
    expect(scores.RES).toBe(100);
    expect(scores.COM).toBeNull();
  });
});

describe("bandFor", () => {
  it("maps the four published bands", () => {
    expect(bandFor(10).label).toBe("Emerging");
    expect(bandFor(50).label).toBe("Developing");
    expect(bandFor(70).label).toBe("Capable");
    expect(bandFor(95).label).toBe("Annoyingly Capable");
  });
});

describe("xpFor", () => {
  it("pays more for harder items and for better answers", () => {
    expect(xpFor(1, "stretch")).toBeGreaterThan(xpFor(1, "intro"));
    expect(xpFor(1, "core")).toBeGreaterThan(xpFor(0.3, "core"));
  });

  it("never pays nothing for engaging with an item", () => {
    // §11.3 A weak answer is still evidence, so it still earns something.
    expect(xpFor(0, "intro")).toBeGreaterThan(0);
  });
});

describe("levelFor", () => {
  it("starts at the first level with no next-level overflow", () => {
    const { level, progress } = levelFor(0);
    expect(level.level).toBe(1);
    expect(progress).toBeGreaterThanOrEqual(0);
  });

  it("reports null next at the top and clamps progress", () => {
    const { next, progress } = levelFor(1_000_000);
    expect(next).toBeNull();
    expect(progress).toBeLessThanOrEqual(1);
  });
});
