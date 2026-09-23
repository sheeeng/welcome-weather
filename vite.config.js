import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
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
  base: "./",
});
