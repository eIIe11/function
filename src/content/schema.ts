import { z } from "zod";

/**
 * §8.1 Core schema. This file is the only definition of what content may look
 * like; `scripts/validate-content.ts` runs it over every JSON file in
 * src/content at build time so a malformed scenario fails CI, not a learner.
 */

export const COMPETENCY_CODES = [
  "AGY",
  "INI",
  "JDG",
  "RSC",
  "COM",
  "ACC",
  "RES",
  "AWR",
  "EXE",
  "SOC",
] as const;

export const CodeSchema = z.enum(COMPETENCY_CODES);
export type Code = z.infer<typeof CodeSchema>;
export type CompetencyCode = Code;

/**
 * §2.3 BITE LEVEL. Never author one register. Both are required by the type,
 * so a missing register is a type error before it is ever a lint error.
 */
export const CopySchema = z.object({
  spicy: z.string().min(1),
  boardroom: z.string().min(1),
});
export type Copy = z.infer<typeof CopySchema>;

/** Weights must sum to 1.0 so a single item can never inflate a profile. */
export const WeightsSchema = z
  .record(CodeSchema, z.number().min(0).max(1))
  .refine(
    (w) => {
      const total = Object.values(w).reduce((a, b) => a + (b ?? 0), 0);
      return Math.abs(total - 1) < 0.001;
    },
    { message: "competency_weights must sum to 1.0" },
  );
export type Weights = z.infer<typeof WeightsSchema>;

export const ITEM_TYPES = [
  "mcq_weighted",
  "simulator_node",
  "inbox",
  "chat_sim",
  "rewrite",
  "triage",
  "sequence",
  "subtext",
  "ten_minute",
  "hot_takes",
  "wrong_answer_museum",
  "interactive_essay",
  "micro_video",
  "audio_case",
  "open_response",
  "commitment",
  "cold_open",
] as const;

export const ItemTypeSchema = z.enum(ITEM_TYPES);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const DifficultySchema = z.enum(["intro", "core", "stretch"]);

export const OptionSchema = z.object({
  id: z.string().min(1),
  label: CopySchema,
  /**
   * §8.1 The most important decision in the schema. NOT a boolean.
   * 1.0 strongest · 0.6 defensible · 0.3 weak · 0.0 harmful.
   */
  quality: z.number().min(0).max(1),
  consequence: CopySchema,
});
export type Option = z.infer<typeof OptionSchema>;

export const DebriefSchema = z.object({
  verdict: CopySchema,
  per_option: z.record(z.string(), CopySchema).optional(),
  principle: CopySchema,
});

/* §9 Payloads for the non-MCQ interaction types. Each type carries exactly the
   shape it needs; `ItemSchema`'s refinement enforces the pairing so a
   `hot_takes` item without a deck fails the build. */

export const HotTakesPayloadSchema = z.object({
  kind: z.literal("hot_takes"),
  cards: z
    .array(
      z.object({
        id: z.string().min(1),
        statement: CopySchema,
        /** True when the statement is more true than false. Nuance follows either way. */
        agree_is_stronger: z.boolean(),
        nuance: CopySchema,
      }),
    )
    .min(3),
});

export const SubtextPayloadSchema = z.object({
  kind: z.literal("subtext"),
  lines: z
    .array(
      z.object({
        id: z.string().min(1),
        speaker: z.string().min(1),
        line: CopySchema,
        options: z.array(OptionSchema).min(2),
      }),
    )
    .min(2),
});

export const SequencePayloadSchema = z.object({
  kind: z.literal("sequence"),
  steps: z.array(z.object({ id: z.string().min(1), label: CopySchema })).min(3),
  /** Step ids, strongest-to-weakest or first-to-last. */
  correct_order: z.array(z.string().min(1)).min(3),
});

export const TriagePayloadSchema = z.object({
  kind: z.literal("triage"),
  buckets: z
    .array(z.object({ id: z.string().min(1), label: z.string().min(1) }))
    .min(2),
  demands: z
    .array(
      z.object({
        id: z.string().min(1),
        label: CopySchema,
        correct_bucket: z.string().min(1),
        /** Why it belongs there. Shown per-demand in the debrief. */
        reason: CopySchema,
      }),
    )
    .min(4),
});

export const OpenResponsePayloadSchema = z.object({
  kind: z.literal("open_response"),
  /** §9 The learner can read the rubric before writing. Published, not secret. */
  rubric: z.array(z.object({ criterion: z.string().min(1), detail: CopySchema })).min(2),
  min_chars: z.number().int().positive().default(80),
});

export const CommitmentPayloadSchema = z.object({
  kind: z.literal("commitment"),
  suggestions: z.array(z.object({ cue: CopySchema, behaviour: CopySchema })).min(2),
});

export const PayloadSchema = z.discriminatedUnion("kind", [
  HotTakesPayloadSchema,
  SubtextPayloadSchema,
  SequencePayloadSchema,
  TriagePayloadSchema,
  OpenResponsePayloadSchema,
  CommitmentPayloadSchema,
]);
export type Payload = z.infer<typeof PayloadSchema>;

