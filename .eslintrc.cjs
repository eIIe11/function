/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  plugins: ["react-refresh"],
  ignorePatterns: ["dist", "node_modules", "public", "*.cjs"],
  rules: {
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    /* §13.4 The client must never read a raw secret, only the endpoint. */
    "no-restricted-globals": ["error", { name: "event", message: "Use the handler argument." }],
  },
  overrides: [
    {
      files: ["scripts/**/*.{mjs,ts}", "vite.config.ts"],
      env: { node: true, browser: false },
      rules: { "no-console": "off" },
    },
  ],
};
