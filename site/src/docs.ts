import { createDotWave, presetNames } from "dotwave";
import { marked } from "marked";
import content from "../docs/content.md?raw";
import "./styles.css";

const target = document.getElementById("content");
const toc = document.getElementById("toc");
if (!target || !toc) throw new Error("docs page is missing #content or #toc");

// ---- background: this page runs on the library it documents ----------------

const wave = createDotWave({ container: "#stage", preset: "minimal", angle: 8 });

/** Fills the preset switcher that lives inside the rendered markdown. */
function fillPresetSwitcher(): void {
  const switcher = document.getElementById("preset-switch");
  if (!switcher) return;

  for (const name of presetNames) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.classList.toggle("on", name === "minimal");
    button.addEventListener("click", () => {
      wave.updateOptions({ preset: name });
      switcher.querySelectorAll("button").forEach((other) => other.classList.remove("on"));
      button.classList.add("on");
    });
    switcher.append(button);
  }
}

// ---- markdown -> html ------------------------------------------------------

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const html = await marked.parse(content);
target.insertAdjacentHTML("beforeend", html);

interface Heading {
  id: string;
  level: number;
  title: string;
}

// Heading anchors, kept before the "#" links are appended.
const headings: Heading[] = [];

for (const heading of target.querySelectorAll<HTMLHeadingElement>("h2, h3")) {
  const title = heading.textContent ?? "";
  const id = slug(title);
  if (!id) continue;
  heading.id = id;
  headings.push({ id, level: heading.tagName === "H3" ? 3 : 2, title });

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

// The switcher lives inside the markdown, so it can only be filled now.
fillPresetSwitcher();

// ---- table of contents -----------------------------------------------------

const links: HTMLAnchorElement[] = [];

for (const heading of headings) {
  const link = document.createElement("a");
  link.href = `#${heading.id}`;
  link.textContent = heading.title;
  if (heading.level === 3) link.classList.add("sub");
  toc.append(link);
  links.push(link);
}

function markCurrent(): void {
  let current = headings[0]?.id;
  for (const heading of headings) {
    const top = document.getElementById(heading.id)?.getBoundingClientRect().top;
    if (top !== undefined && top <= 100) current = heading.id;
  }
  for (const link of links) link.classList.toggle("current", link.getAttribute("href") === `#${current}`);
}

addEventListener("scroll", () => requestAnimationFrame(markCurrent), { passive: true });
markCurrent();
