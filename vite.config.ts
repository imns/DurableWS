import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

/// <reference types="vitest" />
// Configure Vitest (https://vitest.dev/config/)

// https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
    base: "./",
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "durablews",
            // fileName: "durablews"
            // formats: ["es", "cjs", "umd", "iife"],
            fileName: (format) => `durablews.${format}.js`
        }
    },
    plugins: [dts({ rollupTypes: true, insertTypesEntry: true })]
});
