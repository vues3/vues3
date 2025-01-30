import type { Component } from "vue";

import HomePage from "pages/HomePage.vue";

/* -------------------------------------------------------------------------- */

const component = HomePage as Component,
  name = "Home",
  path = "/:pathMatch(.*)*";

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export default [{ component, name, path }];
