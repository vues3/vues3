import { route } from "quasar/wrappers";
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from "vue-router";

import routes from "./routes";

export default route(() => {
  let createHistory;
  if (process.env.SERVER) createHistory = createMemoryHistory;
  else if (process.env.VUE_ROUTER_MODE === "history")
    createHistory = createWebHistory;
  else createHistory = createWebHashHistory;
  return createRouter({
    history: createHistory(process.env.VUE_ROUTER_BASE),
    routes,
  });
});