const PAYLOAD_KIND_BY_TYPE: Partial<Record<ItemType, Payload["kind"]>> = {
  hot_takes: "hot_takes",
  subtext: "subtext",
  sequence: "sequence",
  triage: "triage",
  open_response: "open_response",
  commitment: "commitment",
};

const BaseItemSchema = z.object({
  id: z.string().min(1),
  type: ItemTypeSchema,
  difficulty: DifficultySchema,
  prompt: CopySchema,
  options: z.array(OptionSchema).optional(),
  payload: PayloadSchema.optional(),
  debrief: DebriefSchema,
  time_limit_s: z.number().positive().optional(),
  tags: z.array(z.string()).default([]),
  /** §8.2 CI blocks a production deploy of anything still null. */
  reviewed_by: z.string().nullable(),
});

/**
 * §7.5.6.1 Capacity items are unscored, so they must not carry weights. Making
 * scored/unscored a discriminated union means "unscored item with weights" is
 * unrepresentable rather than merely discouraged.
 */
export const ItemSchema = z
  .discriminatedUnion("scored", [
    BaseItemSchema.extend({
      scored: z.literal(true),
      competency_weights: WeightsSchema,
    }),
    BaseItemSchema.extend({
      scored: z.literal(false),
      competency_weights: z.undefined().optional(),
    }),
  ])
  .superRefine((item, ctx) => {
    const expected = PAYLOAD_KIND_BY_TYPE[item.type];
    if (expected && item.payload?.kind !== expected) {
      ctx.addIssue({
        code: "custom",
        message: `${item.id}: type "${item.type}" requires a "${expected}" payload`,
      });
    }
    // The choice-driven types are the ones that need graded options.
    const needsOptions = item.type === "mcq_weighted" || item.type === "cold_open";
    if (needsOptions && (item.options?.length ?? 0) < 2) {
      ctx.addIssue({ code: "custom", message: `${item.id}: needs at least two options` });
    }
    if (item.type === "mcq_weighted" && !item.options?.some((o) => o.quality >= 0.9)) {
      ctx.addIssue({
        code: "custom",
        message: `${item.id}: no option scores ≥0.9, so there is no strongest answer`,
      });
    }
    if (item.payload?.kind === "sequence") {
      const ids = new Set(item.payload.steps.map((s) => s.id));
      const order = item.payload.correct_order;
      if (order.length !== ids.size || !order.every((id) => ids.has(id))) {
        ctx.addIssue({
          code: "custom",
          message: `${item.id}: correct_order must be a permutation of step ids`,
        });
      }
    }
    if (item.payload?.kind === "triage") {
      const buckets = new Set(item.payload.buckets.map((b) => b.id));
      for (const demand of item.payload.demands) {
        if (!buckets.has(demand.correct_bucket)) {
          ctx.addIssue({
            code: "custom",
            message: `${item.id}/${demand.id}: unknown bucket "${demand.correct_bucket}"`,
          });
        }
      }
    }
  });
export type Item = z.infer<typeof ItemSchema>;

/** §10.1 A scenario is a small directed graph, depth 3–5. */
export const NodeSchema = z.object({
  id: z.string().min(1),
  prompt: CopySchema,
  options: z.array(OptionSchema.extend({ next: z.string().min(1) })).min(2),
  pressure: z
    .object({ time_limit_s: z.number().positive(), on_expire: z.string() })
    .optional(),
});
export type ScenarioNode = z.infer<typeof NodeSchema>;

export const DocSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["email", "brief", "chat", "doc"]),
  from: z.string().optional(),
  title: z.string().min(1),
  body: CopySchema,
});
export type Doc = z.infer<typeof DocSchema>;

export const ScenarioSchema = z
  .object({
    id: z.string().min(1),
    title: CopySchema,
    setup: CopySchema,
    context_docs: z.array(DocSchema).default([]),
    entry: z.string().min(1),
    nodes: z.record(z.string(), NodeSchema),
    competency_weights: WeightsSchema,
    principle: CopySchema,
    reviewed_by: z.string().nullable(),
  })
  .superRefine((s, ctx) => {
    const ids = new Set(Object.keys(s.nodes));
    if (!ids.has(s.entry)) {
      ctx.addIssue({ code: "custom", message: `entry "${s.entry}" is not a node` });
    }
    for (const [nodeId, node] of Object.entries(s.nodes)) {
      if (node.id !== nodeId) {
        ctx.addIssue({ code: "custom", message: `node key "${nodeId}" != node.id "${node.id}"` });
      }
      for (const opt of node.options) {
        if (opt.next !== "END" && !ids.has(opt.next)) {
          ctx.addIssue({
            code: "custom",
            message: `${nodeId}/${opt.id} points at missing node "${opt.next}"`,
          });
        }
      }
      if (node.pressure && node.pressure.on_expire !== "END" && !ids.has(node.pressure.on_expire)) {
        ctx.addIssue({ code: "custom", message: `${nodeId} pressure.on_expire is missing` });
      }
    }
  });
