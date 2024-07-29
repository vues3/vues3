import type { TData } from "app/src/stores/types";
import type { App } from "vue";
import type { Config } from "yandex-metrika-vue3/src/types";

import { Icon } from "@iconify/vue";
import Tres from "@tresjs/core";
import { createHead } from "@unhead/vue";
import { Head } from "@unhead/vue/components";
import "@unocss/reset/tailwind-compat.css";
import initUnocssRuntime from "@unocss/runtime";
import { MotionPlugin } from "@vueuse/motion";
import { data, views } from "app/src/stores/data";
import defaults from "app/uno.config";
import { createApp } from "vue";
import VueGtag from "vue-gtag";
import { initYandexMetrika } from "yandex-metrika-vue3";

import vueApp from "./App.vue";
import { fix, router } from "./stores/monolit";
import "./style.sass";

declare const window: {
  app: App;
} & typeof globalThis &
  Window;

window.console.info(
  "👨‍🚀",
  "The vues3 framework",
  `ver:${__APP_VERSION__}`,
  "https://vues3.com",
);
const env: string = process.env.NODE_ENV;
initUnocssRuntime({ defaults });
window.app = createApp(vueApp);
window.app.use(router);
window.app.use(createHead());
window.app.use(Tres);
window.app.use(MotionPlugin);
window.app.component("Head", Head);
window.app.component("Icon", Icon);
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
    () =>
      import(
        data.value?.settings.landing
          ? "@/views/MultiView.vue"
          : "@/views/SingleView.vue"
      ),
  );
  ((path, component) => {
    router.addRoute({ path, ...(loc && { alias }), children, component });
  })(`/${relative}`, () => import("@/views/SingleView.vue"));
});
const path = "/:pathMatch(.*)*";
const component = () => import("@/views/NotFoundView.vue");
router.addRoute({ component, path });
router.replace(router.currentRoute.value.fullPath).catch(() => {});
