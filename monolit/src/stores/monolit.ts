import type { RuntimeContext, RuntimeOptions } from "@unocss/runtime";
import type { TComponent, TView } from "app/src/stores/types";
import type { App, AsyncComponentLoader } from "vue";
import type {
  Router,
  RouteRecordRaw,
  RouterHistory,
  RouterScrollBehavior,
} from "vue-router";
import type { AbstractPath, ContentData, File, Options } from "vue3-sfc-loader";

import initUnocssRuntime from "@unocss/runtime";
import { useStyleTag } from "@vueuse/core";
import { data, views } from "app/src/stores/data";
import {
  autoPrefix,
  behavior,
  bypassDefined,
  cache,
  left,
  top,
} from "app/src/stores/defaults";
import { validateComponent } from "app/src/stores/types";
import defaults from "app/uno.config";
import * as vue from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { loadModule } from "vue3-sfc-loader";

declare const window: {
  app: App;
} & typeof globalThis &
  Window;

const { computed, defineAsyncComponent, markRaw, ref } = vue;
const moduleCache = { vue };
const getResource: Options["getResource"] = (pathCx, options) => {
  const { refPath } = pathCx;
  const { getPathname, pathResolve } = options;
  const path = pathResolve(pathCx, options);
  const id = path.toString();
  const ext = getPathname(id).split(".").pop() ?? "";
  const type = ext && `.${ext}`;
  const getContent = async () => {
    if (
      refPath &&
      !(id.startsWith("./") || (id.startsWith("/") && !id.startsWith("//")))
    ) {
      if (type === ".css") return { type } as File;
      const getContentData: File["getContentData"] = () =>
        import(id) as Promise<ContentData>;
      return { getContentData } as File;
    }
    const res = await options.getFile(path);
    if (typeof res === "string" || res instanceof ArrayBuffer) {
      const getContentData = () => Promise.resolve(res);
      return { getContentData, type };
    }
    return res;
  };
  return { getContent, id, path };
};
const handleModule = async (
  type: string,
  getContentData: File["getContentData"],
  path: AbstractPath,
  options: Options,
) => {
  switch (type) {
    case ".css":
      options.addStyle(await (await fetch(path as string)).text(), undefined);
      return null;
    case undefined:
      return getContentData(false);
    default:
      return undefined;
  }
};
const log = (type: keyof Console, ...args: string[]) => {
  (window.console[type] as (...optionalParams: string[]) => void)(
    ...args.map((value) => decodeURIComponent(value)),
  );
};
const addStyle = (styles: string, id: string | undefined) => {
  useStyleTag(styles, { id });
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
      `${data.value?.[0].name ?? ""}${path && "/"}${path}.vue`,
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
      const response = await fetch(`/pages/${this.id ?? ""}.json`, {
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
export const scroll = ref(true);
let onScroll: RouterScrollBehavior | undefined;
const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) =>
  onScroll && onScroll(to, from, savedPosition);
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
const siblings = computed(() => that.value?.siblings ?? []);
export const pages = computed(() =>
  siblings.value.filter(({ enabled }) => enabled),
);
const promiseWithResolvers = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
};
const along = computed(() => !that.value || that.value.parent?.along);
const promises = computed(
  () =>
    Object.fromEntries(
      (along.value ? pages.value : ([that.value] as TView[])).map(({ id }) => [
        id,
        promiseWithResolvers(),
      ]),
    ) as Record<string, PromiseWithResolvers<undefined>>,
);
let extractAll: RuntimeContext["extractAll"] | undefined;
const ready: RuntimeOptions["ready"] = (runtime) => {
  extractAll = runtime.extractAll;
};
const init = ref(true);
export const enabled = ref(false);
const all = async () => {
  enabled.value = false;
  await Promise.all(
    Object.values(promises.value).map(({ promise }) => promise),
  );
  if (init.value)
    initUnocssRuntime({ autoPrefix, bypassDefined, defaults, ready });
  if (extractAll) await extractAll();
  if (init.value) {
    const node = document.querySelector("body>#container");
    node?.parentNode?.removeChild(node);
    // eslint-disable-next-line no-underscore-dangle
    (window.app._container as HTMLElement).classList.remove("hidden");
    init.value = false;
  }
  enabled.value = true;
};
onScroll = async ({ name }, from, savedPosition) => {
  return new Promise((resolve) => {
    if (name) {
      all().then(
        () => {
          const el = `#${String(name)}`;
          resolve(
            that.value?.parent?.along &&
              scroll.value && {
                behavior,
                ...(savedPosition ??
                  (that.value.index ? { el } : { left, top })),
              },
          );
          scroll.value = true;
        },
        () => {
          resolve(false);
        },
      );
    } else resolve(false);
  });
};
export const resolve = ({ id }: TView) => {
  const promise = promises.value[id as keyof object] as
    | PromiseWithResolvers<undefined>
    | undefined;
  promise?.resolve(undefined);
};
