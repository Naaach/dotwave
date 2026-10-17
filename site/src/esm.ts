import { createDotWave, presets, presetNames } from "dotwave";
import "./styles.css";
import "./example.css";

const wave = createDotWave({
  container: document.body,
  preset: "nebula",
  angle: 45,
  interactive: true,
  zIndex: -1,
});

console.log("available presets:", presetNames, presets);

// In a framework this is where you'd call wave.destroy() on unmount.
addEventListener("pagehide", () => wave.destroy(), { once: true });
