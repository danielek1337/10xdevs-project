import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for DOM testing
    environment: "jsdom",

    // Global test setup
    setupFiles: ["./src/test/setup.ts"],

    // Include source files
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],

    // Exclude common directories
    exclude: ["node_modules", "dist", ".astro", "playwright", "e2e", "**/*.e2e.{test,spec}.{js,ts}"],

    // Global test configuration
    globals: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData/",
        "dist/",
        ".astro/",
        "playwright/",
        "e2e/",
      ],
      // Coverage thresholds (configure as needed)
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 80,
      //   statements: 80,
      // },
    },

    // Reporter configuration
    reporters: ["verbose"],

    // Test timeout
    testTimeout: 10000,

    // Hook timeout
    hookTimeout: 10000,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/db": path.resolve(__dirname, "./src/db"),
      "@/types": path.resolve(__dirname, "./src/types.ts"),
    },
  },
});
