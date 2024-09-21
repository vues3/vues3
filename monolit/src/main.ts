import type { Preset } from "@unocss/core";
import type { TPage } from "app/src/stores/types";
import type { RouteRecordRaw } from "vue-router";

import { createHead } from "@unhead/vue";
import presetWebFonts from "@unocss/preset-web-fonts";
import "@unocss/reset/tailwind-compat.css";
import initUnocssRuntime from "@unocss/runtime";
import { data, getFonts, pages } from "app/src/stores/data";
import { customFetch } from "app/src/stores/defaults";
import defaults from "app/uno.config";
import { computed, createApp, nextTick, readonly } from "vue";

import vueApp from "./App.vue";
import { fix, ready, router } from "./stores/monolit";
import "./style.sass";

(async () => {
  const response = await fetch("/fonts.json");
  const fonts = getFonts(
    response.ok ? ((await response.json()) as string[]) : [],
  );
  defaults.presets.push(
    presetWebFonts({
      customFetch,
      fonts,
    }) as Preset,
  );
  const rootElement = () => document.getElementById("app") as Element;
  initUnocssRuntime({ defaults, ready, rootElement });
})().catch(() => {});
window.console.info(
  "⛵",
  "vueS3",
  `ver:${__APP_VERSION__}`,
  "https://vues3.com",
);
const response = await fetch("/index.json");
data.push(
  response.ok ? ((await response.json()) as TPage[])[0] : ({} as TPage),
);
fix(data);
window.app = createApp(vueApp);
window.app.use(createHead());
await nextTick();
window.app.provide(
  "pages",
  readonly(Object.fromEntries(pages.value.map((value) => [value.id, value]))),
);
{
  const getChildren = (
    component: RouteRecordRaw["component"],
    name: RouteRecordRaw["name"],
    path: RouteRecordRaw["path"],
  ) => [{ component, name, path }] as RouteRecordRaw[];
  const component = () => import("@/views/SingleView.vue");
  pages.value.forEach(({ along, id: name, loc, parent, path: relative }) => {
    const alias = (loc?.replaceAll(" ", "_") ?? "")
      .replace(/^\/?/, "/")
      .replace(/\/?$/, "/");
    const children = getChildren(
      (parent?.along ?? along)
        ? () => import("@/views/MultiView.vue")
        : component,
      name,
      "",
    );
    const path = relative.replace(/^\/?/, "/").replace(/\/?$/, "/");
    router.addRoute({ path, ...(loc && { alias }), children, component });
  });
}
const path = "/:pathMatch(.*)*";
const component = () => import("@/views/NotFoundView.vue");
const name = "404";
router.addRoute({ component, name, path });
const id = computed(() => router.currentRoute.value.name);
window.app.provide("id", readonly(id));
window.app.use(router);
window.app.mount("#app");
