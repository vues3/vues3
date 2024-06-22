import type { TData, TSettings } from "app/src/stores/types";
import type { App } from "vue";
import type {
  RouteComponent,
  RouteRecordRaw,
  Router,
  RouterHistory,
} from "vue-router";
import type { Config } from "yandex-metrika-vue3/src/types";

import { Icon } from "@iconify/vue";
import Tres from "@tresjs/core";
import { createHead } from "@unhead/vue";
import { Head } from "@unhead/vue/components";
import "@unocss/reset/tailwind.css";
import initUnocssRuntime from "@unocss/runtime";
import { MotionPlugin } from "@vueuse/motion";
import { $, views } from "app/src/stores/data";
import {
  autoPrefix,
  bypassDefined,
  cache,
  once,
} from "app/src/stores/defaults";
import defaults from "app/uno.config";
import "virtual:uno.css";
import { createApp, watch } from "vue";
import VueGtag from "vue-gtag";
import { createRouter, createWebHistory } from "vue-router";
import { initYandexMetrika } from "yandex-metrika-vue3";

import vueApp from "./App.vue";
import { fix } from "./stores/monolit";
import "./style.sass";

window.console.info(
  "👨‍🚀",
  "The vues3 framework",
  `ver:${__APP_VERSION__}`,
  "https://vues3.com",
);
initUnocssRuntime({ autoPrefix, bypassDefined, defaults });
const app: App = createApp(vueApp);
(async () => {
  const response: Response = await fetch("/data.json", {
    cache,
  });
  $.value = response.ok ? ((await response.json()) as TData) : ({} as TData);
  fix($.value.content);
})().catch(() => {});
const env: string = process.env.NODE_ENV;
const history: RouterHistory = createWebHistory(import.meta.env.BASE_URL);
const routes: RouteRecordRaw[] = [];
const router: Router = createRouter({ history, routes });
watch(
  views,
  (value) => {
    value.forEach(({ id: name, loc, path }) => {
      const alias = `/${encodeURI(loc?.replace(" ", "_") ?? "")}`;
      router.addRoute({
        name,
        path: `/${path}`,
        ...(loc && { alias }),
        component(): RouteComponent {
          return import(
            $.value?.settings?.landing
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
  },
  { once },
);
watch(
  () => $.value?.settings as TSettings,
  ({ analytics, metrika }) => {
    if (metrika) {
      const id: string = metrika;
      app.use(initYandexMetrika, { env, id, router } as Config);
    }
    if (analytics) {
      const id: string = analytics;
      const config: { id: string } = { id };
      app.use(VueGtag, { config }, router);
    }
  },
  { once },
);
app.use(router);
app.use(createHead());
app.use(Tres);
app.use(MotionPlugin);
// eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
app.component("Head", Head);
// eslint-disable-next-line vue/multi-word-component-names
app.component("Icon", Icon);
app.mount("#app");
