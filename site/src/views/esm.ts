import { createDotWave } from "dotwave";
import { mustQuery } from "../dom";
import type { View } from "../view";

export const esmView: View = {
  name: "esm",
  title: "dotwave — ESM usage",
  description: "dotwave imported as an ES module: one import, one call.",

  mount(root) {
    const wave = createDotWave({
      container: mustQuery<HTMLElement>(root, ".stage"),
      preset: "nebula",
      angle: 45,
      interactive: true,
    });

    // In a framework this is where you'd call wave.destroy() on unmount — which is
    // exactly what the router does when you leave this view.
    return () => wave.destroy();
  },
};
