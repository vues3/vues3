import "@unocss/reset/tailwind.css";
import "daisyui/dist/full.css";
import "glightbox/dist/css/glightbox.css";
import "virtual:uno.css";
import "./style.sass";

import * as mdi from "@mdi/js";
import Tres from "@tresjs/core";
import { createHead } from "@unhead/vue";
import { Head } from "@unhead/vue/components";
import initUnocssRuntime from "@unocss/runtime";
import { MotionPlugin } from "@vueuse/motion";
import type { TData, TSettings } from "app/src/stores/data";
import { $, views } from "app/src/stores/data";
import {
  autoPrefix,
  bypassDefined,
  cache,
  once,
} from "app/src/stores/defaults";
import defaults from "app/uno.config";
import type { App } from "vue";
import { createApp, watch } from "vue";
import VueGtag from "vue-gtag";
import type {
  RouteComponent,
  Router,
  RouteRecordRaw,
  RouterHistory,
} from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import { initYandexMetrika } from "yandex-metrika-vue3";
import type { Config } from "yandex-metrika-vue3/src/types";

import vueApp from "@/App.vue";

import { fix } from "./stores/monolit";

window.console.info(
  "👨‍🚀",
  "The vues3 framework",
  `ver:${__APP_VERSION__}`,
  "https://vues3.ru",
);
initUnocssRuntime({ autoPrefix, defaults, bypassDefined });
/** Приложение vue */
const app: App = createApp(vueApp);
app.config.globalProperties.mdi = mdi;
(async () => {
  /**
   * Ответ на считывание data.json
   *
   * @default
   */
  const response: Response = await fetch("/data.json", {
    cache,
  });
  $.value = response.ok ? <TData>await response.json() : <TData>{};
  fix($.value.content);
})().catch(() => {});
/**
 * Перевод яндекс метрики в продуктовый режим
 *
 * @default
 */
const env: string = process.env.NODE_ENV;
/** Объект истории */
const history: RouterHistory = createWebHistory(import.meta.env.BASE_URL);
/** Роуты */
const routes: RouteRecordRaw[] = [];
/** Роутер */
const router: Router = createRouter({ history, routes });
watch(
  views,
  (value) => {
    value.forEach(({ path, id: name, loc }) => {
      /**
       * Подготовленный алиас
       *
       * @default
       */
      const alias: string = `/${encodeURI(loc?.replace(" ", "_") ?? "")}`;
      router.addRoute({
        name,
        path: `/${path}`,
        ...(loc && { alias }),
        /**
         * Функция динамического импорта компонента
         *
         * @returns - Страница ошибки
         */
        component(): RouteComponent {
          return import(
            $.value?.settings?.landing
              ? "@/views/MultiView.vue"
              : "@/views/SingleView.vue"
          );
        },
      });
    });
    /**
     * Все неучтенные пути
     *
     * @default
     */
    const path: string = "/:catchAll(.*)*";
    router.addRoute({
      path,
      /**
       * Функция динамического импорта компонента
       *
       * @returns - Страница ошибки
       */
      component(): RouteComponent {
        return import("@/views/NotFoundView.vue");
      },
    });
    router.replace(router.currentRoute.value.fullPath).catch(() => {});
  },
  { once },
);
watch(
  () => <TSettings>$.value?.settings,
  ({ metrika, analytics }) => {
    if (metrika) {
      /**
       * Id метрики
       *
       * @default
       */
      const id: string = metrika;
      app.use(initYandexMetrika, <Config>{ id, router, env });
    }
    if (analytics) {
      /**
       * Id аналитики
       *
       * @default
       */
      const id: string = analytics;
      /**
       * Подготовленный конфиг
       *
       * @default
       */
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
app.component("VHead", Head);
app.mount("#app");
