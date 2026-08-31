/**
 * §8.2 Content gate. Runs the Zod schemas over every piece of authored content
 * and fails the build on anything malformed. In production mode it also fails on
 * unreviewed content, so `reviewed_by: null` can never reach a learner.
 */
import { CompetencyModelSchema, MIN_ITEM_TYPES_PER_UNIT } from "../src/content/schema";
import competencies from "../src/content/competencies.json";
import { intake } from "../src/content/intake";
import { units } from "../src/content/units";
import levels from "../src/content/levels.json";
import badges from "../src/content/badges.json";

const requireReviewed = process.env.CONTENT_REQUIRE_REVIEW === "true";
const problems: string[] = [];
const notes: string[] = [];

CompetencyModelSchema.parse(competencies);

if (levels.length < 5) problems.push(`levels.json: only ${levels.length} levels`);
if (badges.length < 5) problems.push(`badges.json: only ${badges.length} badges`);

const xps = levels.map((l) => l.xp);
if (xps.some((xp, i) => i > 0 && xp <= xps[i - 1]!)) {
  problems.push("levels.json: xp thresholds must strictly increase");
}

/* Intake and units are validated by their own schemas at module load; importing
   them is the test. What follows is what a schema cannot express. */

const unreviewed: string[] = [];

for (const item of intake.baseline) {
  if (item.reviewed_by === null) unreviewed.push(`intake/${item.id}`);
}
for (const type of intake.type_descriptions) {
  if (type.reviewed_by === null) unreviewed.push(`intake/type/${type.code}`);
}

for (const unit of units) {
  const items = [unit.cold_open, unit.mess, unit.build_it, ...unit.recognise];
  const ids = items.map((i) => i.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length > 0) {
    problems.push(`${unit.id}: duplicate item ids ${duplicates.join(", ")}`);
  }

  const types = new Set(items.map((i) => i.type));
  if (types.size < MIN_ITEM_TYPES_PER_UNIT) {
    problems.push(`${unit.id}: ${types.size} item types, needs ${MIN_ITEM_TYPES_PER_UNIT}`);
  }

  for (const item of items) {
    if (item.reviewed_by === null) unreviewed.push(`${unit.id}/${item.id}`);
  }

  for (const scenario of unit.simulator) {
    if (scenario.reviewed_by === null) unreviewed.push(`${unit.id}/${scenario.id}`);

    // Depth 3–5, and every node must be reachable from the entry.
    const reachable = new Set<string>();
    let depth = 0;
    let frontier = [scenario.entry];
    while (frontier.length > 0 && depth < 12) {
      const next: string[] = [];
      for (const id of frontier) {
        if (reachable.has(id)) continue;
        reachable.add(id);
        for (const option of scenario.nodes[id]!.options) {
          if (option.next !== "END") next.push(option.next);
        }
      }
      frontier = next;
      if (next.length > 0) depth += 1;
    }
    const orphans = Object.keys(scenario.nodes).filter((id) => !reachable.has(id));
    if (orphans.length > 0) {
      problems.push(`${scenario.id}: unreachable nodes ${orphans.join(", ")}`);
    }
    if (depth < 2) {
      problems.push(`${scenario.id}: only ${depth + 1} levels deep, needs at least 3`);
    }

    // A scenario where nothing you do matters teaches nothing.
    for (const [id, node] of Object.entries(scenario.nodes)) {
      const qualities = new Set(node.options.map((o) => o.quality));
      if (qualities.size === 1) {
        problems.push(`${scenario.id}/${id}: every option has the same quality`);
      }
    }
  }
}

if (unreviewed.length > 0) {
  const message = `${unreviewed.length} unreviewed: ${unreviewed.slice(0, 8).join(", ")}${
    unreviewed.length > 8 ? ", …" : ""
  }`;
  if (requireReviewed) problems.push(message);
  else notes.push(message);
}

for (const note of notes) console.warn(`content: ${note}`);

if (problems.length > 0) {
  console.error(`\ncontent validation failed (${problems.length}):`);
  for (const problem of problems) console.error(`  · ${problem}`);
  process.exit(1);
}

console.log(
  `content ok — ${units.length} unit(s), ${intake.baseline.length} baseline items, ${intake.type_descriptions.length} types`,
);
