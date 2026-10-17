/**
 * Loads the built CDN bundle in jsdom and drives it like a browser would.
 *
 * The unit tests import the TypeScript source; this one checks the artefact npm
 * and unpkg actually serve, so a broken tsup config cannot ship.
 */

import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const BUNDLE = new URL("../dist/index.global.js", import.meta.url);
const code = readFileSync(BUNDLE, "utf8");

const dom = new JSDOM(`<!doctype html><html><body><div id="hero"></div></body></html>`, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
});

const { window } = dom;

// jsdom has no canvas implementation, so give the bundle something to draw on.
const noop = () => {};
window.HTMLCanvasElement.prototype.getContext = function getContext() {
  return {
    canvas: this,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    shadowBlur: 0,
    shadowColor: "",
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    save: noop,
    restore: noop,
    beginPath: noop,
    closePath: noop,
    arc: noop,
    rect: noop,
    fill: noop,
    stroke: noop,
    fillRect: noop,
    clearRect: noop,
    translate: noop,
    rotate: noop,
  };
};

function assert(condition, message) {
  if (!condition) {
    console.error(`smoke: FAIL ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`smoke: ok   ${message}`);
  }
}

window.eval(code);

const api = window.DotWave;

assert(typeof api === "object", "global DotWave exists");
assert(typeof api.createDotWave === "function", "createDotWave is exported");
assert(typeof api.SimplexNoise3D === "function", "SimplexNoise3D is exported");
assert(
  Array.isArray(api.presetNames) && api.presetNames.includes("aurora"),
  "presetNames is exported",
);

const noise = new api.SimplexNoise3D(1);
const sample = noise.noise3D(1.5, 2.5, 3.5);
assert(Number.isFinite(sample) && sample >= -1 && sample <= 1, "noise samples in [-1, 1]");

const wave = api.createDotWave({ container: "#hero", preset: "nebula", angle: 45, interactive: true });

assert(wave.running === true, "the loop is running");
assert(window.document.querySelector("#hero canvas") === wave.canvas, "the canvas is mounted");

wave.updateOptions({ preset: "ember", speed: 0 });
wave.pause();
assert(wave.running === false, "pause stops the loop");

wave.play();
assert(wave.running === true, "play resumes the loop");

wave.destroy();
assert(wave.running === false, "destroy stops the loop");
assert(window.document.querySelector("#hero canvas") === null, "destroy removes the canvas");

if (process.exitCode) {
  console.error("\nsmoke: bundle did not behave as expected");
} else {
  console.log("\nsmoke: dist/index.global.js is good");
}
