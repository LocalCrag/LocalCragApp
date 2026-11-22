import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      // The Node entry requires the native `canvas` package. Tests run in
      // jsdom, so use the browser build that Karma resolved before.
      konva: path.join(root, "node_modules/konva/lib/index.js"),
    },
  },
});
