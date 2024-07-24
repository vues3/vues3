import type { TComponent, TView } from "app/src/stores/types";
import type { AsyncComponentLoader } from "vue";
import type {
  Router,
  RouteRecordRaw,
  RouterHistory,
  RouterScrollBehavior,
} from "vue-router";
import type { AbstractPath, ContentData, File, Options } from "vue3-sfc-loader";

import * as vueuseCore from "@vueuse/core";
import { useStyleTag } from "@vueuse/core";
import { data, views } from "app/src/stores/data";
import { behavior, cache, left, top } from "app/src/stores/defaults";
import { validateComponent } from "app/src/stores/types";
import * as vue from "vue";
import { computed, defineAsyncComponent, markRaw } from "vue";
import * as vueRouter from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import { loadModule } from "vue3-sfc-loader";

const moduleCache = {
  "@vueuse/core": vueuseCore,
  vue,
  "vue-router": vueRouter,
};
const getResource: Options["getResource"] = (pathCx, options) => {
  const { getPathname, pathResolve } = options;
  const path = pathResolve(pathCx, options);
  const id = path.toString();
  const getContent = async () => {
    if (URL.canParse(id)) {
      const getContentData: File["getContentData"] = () =>
        import(id) as Promise<ContentData>;
      return { getContentData } as File;
    }
    const res = await options.getFile(path);
    if (typeof res === "string" || res instanceof ArrayBuffer) {
      const getContentData = () => Promise.resolve(res);
      const ext = getPathname(id).split(".").pop() ?? "";
      const type = ext && `.${ext}`;
      return { getContentData, type };
    }
    return res;
  };
  return { getContent, id, path };
};
const handleModule = (
  type: string,
  getContentData: File["getContentData"],
  path: AbstractPath,
) => {
  if (URL.canParse(path.toString())) return getContentData(false);
  return undefined;
};
const log = (type: keyof Console, ...args: string[]) => {
  (window.console[type] as (...optionalParams: string[]) => void)(...args);
};
const addStyle = (styles: string) => {
  useStyleTag(styles);
};
export const getAsyncComponent = ({ path, scoped, setup, sfc }: TView) => {
  const getFile = async () => {
    const { script, style, template } = await sfc;
    const cntScript =
      script && `<script${setup ? " setup" : ""}>${script}</script>`;
    const cntTemplate = template && `<template>${template}</template>`;
    const cntStyle =
      style && `<style${scoped ? " scoped" : ""}>${style}</style>`;
    return `${cntScript}${cntTemplate}${cntStyle}`;
  };
  return defineAsyncComponent((async () => {
    return loadModule(
      `${data.value?.content[0].name ?? ""}${path && "/"}${path}.vue`,
      {
        addStyle,
        getFile,
        getResource,
        handleModule,
        log,
        moduleCache,
      } as unknown as Options,
    );
  }) as AsyncComponentLoader<Promise<object>>);
};
const sfc = {
  async get(this: TView) {
    if (!this.buffer) {
      const response = await fetch(`/views/${this.id ?? ""}.json`, {
        cache,
      });
      const value = markRaw(
        JSON.parse(response.ok ? await response.text() : "{}"),
      ) as TComponent;
      validateComponent(value);
      Reflect.defineProperty(this, "buffer", { value });
    }
    return this.buffer;
  },
};
const history: RouterHistory = createWebHistory(import.meta.env.BASE_URL);
const routes: RouteRecordRaw[] = [];
let onScroll: RouterScrollBehavior | undefined;
const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) => {
  if (onScroll) return onScroll(to, from, savedPosition);
  return false;
};
export const router: Router = createRouter({ history, routes, scrollBehavior });
export const a = computed(() =>
  views.value.find(({ id }) => id === router.currentRoute.value.name),
);
const view = {
  get() {
    return a.value;
  },
};
export const fix = (siblings: TView[]) => {
  siblings.forEach((value) => {
    Object.defineProperties(value, { sfc, view });
    if (value.children) fix(value.children);
  });
};
export const that = computed(() =>
  router.currentRoute.value.path === "/" ? a.value?.children?.[0] : a.value,
);
export const siblings = computed(() => that.value?.siblings ?? []);
const promiseWithResolvers = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
};
export const promises = computed(
  () =>
    Object.fromEntries(
      siblings.value
        .filter(({ enabled }) => enabled)
        .map(({ id }) => [id, promiseWithResolvers()]),
    ) as Record<string, PromiseWithResolvers<undefined>>,
);
export const all = () =>
  Promise.all(Object.values(promises.value).map(({ promise }) => promise));
onScroll = async (to, from, savedPosition) => {
  if (data.value?.settings.landing) {
    await all();
    if (savedPosition) return { behavior, ...savedPosition };
    const el = `#${String(to.name)}`;
    if (to.name && that.value?.index) return { behavior, el };
    return { behavior, left, top };
  }
  return false;
};
