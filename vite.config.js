import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

if (!process.env.VITE_GIT_COMMIT_SHA_8_CHAR) {
  try {
    process.env.VITE_GIT_COMMIT_SHA_8_CHAR = execSync("git rev-parse HEAD")
      .toString()
      .trim()
      .slice(0, 8);
  } catch {
    // Not in a git repository or git is unavailable.
  }
}
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    {
      name: "remove-unused-sylva-font",
      enforce: "pre",
      load(identifier) {
        if (!identifier.endsWith("inner-green-3d.html?raw")) return null;
        const source = readFileSync(identifier.slice(0, -4), "utf8").replace(
          /@font-face\s*\{[^}]*lexend-latin\.woff2[^}]*\}/,
          "",
        );
        return `export default ${JSON.stringify(source)};`;
      },
    },
    react(),
  ],
  base: process.env.VITE_BASE_PATH ?? "./",
});
