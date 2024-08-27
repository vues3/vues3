import type { TPage } from "app/src/stores/types";
import type { App } from "vue";

import { createHead } from "@unhead/vue";
import "@unocss/reset/tailwind-compat.css";
import initUnocssRuntime from "@unocss/runtime";
import { data, pages } from "app/src/stores/data";
import defaults from "app/uno.config";
import { createApp } from "vue";

import vueApp from "./App.vue";
import { fix, ready, router } from "./stores/monolit";
import "./style.sass";

const rootElement = () => document.getElementById("app") as Element;
initUnocssRuntime({ defaults, ready, rootElement });

declare const window: {
  app: App;
} & typeof globalThis &
  Window;

window.console.info(
  "👨‍🚀",
  "The VueS3",
  `ver:${__APP_VERSION__}`,
  "https://vues3.com",
);
window.app = createApp(vueApp);
window.app.use(router);
window.app.use(createHead());
window.app.mount("#app");
const response: Response = await fetch("/index.json");
data.value = response.ok
  ? ((await response.json()) as TPage[])
  : ([{}] as TPage[]);
fix(data.value);
pages.value.forEach(({ along, id: name, loc, parent, path: relative }) => {
  const alias = (loc?.replaceAll(" ", "_") ?? "")
    .replace(/^\/?/, "/")
    .replace(/\/?$/, "/");
  const children = ((path, component) => [{ component, name, path }])(
    "",
    (parent?.along ?? along)
      ? () => import("@/views/MultiView.vue")
      : () => import("@/views/SingleView.vue"),
  );
  ((path, component) => {
    router.addRoute({ path, ...(loc && { alias }), children, component });
  })(
    relative.replace(/^\/?/, "/").replace(/\/?$/, "/"),
    () => import("@/views/SingleView.vue"),
  );
});
router.beforeEach(({ path }) =>
  path !== decodeURI(path) ? decodeURI(path) : undefined,
);
const path = "/:pathMatch(.*)*";
const component = () => import("@/views/NotFoundView.vue");
const name = "404";
router.addRoute({ component, name, path });
router.replace(router.currentRoute.value.fullPath).catch(() => {});
