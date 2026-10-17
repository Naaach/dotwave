import { presetNames, type DotWaveInstance, type PresetName } from "dotwave";
import { marked } from "marked";
import content from "../docs/content.md?raw";
import { mustQuery } from "./dom";

interface Heading {
  id: string;
  level: number;
  title: string;
  element: HTMLHeadingElement;
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

/** Empty container written in content.md, filled with one button per preset. */
const PRESET_SWITCH = "#preset-switch";

/**
 * Clones the shared documentation block (#docs-block) into `slot` and wires it:
 * markdown, heading anchors, scrolling tables, copy buttons, the preset switcher
 * that repaints `wave`, and the table of contents with its scroll spy.
 *
 * The landing page ends with this block and /docs/ is nothing but this block, so
 * the two can never drift apart.
 */
export function mountDocsSection(
  slot: HTMLElement,
  wave: DotWaveInstance,
  signal: AbortSignal,
  preset: PresetName,
  onPreset?: (name: PresetName) => void,
): void {
  const template = document.getElementById("docs-block");
  if (!(template instanceof HTMLTemplateElement)) throw new Error("missing #docs-block");
  slot.replaceChildren(template.content.cloneNode(true));

  const target = mustQuery<HTMLElement>(slot, "#content");
  const toc = mustQuery<HTMLElement>(slot, "#toc");

  const links: HTMLAnchorElement[] = [];
  const headings: Heading[] = [];

  function markCurrent(): void {
    if (!slot.isConnected) return;
    let current = headings[0]?.id;
    for (const heading of headings) {
      if (heading.element.getBoundingClientRect().top <= 100) current = heading.id;
    }
    for (const link of links) link.classList.toggle("current", link.getAttribute("href") === `#${current}`);
  }

  /** Called once, after the markdown has been inserted into #content. */
  function enhance(): void {
    // Heading anchors, added after the ids exist so the TOC can link to them.
    for (const heading of target.querySelectorAll<HTMLHeadingElement>("h2, h3")) {
      const title = heading.textContent ?? "";
      const id = slug(title);
      if (!id) continue;
      heading.id = id;
      headings.push({ id, level: heading.tagName === "H3" ? 3 : 2, title, element: heading });

      const anchor = document.createElement("a");
      anchor.className = "anchor";
      anchor.href = `#${id}`;
      anchor.textContent = "#";
      anchor.setAttribute("aria-label", `Permalink to ${title}`);
      heading.append(anchor);
    }

    // Tables scroll horizontally on narrow screens instead of breaking the layout.
    for (const table of target.querySelectorAll("table")) {
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";
      table.replaceWith(wrap);
      wrap.append(table);
    }

    // One copy button per code block.
    for (const pre of target.querySelectorAll("pre")) {
      const code = pre.querySelector("code");
      if (!code) continue;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-btn";
      button.textContent = "copy";
      button.addEventListener("click", () => {
        void navigator.clipboard.writeText(code.textContent ?? "").then(() => {
          button.textContent = "copied";
          setTimeout(() => (button.textContent = "copy"), 1500);
        });
      });
      pre.append(button);
    }

    // The preset switcher lives inside the markdown, so it can only be filled now:
    // every button repaints the background of the page you are reading on.
    const switcher = slot.querySelector<HTMLElement>(PRESET_SWITCH);
    if (switcher) {
      for (const name of presetNames) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = name;
        button.classList.toggle("on", name === preset);
        button.addEventListener("click", () => {
          wave.updateOptions({ preset: name });
          onPreset?.(name);
          switcher.querySelectorAll("button").forEach((other) => other.classList.remove("on"));
          button.classList.add("on");
        });
        switcher.append(button);
      }
    }

    // Table of contents.
    for (const heading of headings) {
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.title;
      if (heading.level === 3) link.classList.add("sub");
      toc.append(link);
      links.push(link);
    }

    window.addEventListener("scroll", () => requestAnimationFrame(markCurrent), { passive: true, signal });
    markCurrent();

    // A deep link such as /docs/#options can only be resolved now: the headings do
    // not exist until this point. main.ts handles the synchronous case.
    const hash = location.hash.slice(1);
    if (hash) document.getElementById(hash)?.scrollIntoView();
  }

  void (async () => {
    const html = await marked.parse(content);
    if (!slot.isConnected) return;
    target.insertAdjacentHTML("beforeend", html);
    enhance();
  })();
}
