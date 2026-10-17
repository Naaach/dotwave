import type { View } from "../view";

/** Served for any path the route table does not know: still a live SPA. */
export const notFoundView: View = {
  name: "not-found",
  title: "dotwave — page not found",
  description: "That page is not part of the wave.",

  mount() {
    // Static markup, nothing to wire.
  },
};
