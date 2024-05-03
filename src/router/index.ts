import { route } from "quasar/wrappers";
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from "vue-router";

import routes from "./routes";

export default route((/* { store, ssrContext } */) => {
  let createHistory;
  if (process.env.SERVER) createHistory = createMemoryHistory;
  else if (process.env.VUE_ROUTER_MODE === "history")
    createHistory = createWebHistory;
  else createHistory = createWebHashHistory;
  return createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });
});
