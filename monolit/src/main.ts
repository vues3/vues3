import type { TView } from "app/src/stores/types";
import type { App } from "vue";

import { createHead } from "@unhead/vue";
import "@unocss/reset/tailwind-compat.css";
import initUnocssRuntime from "@unocss/runtime";
import { data, views } from "app/src/stores/data";
import { autoPrefix, bypassDefined } from "app/src/stores/defaults";
import defaults from "app/uno.config";
import "virtual:uno.css";
import { createApp } from "vue";

import vueApp from "./App.vue";
import { fix, ready, router } from "./stores/monolit";
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
// eslint-disable-next-line no-underscore-dangle
const rootElement = () => window.app._container as Element;
initUnocssRuntime({ autoPrefix, bypassDefined, defaults, ready, rootElement });
window.app.use(router);
window.app.use(createHead());
window.app.mount("#app");
const response: Response = await fetch("/index.json");
data.value = response.ok
  ? ((await response.json()) as TView[])
  : ([{}] as TView[]);
fix(data.value);
views.value.forEach(({ along, id: name, loc, parent, path: relative }) => {
  const alias = `/${loc?.replaceAll(" ", "_") ?? ""}`;
  const children = ((path, component) => [{ component, name, path }])(
    "",
    (parent?.along ?? along)
      ? () => import("@/views/MultiView.vue")
      : singleView,
  );
  ((path, component) => {
    router.addRoute({ path, ...(loc && { alias }), children, component });
  })(`/${relative}`, singleView);
});
router.beforeEach(({ path }) =>
  path !== decodeURI(path) ? decodeURI(path) : undefined,
);
const path = "/:pathMatch(.*)*";
const component = () => import("@/views/NotFoundView.vue");
const name = "404";
router.addRoute({ component, name, path });
router.replace(router.currentRoute.value.fullPath).catch(() => {});
