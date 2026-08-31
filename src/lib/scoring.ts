import competencies from "@/content/competencies.json";
import levels from "@/content/levels.json";
import type { CompetencyCode, Weights } from "@/content/schema";

export type Band = (typeof competencies.bands)[number];

/** §6.4 Bands are inclusive of min and max. */
export function bandFor(score: number): Band {
  const band = competencies.bands.find((b) => score >= b.min && score <= b.max);
  // The bands cover 0–100 exhaustively; clamp defensively rather than throw.
  return band ?? competencies.bands[0];
}

export type ScoredEvent = {
  /** Continuous 0–1 quality of the response. Never boolean. */
  quality: number;
  weights: Weights;
  at: number;
};

/**
 * §6.3 A competency score is a weighted rolling mean where recent evidence
 * counts for more, so a bad first week cannot hold someone at Emerging
 * forever, and a good first week cannot carry them.
 */
export function competencyScore(
  events: ScoredEvent[],
  code: CompetencyCode,
  { halfLife = 20 }: { halfLife?: number } = {},
): number | null {
  const relevant = events
    .filter((e) => (e.weights[code] ?? 0) > 0)
    .sort((a, b) => a.at - b.at);
  if (relevant.length === 0) return null;

  let weighted = 0;
  let total = 0;
  relevant.forEach((event, index) => {
    const age = relevant.length - 1 - index;
    const recency = Math.pow(0.5, age / halfLife);
    const weight = (event.weights[code] ?? 0) * recency;
    weighted += event.quality * weight;
    total += weight;
  });
  return total === 0 ? null : Math.round((weighted / total) * 100);
}

export function allCompetencyScores(
  events: ScoredEvent[],
): Record<CompetencyCode, number | null> {
  const out = {} as Record<CompetencyCode, number | null>;
  for (const competency of competencies.competencies) {
    out[competency.code as CompetencyCode] = competencyScore(
      events,
      competency.code as CompetencyCode,
    );
  }
  return out;
}

/**
 * §6.7 XP is effort-based so it never contradicts the capability score: you
 * earn it for attempting, and the competency score tells the truth separately.
 */
export function xpFor(quality: number, difficulty: "intro" | "core" | "stretch"): number {
  const base = { intro: 10, core: 20, stretch: 35 }[difficulty];
  return Math.round(base * (0.5 + 0.5 * quality));
}

export type Level = (typeof levels)[number];

export function levelFor(xp: number): { level: Level; next: Level | null; progress: number } {
  let index = 0;
  for (let i = 0; i < levels.length; i += 1) {
    if (xp >= levels[i].xp) index = i;
  }
  const level = levels[index];
  const next = levels[index + 1] ?? null;
  const progress = next
    ? (xp - level.xp) / (next.xp - level.xp)
    : 1;
  return { level, next, progress };
}
