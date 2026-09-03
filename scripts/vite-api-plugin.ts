import { loadEnv, type Plugin, type ViteDevServer } from "vite";

/**
 * Serves `netlify/functions/*` at `/api/*` during `npm run dev`, matching the
 * redirects in netlify.toml. Without this the dev server 404s every API call and
 * the membership flow can only ever be tested against production.
 *
 * Functions are loaded through Vite's SSR pipeline, so they are TypeScript,
 * hot-reloaded, and the same files Netlify bundles — not a second copy that can
 * drift.
 */
export function devApi(): Plugin {
  return {
    name: "function-dev-api",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      /* Vite only exposes VITE_* to the client and leaves process.env alone, so
         the server-side variables in .env.local are loaded here — otherwise the
         functions behave differently locally than on Netlify. */
      const env = loadEnv(server.config.mode, process.cwd(), "");
      for (const [key, value] of Object.entries(env)) {
        if (!key.startsWith("VITE_")) process.env[key] ??= value;
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/api/")) return next();

        const name = url.slice("/api/".length).split("?")[0].replace(/\/+$/, "");
        if (!/^[a-z0-9-]+$/.test(name)) return next();

        try {
          const module = (await server.ssrLoadModule(`/netlify/functions/${name}.ts`)) as {
            default: (request: Request) => Promise<Response>;
          };

          const body = await readBody(req);
          /* The Host header, not a hardcoded localhost: functions derive their own
             origin from the request, and dropping the port would make every
             same-origin check fail locally. */
          const origin = `http://${req.headers.host ?? "localhost"}`;
          const request = new Request(`${origin}${url}`, {
            method: req.method ?? "GET",
            headers: Object.entries(req.headers).flatMap(([key, value]) =>
              typeof value === "string" ? [[key, value] as [string, string]] : [],
            ),
            body: body.length > 0 ? body : undefined,
          });

          const response = await module.default(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          /* A missing function file is a 404 here, exactly as it would be on
             Netlify — not a dev-server crash. */
          server.config.logger.error(`/api/${name} failed: ${String(error)}`);
          res.statusCode = 404;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: `No API route at /api/${name}` }));
        }
      });
    },
  };
}

function readBody(req: { on: (event: string, listener: (chunk?: Buffer) => void) => void }) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunk && chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", (error) => reject(error));
  });
}
