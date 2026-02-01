import { defineConfig } from "vitest/config";
import base from "./vitest.config";

export default defineConfig({
    ...base,
    test: {
        ...(base as any).test,
        environment: "node",
        include: ["tests/integration/**/*.test.ts"],
    },
});
