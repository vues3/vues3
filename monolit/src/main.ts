import type { TData } from "app/src/stores/types";
import type { App } from "vue";
import type { RouteComponent } from "vue-router";
import type { Config } from "yandex-metrika-vue3/src/types";

import { Icon } from "@iconify/vue";
import { createHead } from "@unhead/vue";
import { Head } from "@unhead/vue/components";
import "@unocss/reset/tailwind.css";
import initUnocssRuntime from "@unocss/runtime";
import { MotionPlugin } from "@vueuse/motion";
import { data, views } from "app/src/stores/data";
import { autoPrefix, bypassDefined } from "app/src/stores/defaults";
import defaults from "app/uno.config";
import "virtual:uno.css";
import { createApp } from "vue";
import VueGtag from "vue-gtag";
import { initYandexMetrika } from "yandex-metrika-vue3";

import vueApp from "./App.vue";
import { fix, router } from "./stores/monolit";
import "./style.sass";

declare const window: {
  app: App;
} & Window &
  typeof globalThis;

window.console.info(
  "👨‍🚀",
  "The vues3 framework",
  `ver:${__APP_VERSION__}`,
  "https://vues3.com",
);
const env: string = process.env.NODE_ENV;
initUnocssRuntime({ autoPrefix, bypassDefined, defaults });
window.app = createApp(vueApp);
window.app.use(router);
window.app.use(createHead());
window.app.use(MotionPlugin);
// eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
window.app.component("Head", Head);
// eslint-disable-next-line vue/multi-word-component-names
window.app.component("Icon", Icon);
window.app.mount("#app");
const response: Response = await fetch("/data.json");
data.value = response.ok ? ((await response.json()) as TData) : ({} as TData);
fix(data.value.content);
const { analytics, metrika } = data.value.settings ?? {};
if (metrika) {
  const id: string = metrika;
  window.app.use(initYandexMetrika, { env, id, router } as Config);
}
if (analytics) {
  const id: string = analytics;
  const config: { id: string } = { id };
  window.app.use(VueGtag, { config }, router);
}
views.value.forEach(({ id: name, loc, path }) => {
  const alias = `/${encodeURI(loc?.replace(" ", "_") ?? "")}`;
  router.addRoute({
    name,
    path: `/${path}`,
    ...(loc && { alias }),
    component(): RouteComponent {
      return import(
        data.value?.settings?.landing
          ? "@/views/MultiView.vue"
          : "@/views/SingleView.vue"
      );
    },
  });
});
const path = "/:catchAll(.*)*";
router.addRoute({
  component(): RouteComponent {
    return import("@/views/NotFoundView.vue");
  },
  path,
});
router.replace(router.currentRoute.value.fullPath).catch(() => {});
