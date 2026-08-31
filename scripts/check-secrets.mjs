/**
 * §13.4 Nothing secret ships to the browser. Scans tracked source for key-shaped
 * strings and for any client-side reference to a server-only env var.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PATTERNS = [
  { name: "OpenAI/Anthropic key", re: /\b(sk-ant-|sk-)[A-Za-z0-9_-]{20,}/ },
  { name: "Stripe secret key", re: /\bsk_(live|test)_[A-Za-z0-9]{16,}/ },
  { name: "Lemon Squeezy key", re: /\beyJ0eXAiOiJKV1Qi[A-Za-z0-9._-]{40,}/ },
  { name: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "GitHub token", re: /\bgh[pousr]_[A-Za-z0-9]{30,}/ },
  { name: "Supabase service role key", re: /service_role[^\n]{0,40}ey[A-Za-z0-9]/ },
  { name: "Private key block", re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
];

/**
 * Anything not prefixed `VITE_` is inlined by nothing and available to nobody on
 * the client, so a reference to one inside src/ is a mistake worth failing on.
 */
const SERVER_ONLY = [
  "ANTHROPIC_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "LEMONSQUEEZY_API_KEY",
  "PADDLE_API_KEY",
  "POLAR_ACCESS_TOKEN",
  "STRIPE_SECRET_KEY",
  "PAYMENT_WEBHOOK_SECRET",
];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : walk(path);
    return /\.(ts|tsx|js|jsx|mjs|json|html|css)$/.test(entry.name) ? [path] : [];
  });
}

const problems = [];

for (const file of [...walk("src"), ...walk("scripts"), ...walk("netlify"), "index.html"]) {
  const text = readFileSync(file, "utf8");
  for (const { name, re } of PATTERNS) {
    const match = re.exec(text);
    if (match) {
      const line = text.slice(0, match.index).split("\n").length;
      problems.push(`${file}:${line} — looks like a ${name}`);
    }
  }
  if (file.startsWith("src")) {
    for (const key of SERVER_ONLY) {
      if (text.includes(key) && !file.endsWith(".md")) {
        const index = text.indexOf(key);
        const line = text.slice(0, index).split("\n").length;
        problems.push(`${file}:${line} — server-only env var ${key} referenced in client code`);
      }
    }
    /* The functions may import from src (plans, types); the reverse would bundle
       a provider adapter — and whatever it reads from process.env — into the app. */
    if (/from\s+["'][^"']*netlify\//.test(text)) {
      problems.push(`${file} — client code imports from netlify/`);
    }
  }
}

if (problems.length > 0) {
  console.error(`\nsecret scan failed (${problems.length}):`);
  for (const problem of problems) console.error(`  · ${problem}`);
  process.exit(1);
}

console.log("secret scan ok");
