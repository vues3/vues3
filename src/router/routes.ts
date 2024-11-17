import type { Component } from "vue";

import HomePage from "pages/HomePage.vue";

const name = "Home";
const path = "/:pathMatch(.*)*";
const component = HomePage as Component;
export default [{ component, name, path }];
