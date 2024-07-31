import type { TData } from "app/src/stores/types";
import type { App } from "vue";
import type { Config } from "yandex-metrika-vue3/src/types";

import { createHead } from "@unhead/vue";
import "@unocss/reset/tailwind-compat.css";
import { data, views } from "app/src/stores/data";
import { createApp } from "vue";
import VueGtag from "vue-gtag";
import { initYandexMetrika } from "yandex-metrika-vue3";

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
const env: string = process.env.NODE_ENV;
window.app = createApp(vueApp);
window.app.use(router);
window.app.use(createHead());
window.app.mount("#app");
const response: Response = await fetch("/data.json");
data.value = response.ok ? ((await response.json()) as TData) : ({} as TData);
fix(data.value.content);
const { analytics, metrika } = data.value.settings;
if (metrika) {
  const id: string = metrika;
  window.app.use(initYandexMetrika, { env, id, router } as Config);
}
if (analytics) {
  const id: string = analytics;
  const config: { id: string } = { id };
  window.app.use(VueGtag, { config }, router);
}
views.value.forEach(({ id: name, loc, path: relative }) => {
  const alias = `/${encodeURI(loc?.replace(" ", "_") ?? "")}`;
  const children = ((path, component) => [{ component, name, path }])(
    "",
    data.value?.settings.landing
      ? () => import("@/views/MultiView.vue")
      : singleView,
  );
  ((path, component) => {
    router.addRoute({ path, ...(loc && { alias }), children, component });
  })(`/${relative}`, singleView);
});
const path = "/:pathMatch(.*)*";
const component = () => import("@/views/NotFoundView.vue");
router.addRoute({ component, path });
router.replace(router.currentRoute.value.fullPath).catch(() => {});
