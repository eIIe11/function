import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BiteLevel } from "@/lib/copy";
import type { ScoredEvent } from "@/lib/scoring";
import { levelFor, xpFor } from "@/lib/scoring";
import type { Weights } from "@/content/schema";

export type Side = "workplace" | "yourself";

export type IntakeResult = {
  typeCode: string;
  starSign: string | null;
  defaultSetting: string | null;
  completedAt: number;
};

/**
 * §5.2 Everything a learner does is written locally as it happens so a dropped
 * connection or a closed tab never loses progress. Supabase sync layers on top
 * of this store rather than replacing it.
 */
type AppState = {
  side: Side | null;
  bite: BiteLevel;
  calm: boolean;
  xp: number;
  events: ScoredEvent[];
  intake: IntakeResult | null;
  /** Item id -> serialised answer, so any activity can resume mid-way. */
  answers: Record<string, unknown>;
  badges: string[];
  commitments: {
    id: string;
    cue: string;
    behaviour: string;
    startedAt: number;
    checkIns: number[];
  }[];

  chooseSide: (side: Side) => void;
  setBite: (bite: BiteLevel) => void;
  setCalm: (calm: boolean) => void;
  saveAnswer: (itemId: string, answer: unknown) => void;
  recordScore: (args: {
    itemId: string;
    quality: number;
    weights: Weights;
    difficulty: "intro" | "core" | "stretch";
  }) => { xpGained: number; levelledUp: boolean };
  completeIntake: (result: IntakeResult) => void;
  awardBadge: (id: string) => void;
  addCommitment: (cue: string, behaviour: string) => void;
  checkIn: (id: string) => void;
  reset: () => void;
};

const initial = {
  side: null,
  bite: "spicy" as BiteLevel,
  calm: false,
  xp: 0,
  events: [] as ScoredEvent[],
  intake: null,
  answers: {} as Record<string, unknown>,
  badges: [] as string[],
  commitments: [] as AppState["commitments"],
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial,

      chooseSide: (side) =>
        set({ side, bite: side === "workplace" ? "boardroom" : "spicy" }),
      setBite: (bite) => set({ bite }),
      setCalm: (calm) => set({ calm }),

      saveAnswer: (itemId, answer) =>
        set((s) => ({ answers: { ...s.answers, [itemId]: answer } })),

      recordScore: ({ itemId, quality, weights, difficulty }) => {
        const before = levelFor(get().xp).level.level;
        const xpGained = xpFor(quality, difficulty);
        set((s) => ({
          xp: s.xp + xpGained,
          events: [...s.events, { quality, weights, at: Date.now() }],
          answers: { ...s.answers, [itemId]: s.answers[itemId] ?? null },
        }));
        const after = levelFor(get().xp).level.level;
        return { xpGained, levelledUp: after > before };
      },

      completeIntake: (intake) => set({ intake }),

      awardBadge: (id) =>
        set((s) => (s.badges.includes(id) ? s : { badges: [...s.badges, id] })),

      addCommitment: (cue, behaviour) =>
        set((s) => ({
          commitments: [
            ...s.commitments,
            { id: crypto.randomUUID(), cue, behaviour, startedAt: Date.now(), checkIns: [] },
          ],
        })),

      checkIn: (id) =>
        set((s) => ({
          commitments: s.commitments.map((c) =>
            c.id === id ? { ...c, checkIns: [...c.checkIns, Date.now()] } : c,
          ),
        })),

      reset: () => set(initial),
    }),
    { name: "function.app", version: 1 },
  ),
);
