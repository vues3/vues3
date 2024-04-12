import "glightbox/dist/css/glightbox.css";
import "./style.sass";
import "@unocss/reset/tailwind.css";
import "daisyui/dist/full.css";
// eslint-disable-next-line import/no-unresolved
import "virtual:uno.css";

import * as mdi from "@mdi/js";
import Tres from "@tresjs/core";
import { createHead } from "@unhead/vue";
// eslint-disable-next-line import/no-unresolved
import { Head } from "@unhead/vue/components";
import initUnocssRuntime from "@unocss/runtime";
import { MotionPlugin } from "@vueuse/motion";
import { createPinia, storeToRefs } from "pinia";
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
import type { TData, TSettings } from "@/stores/data";
import Data from "@/stores/data";
import Monolit from "@/stores/monolit";
import defaults from "~/uno.config";

// eslint-disable-next-line no-console
console.info(
  "👨‍🚀",
  "The vues3 framework",
  `ver:${__APP_VERSION__}`,
  "https://vues3.ru",
);

/**
 * Enable css property auto prefixer
 *
 * @constant
 * @default
 * @type {boolean}
 */
const autoPrefix: boolean = true;

/**
 * When enabled, UnoCSS will look for the existing selectors defined in the
 * stylesheet and bypass them. This is useful when using the runtime alongwith
 * the build-time UnoCSS.
 *
 * @constant
 * @default
 * @type {boolean}
 */
const bypassDefined: boolean = true;

initUnocssRuntime({ autoPrefix, defaults, bypassDefined });

/**
 * Приложение vue
 *
 * @type {App}
 */
const app: App = createApp(vueApp);

app.config.globalProperties.mdi = mdi;
app.use(createPinia());

const { pages } = storeToRefs(Data());
const { $, validate } = Data();
const { fix } = Monolit();

/**
 * Настройка кеширования
 *
 * @constant
 * @default
 * @type {RequestCache}
 */
const cache: RequestCache = "no-cache";

(async () => {
  /**
   * Ответ на считывание data.json
   *
   * @constant
   * @default
   * @type {Response}
   */
  const response: Response = await fetch("/assets/data.json", {
    cache,
  });

  /**
   * Объект данных, полученный с сервера
   *
   * @constant
   * @default
   * @type {TData}
   */
  const data: TData = response.ok ? await response.json() : {};

  validate?.(data);
  Object.keys(data).forEach((key) => {
    $[key as keyof TData] = data[key as keyof {}];
  });
  fix($.content ?? []);
})();

/**
 * Перевод яндекс метрики в продуктовый режим
 *
 * @constant
 * @default
 * @type {string | null}
 */
const env: string | null = process.env.NODE_ENV ?? null;

/**
 * Запуск вотчера единожды
 *
 * @constant
 * @default
 * @type {boolean}
 */
const once: boolean = true;

/**
 * Объект истории
 *
 * @type {RouterHistory}
 */
const history: RouterHistory = createWebHistory(import.meta.env.BASE_URL);

/**
 * Роуты
 *
 * @type {RouteRecordRaw[]}
 */
const routes: RouteRecordRaw[] = [];

/**
 * Роутер
 *
 * @type {Router}
 */
const router: Router = createRouter({ history, routes });

watch(
  pages,
  (value) => {
    value.forEach(({ path, id: name, loc }) => {
      /**
       * Подготовленный алиас
       *
       * @constant
       * @default
       * @type {string}
       */
      const alias: string = `/${encodeURI(loc?.replace(" ", "_") ?? "")}`;

      router.addRoute({
        name,
        path: `/${path}`,
        ...(loc && { alias }),
        /**
         * Функция динамического импорта компонента
         *
         * @function component
         * @returns {RouteComponent} - Страница ошибки
         */
        component(): RouteComponent {
          return import(
            $.settings?.landing
              ? "@/views/MultiView.vue"
              : "@/views/SingleView.vue"
          );
        },
      });
    });

    /**
     * Все неучтенные пути
     *
     * @constant
     * @default
     * @type {string}
     */
    const path: string = "/:catchAll(.*)*";

    router.addRoute({
      path,
      /**
       * Функция динамического импорта компонента
       *
       * @function component
       * @returns {RouteComponent} - Страница ошибки
       */
      component(): RouteComponent {
        return import("@/views/NotFoundView.vue");
      },
    });
    router.replace(router.currentRoute.value.fullPath);
  },
  { once },
);
watch(
  () => $.settings as TSettings,
  ({ metrika, analytics }) => {
    if (metrika) {
      /**
       * Id метрики
       *
       * @constant
       * @default
       * @type {string}
       */
      const id: string = metrika;

      app.use(initYandexMetrika, { id, router, env } as Config);
    }
    if (analytics) {
      /**
       * Id аналитики
       *
       * @constant
       * @default
       * @type {string}
       */
      const id: string = analytics;

      /**
       * Подготовленный конфиг
       *
       * @constant
       * @default
       * @type {{ id: string }}
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
