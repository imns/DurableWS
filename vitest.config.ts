// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        environment: "jsdom",
        include: ["tests/**/*.test.ts"],
        alias: {
            "@": path.resolve(__dirname, "src")
        }
    }
});
