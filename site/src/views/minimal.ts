import { createDotWave } from "dotwave";
import { mustQuery } from "../dom";
import type { View } from "../view";

export const minimalView: View = {
  name: "minimal",
  title: "dotwave — minimal usage",
  description: "The whole dotwave integration: one call, four useful lines.",

  mount(root) {
    // The whole integration: one import, one call. The router calls destroy()
    // when you navigate away, which is all a framework binding has to do too.
    const wave = createDotWave({
      container: mustQuery<HTMLElement>(root, ".stage"),
      preset: "starfield",
      angle: 20,
    });

    return () => wave.destroy();
  },
};
