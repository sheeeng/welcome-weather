import React from "react";
import { createRoot } from "react-dom/client";
import { SylvaLivingWorldScene } from "./shaders/sylva-living-world/SylvaLivingWorldScene";
import "./shaders/threeui.css";

let root;
export function mountSeasonalScene(container, variant) {
  root ??= createRoot(container);
  root.render(
    <React.StrictMode>
      <SylvaLivingWorldScene variant={variant} />
    </React.StrictMode>,
  );
}
