import clsx from "clsx";
import { forwardRef } from "react";
import { play, unlockAudio } from "@/lib/sound";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "loud" | "quiet" | "ghost";
  size?: "md" | "lg";
  full?: boolean;
};

/**
 * §11.2 Every control is at least 44px tall and, on mobile, sits within thumb
 * reach. The press state moves the shadow rather than fading opacity so it
 * reads on a sunlit phone screen.
 */
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "loud", size = "md", full, className, onClick, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-control font-body font-semibold",
        "transition-[transform,box-shadow] duration-100 disabled:opacity-40 disabled:pointer-events-none",
        size === "lg" ? "min-h-[56px] px-6 text-md" : "min-h-[44px] px-5 text-sm",
        full && "w-full",
        variant === "loud" && [
          "border-[3px] border-ink bg-accent text-accent-ink shadow-loud-sm",
          "active:translate-x-[2px] active:translate-y-[2px] active:shadow-loud-press",
        ],
        variant === "quiet" && "border border-line bg-paper text-ink active:bg-paper-2",
        variant === "ghost" && "text-muted underline decoration-line underline-offset-4",
        className,
      )}
      onClick={(event) => {
        unlockAudio();
        play("tap");
        onClick?.(event);
      }}
      {...rest}
    />
  );
});
