import type { TResource, TView } from "app/src/stores/types";
import type { AsyncComponentLoader } from "vue";
import type {
  RouteRecordRaw,
  Router,
  RouterHistory,
  RouterScrollBehavior,
} from "vue-router";
import type { Options } from "vue3-sfc-loader";

import { useStyleTag } from "@vueuse/core";
import { $, views } from "app/src/stores/data";
import { behavior, cache, left, once, top } from "app/src/stores/defaults";
import * as vue from "vue";
import { computed, defineAsyncComponent, watch } from "vue";
import * as vueRouter from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import { loadModule } from "vue3-sfc-loader";

const moduleCachePromise = new Promise((resolve) => {
  watch(
    () => $.value?.js as TResource[],
    async (js) => {
      resolve(
        Object.fromEntries(
          new Map<string, object>([
            ["vue", vue] as readonly [string, object],
            ["vue-router", vueRouter] as readonly [string, object],
            ...(
              (await Promise.allSettled(
                js
                  .filter(({ enabled, name }) => !!(enabled && name))
                  .map(({ name }) => [
                    name,
                    `https://cdn.jsdelivr.net/npm/${name}/+esm`,
                  ])
                  .map(
                    async ([name, url]) =>
                      [name, await import(url)] as [string, object],
                  ),
              )) as PromiseFulfilledResult<[string, object]>[]
            )
              .map(({ value }) => value)
              .filter(Boolean),
          ]),
        ),
      );
    },
    { once },
  );
});
const log = (type: keyof Console, ...args: string[]) => {
  (window.console[type] as (...optionalParams: string[]) => void)(...args);
};
export const getAsyncComponent = ({
  path,
  scoped,
  script,
  setup,
  style,
  template,
}: TView) => {
  const getFile = async () => {
    const [htm, js, css] = await Promise.all([template, script, style]);
    const cntScript = js && `<script${setup ? " setup" : ""}>${js}</script>`;
    const cntTemplate = htm && `<template>${htm}</template>`;
    const cntStyle = css && `<style${scoped ? " scoped" : ""}>${css}</style>`;
    return `${cntScript}${cntTemplate}${cntStyle}`;
  };
  const addStyle = (styles: string) => {
    useStyleTag(styles);
  };
  return defineAsyncComponent((async () => {
    const moduleCache = await moduleCachePromise;
    return loadModule(`${path && "/"}${path}/view.vue`, {
      addStyle,
      getFile,
      log,
      moduleCache,
    } as unknown as Options);
  }) as AsyncComponentLoader<Promise<object>>);
};
async function getResource(this: TView, ext: keyof TView) {
  if (this[ext] == null) {
    const response = await fetch(`/views/${this.id ?? ""}.${ext}`, {
      cache,
    });
    const value = response.ok ? await response.text() : "";
    Object.defineProperty(this, ext, { value });
  }
  return this[ext] as string;
}
const template = {
  async get(this: TView) {
    return getResource.call(this, "htm");
  },
};
const style = {
  async get(this: TView) {
    return getResource.call(this, "css");
  },
};
const script = {
  async get(this: TView) {
    return getResource.call(this, "js");
  },
};
export const fix = (siblings: TView[]) => {
  siblings.forEach((value) => {
    Object.defineProperties(value, {
      script,
      style,
      template,
    });
    if (value.children) fix(value.children);
  });
};
const history: RouterHistory = createWebHistory(import.meta.env.BASE_URL);
const routes: RouteRecordRaw[] = [];
let onScroll: RouterScrollBehavior | undefined;
const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) => {
  if (onScroll) return onScroll(to, from, savedPosition);
  return false;
};
export const router: Router = createRouter({ history, routes, scrollBehavior });
export const the = computed(() =>
  views.value.find(({ id }) => id === router.currentRoute.value.name),
);
export const that = computed(() =>
  router.currentRoute.value.path === "/" ? the.value?.children?.[0] : the.value,
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
  if ($.value?.settings?.landing) {
    await all();
    if (savedPosition) return { behavior, ...savedPosition };
    const el = `#${String(to.name)}`;
    if (to.name) return { behavior, el };
    return { behavior, left, top };
  }
  return false;
};
