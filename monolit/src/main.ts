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
import type { RouteComponent } from "vue-router";
import { initYandexMetrika } from "yandex-metrika-vue3";
import type { Config } from "yandex-metrika-vue3/src/types";

import vueApp from "@/App.vue";
import router from "@/router";
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
 * @type {boolean}
 */
const autoPrefix: boolean = true;

/**
 * When enabled, UnoCSS will look for the existing selectors defined in the
 * stylesheet and bypass them. This is useful when using the runtime alongwith
 * the build-time UnoCSS.
 *
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
 * @type {RequestCache}
 */
const cache: RequestCache = "no-cache";

(async () => {
  /**
   * Ответ на считывание data.json
   *
   * @type {Response}
   */
  const response: Response = await fetch("/assets/data.json", {
    cache,
  });

  /**
   * Объект данных, полученный с сервера
   *
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
 * @type {string | null}
 */
const env: string | null = process.env.NODE_ENV ?? null;

/**
 * Запуск вотчера единожды
 *
 * @type {boolean}
 */
const once: boolean = true;

watch(
  pages,
  (value) => {
    (() => {
      /**
       * Функция динамического импорта компонента
       *
       * @function component
       * @returns {RouteComponent} - Страница ошибки
       */
      const component = (): RouteComponent =>
        import(
          $.settings?.landing
            ? "@/views/MultiView.vue"
            : "@/views/SingleView.vue"
        );
      value.forEach(({ path, id: name, loc }) => {
        /**
         * Подготовленный алиас
         *
         * @type {string}
         */
        const alias: string = `/${encodeURI(loc?.replace(" ", "_") ?? "")}`;

        router.addRoute({
          name,
          path: `/${path}`,
          ...(loc && { alias }),
          component,
        });
      });
    })();

    /**
     * Все неучтенные пути
     *
     * @type {string}
     */
    const path: string = "/:catchAll(.*)*";

    /**
     * Функция динамического импорта компонента
     *
     * @function component
     * @returns {RouteComponent} - Страница ошибки
     */
    const component = (): RouteComponent => import("@/views/NotFoundView.vue");

    router.addRoute({ path, component });
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
       * @type {string}
       */
      const id: string = metrika;

      app.use(initYandexMetrika, { id, router, env } as Config);
    }
    if (analytics) {
      /**
       * Id аналитики
       *
       * @type {string}
       */
      const id: string = analytics;

      /**
       * Подготовленный конфиг
       *
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
