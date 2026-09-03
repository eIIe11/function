/**
 * Shared HTTP helpers for the functions. Deliberately small: the functions are
 * thin, and everything interesting lives in the provider adapters.
 */

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * A failure the buyer is allowed to read. Anything that is not a PublicError is
 * logged and returned as a generic 500, so a provider's error text — which can
 * quote keys or internal ids — never reaches the browser.
 */
export class PublicError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "PublicError";
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof PublicError) {
    return json({ error: error.message }, error.status);
  }
  console.error("function failed:", error);
  return json({ error: "Something went wrong at our end. Nothing was charged." }, 500);
}

export function requirePost(request: Request): void {
  if (request.method !== "POST") {
    throw new PublicError("Method not allowed", 405);
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Not a PublicError: a missing key is our misconfiguration, not the buyer's.
    throw new Error(`${name} is not set. See docs/ENV.md.`);
  }
  return value;
}

/** Rejects anything that isn't an absolute URL on our own origin. */
export function assertOwnOrigin(url: string, siteUrl: string): void {
  let parsed: URL;
  let site: URL;
  try {
    parsed = new URL(url);
    site = new URL(siteUrl);
  } catch {
    throw new PublicError("Invalid return URL");
  }
  if (parsed.origin !== site.origin) {
    throw new PublicError("Invalid return URL");
  }
}
