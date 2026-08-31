import { Link, NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { Wordmark } from "@/components/brand/Wordmark";

const LINKS = [
  { to: "/workplace", label: "Workplace" },
  { to: "/yourself", label: "Yourself" },
  { to: "/membership", label: "Membership" },
];

/** §3.1 LOUD lives out here: grain, heavy borders, colour blocks. */
export function MarketingLayout() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <header className="sticky top-0 z-20 border-b-[3px] border-ink bg-paper">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="text-lg">
            <Wordmark />
          </Link>
          <nav aria-label="Sections" className="flex items-center gap-4">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx(
                    "py-2 text-sm font-semibold",
                    isActive ? "text-ink underline decoration-accent decoration-[3px] underline-offset-4" : "text-muted",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t-[3px] border-ink px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark className="text-lg" />
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
            Become annoyingly capable.
          </p>
        </div>
      </footer>
    </div>
  );
}
