/**
 * §2.4 Copy lint. The banned list exists because these phrases are the exact
 * register the product is a reaction against. Runs over authored content and
 * user-visible source, and fails CI on a hit.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BANNED = [
  "journey",
  "empower",
  "unlock your potential",
  "level up your career",
  "in today's fast-paced world",
  "in today’s fast-paced world",
  "game-changer",
  "rockstar",
  "synergy",
  "circle back",
];

/** §7.5.6 Capacity content additionally must never minimise. */
const BANNED_IN_CAPACITY = [
  "just ",
  "simply ",
  "snap out",
  "everyone feels",
  "man up",
  "back in my day",
  "millennials",
  "gen z are",
];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(ts|tsx|json)$/.test(entry.name) ? [path] : [];
  });
}

const files = walk("src");
const hits = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const lower = text.toLowerCase();
  const isCapacity = /capacity/i.test(file);
  const list = isCapacity ? [...BANNED, ...BANNED_IN_CAPACITY] : BANNED;

  for (const phrase of list) {
    let index = lower.indexOf(phrase);
    while (index !== -1) {
      const line = text.slice(0, index).split("\n").length;
      hits.push({ file, line, phrase });
      index = lower.indexOf(phrase, index + phrase.length);
    }
  }
}

if (hits.length > 0) {
  console.error(`\ncopy lint failed (${hits.length}):`);
  for (const hit of hits) console.error(`  ${hit.file}:${hit.line} — "${hit.phrase}"`);
  console.error("\nRewrite it. The banned list is in scripts/lint-copy.mjs and §2.4.");
  process.exit(1);
}

console.log(`copy ok — ${files.length} files, ${BANNED.length} banned phrases`);
