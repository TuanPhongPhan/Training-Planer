import { defineConfig, type UserConfig } from "vitest/config";
import base from "./vitest.config";

const baseConfig = base as UserConfig;

export default defineConfig({
    ...baseConfig,
    test: {
        ...(baseConfig.test ?? {}),
        environment: "node",
        include: ["tests/integration/**/*.test.ts"],
    },
});
