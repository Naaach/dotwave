/**
 * Contract for a route's view. The router clones the `<template id="view-NAME">`
 * from index.html into `#view` before calling `mount()`.
 */
export interface View {
  /** Route name: picks the template and the value of `body[data-view]`. */
  name: string;
  /** `<title>` while this view is mounted. */
  title: string;
  /** Meta description while this view is mounted. */
  description: string;
  /**
   * Wires the cloned markup up. Return a cleanup function: the router calls it
   * before the next view mounts, so nothing leaks between routes.
   */
  mount(root: HTMLElement): (() => void) | void;
}
