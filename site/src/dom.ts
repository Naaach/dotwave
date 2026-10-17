/**
 * Scoped `querySelector` for the site: the markup comes from a template in
 * index.html, so a typo should fail loudly at mount time instead of silently
 * producing a half-wired page.
 */
export function mustQuery<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`dotwave site: nothing matches ${selector}`);
  return element;
}
