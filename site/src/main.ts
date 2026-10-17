import { externalLinks, routes, type Route } from "./routes";
import { mustQuery } from "./dom";
import { notFoundView } from "./views/not-found";
import type { View } from "./view";
// Every sheet the site needs. Keeping them in one bundle means the first paint of
// any route is styled: a view never has to wait for its own stylesheet.
import "./styles.css";
import "./playground.css";
import "./example.css";

const root = mustQuery<HTMLElement>(document, "#view");
const nav = mustQuery<HTMLElement>(document, "#topnav");
const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');

// The router owns scrolling: no browser restores, no jumps between views.
history.scrollRestoration = "manual";

// ---- top nav, built from the route table -----------------------------------

for (const route of routes) {
  const link = document.createElement("a");
  link.href = route.path === "/" ? "/" : `${route.path}/`;
  link.textContent = route.label;
  link.dataset.route = route.path;
  nav.append(link);
}

for (const external of externalLinks) {
  const link = document.createElement("a");
  link.href = external.href;
  link.textContent = external.label;
  nav.append(link);
}

// ---- router ----------------------------------------------------------------

/** "/docs/" -> "/docs", "/" -> "/", "//" -> "/". */
function normalize(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** Loads a route's view once: navigating back and forth reuses the same module. */
const loaded = new Map<string, Promise<View>>();

function loadView(route: Route): Promise<View> {
  let pending = loaded.get(route.path);
  if (!pending) {
    pending = route.load();
    loaded.set(route.path, pending);
  }
  return pending;
}

let dispose: (() => void) | undefined;
let generation = 0;
let currentPath: string | undefined;

async function render(): Promise<void> {
  const token = ++generation;

  const path = normalize(location.pathname);

  // Same route, different hash (back/forward between anchors): the view already
  // mounted, so re-rendering it would flicker and throw the reader back to the top.
  if (path === currentPath) {
    if (!location.hash) window.scrollTo({ top: 0, behavior: "instant" });
    return;
  }
  currentPath = path;

  const route = routes.find((candidate) => candidate.path === path);

  // The nav reacts to the click, not to the chunk: no dead half-second.
  for (const link of nav.querySelectorAll<HTMLAnchorElement>("a[data-route]")) {
    link.classList.toggle("active", link.dataset.route === path);
  }

  let view: View;
  try {
    view = route ? await loadView(route) : notFoundView;
  } catch (error) {
    console.error(`dotwave: could not load the "${path}" view`, error);
    view = notFoundView;
  }

  // Somebody navigated again while the chunk was on the wire.
  if (token !== generation) return;

  const template = document.getElementById(`view-${view.name}`);
  if (!(template instanceof HTMLTemplateElement)) throw new Error(`missing template for "${view.name}"`);

  // The previous view is destroyed only now that the next one is ready, so a slow
  // chunk never leaves a blank page behind.
  dispose?.();
  dispose = undefined;

  root.replaceChildren(template.content.cloneNode(true));
  document.body.dataset.view = view.name;
  document.title = view.title;
  if (description) description.content = view.description;

  dispose = view.mount(root) ?? undefined;

  // Deep links land on their anchor. The docs render asynchronously, so the
  // target may only exist after mount(): that view scrolls to it itself.
  const hash = location.hash.slice(1);
  const target = hash ? document.getElementById(hash) : null;
  if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: "instant" }));
  // Route changes jump, never ease: `html { scroll-behavior: smooth }` would keep
  // animating over the swap and the browser would clamp it to the new document.
  else window.scrollTo({ top: 0, behavior: "instant" });
}

function navigate(href: string): void {
  history.pushState(null, "", href);
  void render();
}

// ---- client-side links -----------------------------------------------------

document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const anchor = (event.target as Element | null)?.closest("a");
  if (!anchor || anchor.target) return;

  const href = anchor.getAttribute("href");
  if (!href || !href.startsWith("/")) return; // "#anchor", "https://", "mailto:"

  const url = new URL(href, location.href);

  if (url.pathname === location.pathname) {
    // Same view, different anchor: let the browser do the scrolling.
    if (url.hash) return;
    // Same view, no anchor: back to the top, like the current nav item usually does.
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  event.preventDefault();
  navigate(url.pathname + url.hash);
});

window.addEventListener("popstate", () => void render());

void render();
