import "glightbox/dist/css/glightbox.css";
import "./style.css";
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
import { createApp, watch } from "vue";
import VueGtag from "vue-gtag";
import { initYandexMetrika } from "yandex-metrika-vue3";

import App from "@/App.vue";
import router from "@/router";
import Data, { TData, TSettings } from "@/stores/data";
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
const autoPrefix = true;

/**
 * When enabled, UnoCSS will look for the existing selectors defined in the
 * stylesheet and bypass them. This is useful when using the runtime alongwith
 * the build-time UnoCSS.
 *
 * @type {boolean}
 */
const bypassDefined = true;

initUnocssRuntime({ autoPrefix, defaults, bypassDefined });
const app = createApp(App);
app.config.globalProperties.mdi = mdi;
app.use(createPinia());

/** @type {{ pages: {} }} */
const { pages } = storeToRefs(Data());

/** @type {{ $: {}; validate: Function }} */
const { $, validate } = Data();

const { fix } = Monolit();

const cache = "no-cache";
(async () => {
  const response = await fetch("/assets/data.json", {
    cache,
  });
  const data = response.ok ? await response.json() : {};
  validate?.(data);
  Object.keys(data).forEach((key) => {
    $[key as keyof TData] = data[key as keyof {}];
  });
  fix($.content);
})();

/**
 * Перевод яндекс метрики в продуктовый режим
 *
 * @type {string}
 */
const env = process.env.NODE_ENV;

/**
 * Запуск вотчера единожды
 *
 * @type {boolean}
 */
const once = true;

watch(
  pages,
  (value) => {
    (() => {
      /**
       * Функция динамического импорта компонента
       *
       * @type {Function}
       * @returns {object} - Страница ошибки
       */
      const component = () =>
        import(
          $?.settings?.landing
            ? "@/views/MultiView.vue"
            : "@/views/SingleView.vue"
        );
      value?.forEach(
        ({
          path: _path = "",
          _: path = `/${_path}`,
          id: name = "",
          loc = "",
        }: any) => {
          /**
           * Подготовленный алиас
           *
           * @type {string}
           */
          const alias = `/${encodeURI(loc?.replace(" ", "_") ?? "")}`;

          router.addRoute({ name, path, ...(loc && { alias }), component });
        },
      );
    })();

    /**
     * Все неучтенные пути
     *
     * @type {string}
     */
    const path = "/:catchAll(.*)*";

    /**
     * Функция динамического импорта компонента
     *
     * @type {Function}
     * @returns {object} - Страница ошибки
     */
    const component = () => import("@/views/NotFoundView.vue");

    router.addRoute({ path, component });
    router.replace(router.currentRoute.value.fullPath);
  },
  { once },
);
watch(
  () => <TSettings>$?.settings,
  ({ metrika, analytics }: TSettings) => {
    if (metrika) {
      /**
       * Id метрики
       *
       * @type {string}
       */
      const id: string = metrika;

      app.use(initYandexMetrika, <any>{ id, router, env });
    }
    if (analytics) {
      /**
       * Id аналитики
       *
       * @type {string}
       */
      const id = analytics;

      /**
       * Подготовленный конфиг
       *
       * @type {{ string }}
       */
      const config = { id };

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
