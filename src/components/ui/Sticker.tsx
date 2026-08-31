import clsx from "clsx";

type Props = {
  children: React.ReactNode;
  colour?: "acid" | "magenta" | "cyan" | "violet" | "tangerine";
  rotate?: number;
  className?: string;
};

/**
 * §3.4 Riso-print sticker: hard edge, no gradient, a little off-axis. Used for
 * badges, prices and marketing punctuation. Never inside a unit.
 */
export function Sticker({ children, colour = "acid", rotate = -4, className }: Props) {
  return (
    <span
      className={clsx(
        "inline-block border-[3px] border-ink px-3 py-1 font-display font-extrabold uppercase leading-none",
        "shadow-loud-press",
        colour === "acid" && "bg-acid text-ink",
        colour === "magenta" && "bg-magenta text-paper",
        colour === "cyan" && "bg-cyan text-ink",
        colour === "violet" && "bg-violet text-paper",
        colour === "tangerine" && "bg-tangerine text-ink",
        className,
      )}
      style={{ rotate: `${rotate}deg` }}
    >
      {children}
    </span>
  );
}
