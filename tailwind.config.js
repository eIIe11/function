/** @type {import('tailwindcss').Config} */
// Tokens live in src/styles/tokens.css as CSS custom properties and are
// surfaced to Tailwind here. Never hard-code a hex value in a component.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        paper: "var(--paper)",
        "paper-2": "var(--paper-2)",
        acid: "var(--acid)",
        magenta: "var(--magenta)",
        cyan: "var(--cyan)",
        violet: "var(--violet)",
        tangerine: "var(--tangerine)",
        line: "var(--line)",
        track: "var(--track)",
        muted: "var(--muted)",
        bad: "var(--bad)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
      },
      fontFamily: {
        display: ['"Baloo 2 Variable"', '"Baloo 2"', "system-ui", "sans-serif"],
        amp: ['"Nunito Amp"', '"Baloo 2 Variable"', "system-ui", "sans-serif"],
        body: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "monospace"],
      },
      fontSize: {
        xs: "var(--t-xs)",
        sm: "var(--t-sm)",
        md: "var(--t-md)",
        base: "var(--t-md)",
        lg: "var(--t-lg)",
        xl: "var(--t-xl)",
        "2xl": "var(--t-2xl)",
        hero: "var(--t-hero)",
      },
      borderRadius: {
        card: "var(--r-card)",
        control: "var(--r-control)",
      },
      boxShadow: {
        // LOUD only. Offset solid blocks, never blur.
        loud: "6px 6px 0 var(--ink)",
        "loud-sm": "4px 4px 0 var(--ink)",
        "loud-press": "2px 2px 0 var(--ink)",
      },
      maxWidth: {
        prose: "68ch",
        read: "60ch",
      },
      spacing: {
        nav: "var(--nav-h)",
      },
    },
  },
  plugins: [],
};
