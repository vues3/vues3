import type { TResource, TView } from "app/src/stores/types";
import type { AsyncComponentLoader } from "vue";
import type { Options } from "vue3-sfc-loader";

import { useStyleTag } from "@vueuse/core";
import { $ } from "app/src/stores/data";
import { cache, once } from "app/src/stores/defaults";
import * as vue from "vue";
import { defineAsyncComponent, watch } from "vue";
import * as vueRouter from "vue-router";
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
