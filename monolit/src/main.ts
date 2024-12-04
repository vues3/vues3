import type { Preset } from "@unocss/core";
import type { RuntimeOptions } from "@unocss/runtime";
import type { TImportmap, TPage } from "@vues3/types";
import type { Component } from "vue";
import type { RouteRecordRaw } from "vue-router";

import { createHead } from "@unhead/vue";
import presetWebFonts from "@unocss/preset-web-fonts";
import "@unocss/reset/tailwind-compat.css";
import initUnocssRuntime from "@unocss/runtime";
import { customFetch, data, getFonts, importmap, pages } from "@vues3/shared";
import { validateImportmap } from "@vues3/types";
import defaults from "app/uno.config";
import { computed, createApp, nextTick, readonly } from "vue";

import vueApp from "./App.vue";
import { router, setScroll } from "./stores/monolit";
import "./style.sass";

window.console.info(
  "⛵",
  "vueS3",
  `ver:${__APP_VERSION__}`,
  "https://vues3.com",
);
window.app = createApp(vueApp as Component);
window.app.use(createHead());
const id = computed(() => router.currentRoute.value.name);
window.app.provide("id", readonly(id));
const initRouter = (async () => {
  const [{ imports }, [page]] = await Promise.all(
    ["index.importmap", "index.json"].map(async (value, index) => {
      const response = await fetch(value);
      return (
        response.ok ? response : new Response(index ? "[{}]" : "{}")
      ).json();
    }) as unknown as [TImportmap, TPage[]],
  );
  importmap.imports = imports;
  validateImportmap(importmap);
  data.push(page);
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
    const component = () => import("./views/SingleView.vue");
    pages.value.forEach(({ along, id: name, loc, parent, path: relative }) => {
      const alias = (loc?.replaceAll(" ", "_") ?? "")
        .replace(/^\/?/, "/")
        .replace(/\/?$/, "/");
      const children = getChildren(
        (parent?.along ?? along)
          ? () => import("./views/MultiView.vue")
          : component,
        name,
        "",
      );
      const path = relative.replace(/^\/?/, "/").replace(/\/?$/, "/");
      router.addRoute({ path, ...(loc && { alias }), children, component });
    });
  }
  const path = "/:pathMatch(.*)*";
  const component = () => import("./views/NotFoundView.vue");
  const name = "404";
  router.addRoute({ component, name, path });
})();
const rootElement = () => document.getElementById("app") as Element;
const ready: RuntimeOptions["ready"] = async (runtime) => {
  const { toggleObserver } = runtime;
  setScroll(runtime);
  await initRouter;
  window.app.use(router);
  window.app.mount(rootElement());
  toggleObserver(true);
  return false;
};
(async () => {
  const response = await fetch("fonts.json");
  const fonts = getFonts(
    (await (response.ok ? response : new Response("[]")).json()) as string[],
  );
  defaults.presets.push(
    presetWebFonts({
      customFetch,
      fonts,
    }) as Preset,
  );
  await initUnocssRuntime({ defaults, ready, rootElement });
})().catch(() => {});
