import type { TData } from "app/src/stores/types";
import type { App } from "vue";

import { createHead } from "@unhead/vue";
import "@unocss/reset/tailwind-compat.css";
import { data, views } from "app/src/stores/data";
import { createApp } from "vue";

import vueApp from "./App.vue";
import { fix, router } from "./stores/monolit";
import "./style.sass";
import singleView from "./views/SingleView.vue";

declare const window: {
  app: App;
} & typeof globalThis &
  Window;

window.console.info(
  "👨‍🚀",
  "The Vue.S3",
  `ver:${__APP_VERSION__}`,
  "https://vues3.com",
);
window.app = createApp(vueApp);
window.app.use(router);
window.app.use(createHead());
window.app.mount("#app");
const response: Response = await fetch("/data.json");
data.value = response.ok ? ((await response.json()) as TData) : ({} as TData);
fix(data.value.content);
views.value.forEach(({ along, id: name, loc, path: relative }) => {
  const alias = `/${encodeURI(loc?.replaceAll(" ", "_") ?? "")}`;
  const children = ((path, component) => [{ component, name, path }])(
    "",
    along ? () => import("@/views/MultiView.vue") : singleView,
  );
  ((path, component) => {
    router.addRoute({ path, ...(loc && { alias }), children, component });
  })(`/${relative}`, singleView);
});
const path = "/:pathMatch(.*)*";
const component = () => import("@/views/NotFoundView.vue");
router.addRoute({ component, path });
router.replace(router.currentRoute.value.fullPath).catch(() => {});
