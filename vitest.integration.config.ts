import { defineConfig } from "vitest/config";
import base from "./vitest.config";

const baseConfig = base as { test?: Record<string, unknown> };

export default defineConfig({
    ...baseConfig,
    test: {
        ...baseConfig.test,
        environment: "node",
        include: ["tests/integration/**/*.test.ts"],
    },
});
