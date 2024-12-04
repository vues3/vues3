import type { RuntimeContext } from "@unocss/runtime";
import type { TPage } from "@vues3/types";
import type { AsyncComponentLoader } from "vue";
import type { AbstractPath, ContentData, File, Options } from "vue3-sfc-loader";
import type {
  Router,
  RouteRecordRaw,
  RouterHistory,
  RouterScrollBehavior,
} from "vue-router";

import { importmap, pages } from "@vues3/shared";
import { useStyleTag } from "@vueuse/core";
import uuid from "uuid-random";
import * as vue from "vue";
import { loadModule } from "vue3-sfc-loader";
import { createRouter, createWebHistory } from "vue-router";

export const behavior = "smooth";
export const threshold = 0.1;
const top = 0;
const left = 0;
const { computed, defineAsyncComponent, ref } = vue;
export const promises = new Map();
const promiseWithResolvers = <T>() => {
  let resolve: PromiseWithResolvers<T>["resolve"] | undefined;
  let reject: PromiseWithResolvers<T>["reject"] | undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
};
const moduleCache = { vue };
const handleModule = async (
  type: string,
  getContentData: File["getContentData"],
  path: AbstractPath,
  options: Options,
) => {
  switch (type) {
    case ".css":
      options.addStyle(
        (await getContentData(false)) as string,
        path.toString(),
      );
      return null;
    // case "css": {
    //   const { default: css } = (await getContentData(false)) as unknown as {
    //     default: CSSStyleSheet;
    //   };
    //   document.adoptedStyleSheets = [...document.adoptedStyleSheets, css];
    //   return null;
    // }
    case "js":
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
const addStyle = (styles: string, id?: string) => {
  useStyleTag(styles, { id });
};
export const getAsyncComponent = ({ id }: TPage) => {
  const abstractPath = `${id ?? uuid()}.vue`;
  promises.set(id, promiseWithResolvers());
  const getFile = async (filePath: string) => {
    const { imports } = importmap;
    switch (true) {
      case filePath === abstractPath:
        return (await fetch(`./pages/${filePath}`)).text();
      case Object.keys(imports).some((value) => filePath.startsWith(value)): {
        // const fileName = filePath.split("/").pop();
        // const ext = fileName?.split(".").pop();
        // let type = ext === fileName ? "" : ext;
        const getContentData: File["getContentData"] = () => {
          return import(
            filePath
            // type === "css" ? { with: { type } } : undefined
          ) as Promise<ContentData>;
        };
        // type = type === "css" ? type : "js";
        const type = "js";
        return { getContentData, type };
      }
      default: {
        const fileName = filePath.split("/").pop();
        return (
          await fetch(
            fileName === fileName?.split(".").pop()
              ? `${filePath}.js`
              : filePath,
          )
        ).text();
      }
    }
  };
  return defineAsyncComponent((async () => {
    return loadModule(abstractPath, {
      addStyle,
      getFile,
      handleModule,
      log,
      moduleCache,
    } as unknown as Options);
  }) as AsyncComponentLoader<Promise<object>>);
};
const { pathname } = new URL(document.baseURI);
const history: RouterHistory = createWebHistory(pathname);
const routes: RouteRecordRaw[] = [];
export const scroll = ref(true);
let onScroll: RouterScrollBehavior | undefined;
const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) =>
  onScroll && onScroll(to, from, savedPosition);
export const router: Router = createRouter({ history, routes, scrollBehavior });
router.beforeEach(({ path }) =>
  path !== decodeURI(path) ? decodeURI(path) : undefined,
);
export const a = computed(() =>
  pages.value.find(({ id }) => id === router.currentRoute.value.name),
);
export const that = computed(() =>
  router.currentRoute.value.path === "/" ? a.value?.$children?.[0] : a.value,
);
const siblings = computed(() => that.value?.siblings ?? []);
export const $siblings = computed(() =>
  siblings.value.filter(({ enabled }) => enabled),
);
export const paused = ref(true);
export const setScroll: (runtime: RuntimeContext) => void = ({
  extractAll,
  toggleObserver,
}) => {
  const all = async () => {
    paused.value = true;
    toggleObserver(false);
    {
      const [{ promise }] = promises.values();
      await promise;
    }
    await Promise.all(
      [...promises.values()].map(
        ({ promise }) => promise as Promise<undefined>,
      ),
    );
    await extractAll();
    toggleObserver(true);
    paused.value = false;
  };
  onScroll = async ({ name }) => {
    return new Promise((resolve) => {
      if (name) {
        all().then(
          () => {
            const el = `#${String(name)}`;
            resolve(
              scroll.value && {
                behavior,
                ...(that.value?.parent?.along && that.value.index
                  ? { el }
                  : { left, top }),
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
};
export const resolve = ({ id }: TPage | undefined = {} as TPage) => {
  (promises.get(id) as PromiseWithResolvers<undefined> | undefined)?.resolve(
    undefined,
  );
};
