import type { View } from "./view";

export interface Route {
  /** Normalised path: no trailing slash, "/" for the root. */
  path: string;
  /** Label used in the top nav. */
  label: string;
  /**
   * Loads the view module. Views are dynamic imports, so the landing page only
   * downloads the playground: `marked` and the markdown itself stay in the docs
   * chunk until somebody asks for them.
   */
  load: () => Promise<View>;
}

/** Every route of the site, in nav order. */
export const routes: Route[] = [
  { path: "/", label: "Playground", load: () => import("./views/playground").then((m) => m.playgroundView) },
  { path: "/docs", label: "Docs", load: () => import("./views/docs").then((m) => m.docsView) },
  { path: "/esm", label: "ESM", load: () => import("./views/esm").then((m) => m.esmView) },
  { path: "/minimal", label: "Minimal", load: () => import("./views/minimal").then((m) => m.minimalView) },
];

/** Off-site links, kept next to the routes so the nav stays in one place. */
export const externalLinks = [
  { label: "npm", href: "https://www.npmjs.com/package/dotwave" },
  { label: "GitHub", href: "https://github.com/Naaach/dotwave" },
];
