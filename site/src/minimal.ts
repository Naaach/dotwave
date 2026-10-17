import { createDotWave } from "dotwave";
import "./styles.css";
import "./example.css";

// The whole integration: one import, one call.
const wave = createDotWave({
  container: document.body,
  preset: "starfield",
  angle: 20,
  zIndex: -1,
});

// Optional: react to the options from a theme switcher, a slider, etc.
// wave.updateOptions({ preset: "nebula", interactive: true });

// Optional: stop drawing when the hero scrolls away.
// wave.pause();
// wave.destroy();

void wave;
