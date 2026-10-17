import { createDotWave } from "dotwave";
import { mustQuery } from "../dom";
import { mountDocsSection } from "../docs-section";
import type { View } from "../view";

export const docsView: View = {
  name: "docs",
  title: "dotwave — documentation",
  description:
    "Full documentation for dotwave: install, options, presets, angled grids and the numbers behind its 60 fps at 4K.",

  mount(root) {
    const listeners = new AbortController();

    // The background of this page is a real dotwave instance.
    const wave = createDotWave({ container: mustQuery<HTMLElement>(root, ".stage"), preset: "minimal", angle: 8 });
    mountDocsSection(mustQuery<HTMLElement>(root, ".docs-slot"), wave, listeners.signal, "minimal");

    return () => {
      listeners.abort();
      wave.destroy();
    };
  },
};
