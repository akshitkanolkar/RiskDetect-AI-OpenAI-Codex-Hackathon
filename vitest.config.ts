import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "services/detection/**/*.test.ts",
      "services/detection/**/__tests__/**/*.ts",
      "services/url-validation/**/*.test.ts",
      "services/url-validation/**/__tests__/**/*.ts",
      "lib/report/**/*.test.ts",
      "lib/report/**/__tests__/**/*.ts",
      "lib/viewer/**/*.test.ts",
      "lib/viewer/**/__tests__/**/*.ts",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