export type Scenario = z.infer<typeof ScenarioSchema>;

export const UnitSchema = z.object({
  id: z.string().min(1),
  side: z.enum(["workplace", "yourself", "both"]),
  number: z.number().int().positive(),
  title: CopySchema,
  /** §7.1 The subtitle is the straight description under the joke. */
  subtitle: CopySchema,
  primary_competencies: z.array(CodeSchema).min(1),
  pathways: z.array(z.string()).default([]),
  estimated_minutes: z.number().int().positive(),
  cold_open: ItemSchema,
  idea: z.object({
    heading: CopySchema,
    blocks: z.array(z.object({ heading: CopySchema.optional(), body: CopySchema })).min(1),
  }),
  science: z.object({
    heading: CopySchema,
    findings: z
      .array(
        z.object({
          effect: z.string().min(1),
          body: CopySchema,
          citation: z.string().min(1),
        }),
      )
      .min(1),
  }),
  recognise: z.array(ItemSchema).min(1),
  simulator: z.array(ScenarioSchema).min(1),
  mess: ItemSchema,
  build_it: ItemSchema,
  close: z.object({ principle: CopySchema }),
});
export type Unit = z.infer<typeof UnitSchema>;

/**
 * §9 Monotony is the enemy. Counted over the unit's own items only — the
 * simulators are not counted, because every unit has one and including them
 * would let a unit of six MCQs pass.
 */
export const MIN_ITEM_TYPES_PER_UNIT = 5;

export const UnitVarietySchema = UnitSchema.superRefine((unit, ctx) => {
  const types = new Set<ItemType>([
    unit.cold_open.type,
    unit.mess.type,
    unit.build_it.type,
    ...unit.recognise.map((i) => i.type),
  ]);
  if (types.size < MIN_ITEM_TYPES_PER_UNIT) {
    ctx.addIssue({
      code: "custom",
      message: `${unit.id}: uses ${types.size} item types (${[...types].join(", ")}), needs at least ${MIN_ITEM_TYPES_PER_UNIT}`,
    });
  }
});

/* ---------------------------------------------------------------- §6.5 intake */

/** §6.5.1 Four axes, one letter each, four letters total. */
export const AXES = ["approach", "friction", "register", "completion"] as const;
export const AxisSchema = z.enum(AXES);
export type Axis = z.infer<typeof AxisSchema>;

export const AXIS_POLES: Record<Axis, readonly [string, string]> = {
  approach: ["M", "P"],
  friction: ["A", "E"],
  register: ["D", "S"],
  completion: ["F", "O"],
};

export const TypeCodeSchema = z
  .string()
  .length(4)
  .refine((code) => {
    // §6.5.1 A code is invalid if it draws two letters from the same axis.
    const order = AXES;
    return order.every((axis, i) => AXIS_POLES[axis].includes(code[i]!));
  }, "type code must take exactly one letter per axis, in axis order");

export const PairSchema = z.object({
  id: z.string().min(1),
  axis: AxisSchema,
  a: z.object({ letter: z.string().length(1), label: CopySchema }),
  b: z.object({ letter: z.string().length(1), label: CopySchema }),
});

export const DefaultSettingItemSchema = z.object({
  id: z.string().min(1),
  prompt: CopySchema,
  /** Each option votes for one of the nine default settings. */
  options: z
    .array(z.object({ setting: z.number().int().min(1).max(9), label: CopySchema }))
    .min(3),
});

export const TypeDescriptionSchema = z.object({
  code: TypeCodeSchema,
  name: z.string().min(1),
  diagnosis: CopySchema,
  /** What this type is reliably good at. Never only the roast. */
  strength: CopySchema,
  watch_out: CopySchema,
  recommended_pathway: z.string().min(1),
  reviewed_by: z.string().nullable(),
});

export const DefaultSettingSchema = z.object({
  number: z.number().int().min(1).max(9),
  label: z.string().min(1),
  body: CopySchema,
});

export const IntakeSchema = z.object({
  version: z.string().min(1),
  pairs: z.array(PairSchema).length(12),
  default_setting_items: z.array(DefaultSettingItemSchema).length(6),
  default_settings: z.array(DefaultSettingSchema).length(9),
  /** §6.5.3 The Baseline. A situational judgement test. Never an IQ test. */
  baseline: z.array(ItemSchema).length(12),
  star_signs: z.array(z.string()).length(12),
  type_descriptions: z.array(TypeDescriptionSchema).length(16),
});
export type Intake = z.infer<typeof IntakeSchema>;

export const CompetencyModelSchema = z.object({
  competency_model_version: z.string().min(1),
  bands: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        min: z.number(),
        max: z.number(),
      }),
    )
    .length(4),
  competencies: z
    .array(
      z.object({
        code: CodeSchema,
        name: z.string().min(1),
        colour: z.string().startsWith("--"),
        definition: z.string().min(1),
      }),
    )
    .length(10),
});
export type CompetencyModel = z.infer<typeof CompetencyModelSchema>;
