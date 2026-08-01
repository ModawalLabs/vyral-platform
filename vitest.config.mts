import { defineConfig } from "vitest/config";

export default defineConfig({
  // `tsconfigPaths` resolves the `@/*` alias; JSX comes from tsconfig's
  // `jsx: react-jsx`, so no transform override is needed.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.{test,spec}.{ts,tsx}", "src/components/ui/**"],
    },
  },
});
