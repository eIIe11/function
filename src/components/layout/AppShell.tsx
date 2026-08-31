import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { useApp } from "@/store/app";
import { Wordmark } from "@/components/brand/Wordmark";
import { levelFor } from "@/lib/scoring";

const TABS = [
  { to: "/learn", label: "Learn" },
  { to: "/tracker", label: "Tracker" },
  { to: "/troubleshoot", label: "Fix" },
  { to: "/you", label: "You" },
];

/**
 * §11.1 Mobile-first chrome: a thin top bar and a thumb-reachable bottom nav
 * that respects the iOS safe area. Everything inside is QUIET — the learning
 * surface never gets the poster treatment.
 */
export function AppShell() {
  const side = useApp((s) => s.side);
  const xp = useApp((s) => s.xp);
  const calm = useApp((s) => s.calm);
  const { level } = levelFor(xp);

  return (
    <div
      data-side={side ?? "yourself"}
      data-calm={calm ? "true" : undefined}
      className="flex min-h-[100dvh] flex-col bg-paper"
    >
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur">
        <NavLink to="/learn" className="text-lg">
          <Wordmark />
        </NavLink>
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
          {level.name} · {xp} XP
        </span>
      </header>

      <main className="mx-auto w-full max-w-prose flex-1 px-4 pb-[calc(var(--nav-h)+28px)] pt-5">
        <Outlet />
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex h-nav max-w-prose">
          {TABS.map((tab) => (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  clsx(
                    "flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold",
                    isActive ? "text-ink" : "text-muted",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden="true"
                      className={clsx(
                        "h-1.5 w-1.5 rounded-full",
                        isActive ? "bg-accent" : "bg-transparent",
                      )}
                    />
                    {tab.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
