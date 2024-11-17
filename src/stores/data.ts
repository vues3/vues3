import type { TImportmap, TPage } from "app/src/stores/types";
import type { Reactive } from "vue";

import { configurable } from "app/src/stores/defaults";
import { validateData } from "app/src/stores/types";
import { computed, reactive, watch } from "vue";

export const importmap = reactive({} as TImportmap);
export const data: Reactive<TPage[]> = reactive([]);
{
  const root = {
    get() {
      return data[0];
    },
  };
  const index = {
    get(this: TPage) {
      return this.siblings.findIndex(({ id }) => this.id === id);
    },
  };
  const prev = {
    get(this: TPage) {
      return this.siblings[this.index - 1];
    },
  };
  const next = {
    get(this: TPage) {
      return this.siblings[this.index + 1];
    },
  };
  const $children = {
    get(this: TPage) {
      return this.children?.filter(({ enabled }) => enabled);
    },
  };
  const $siblings = {
    get(this: TPage) {
      return this.siblings.filter(({ enabled }) => enabled);
    },
  };
  const $index = {
    get(this: TPage) {
      return this.$siblings.findIndex(({ id }) => this.id === id);
    },
  };
  const $prev = {
    get(this: TPage) {
      return this.$siblings[this.$index - 1];
    },
  };
  const $next = {
    get(this: TPage) {
      return this.$siblings[this.$index + 1];
    },
  };
  const branch = {
    get(this: TPage) {
      const ret = [this];
      while (ret[0].parent) ret.unshift(ret[0].parent);
      return ret;
    },
  };
  const path = {
    get(this: TPage) {
      return this.branch
        .slice(1)
        .map(({ name }) => name ?? "-")
        .join("/")
        .replaceAll(" ", "_");
    },
  };
  const to = {
    get(this: TPage) {
      return (this.loc?.replaceAll(" ", "_") ?? this.path)
        .replace(/^\/?/, "/")
        .replace(/\/?$/, "/");
    },
  };
  const i = {
    get(this: TPage) {
      return this.icon && `i-${this.icon}`;
    },
  };
  const title = {
    get(this: TPage) {
      return this.header ?? this.name;
    },
  };
  const fixDeep = (
    siblings: { configurable?: boolean; value: TPage[] },
    parent: { configurable?: boolean; value?: TPage } = { value: undefined },
  ) => {
    siblings.value.forEach((value) => {
      Object.defineProperties(value, {
        $children,
        $index,
        $next,
        $prev,
        $siblings,
        branch,
        i,
        index,
        next,
        parent,
        path,
        prev,
        root,
        siblings,
        title,
        to,
      });
      fixDeep(
        { configurable, value: value.children ?? [] },
        { configurable, value },
      );
    });
  };
  watch(data, (value) => {
    validateData(value);
    fixDeep({ value });
  });
}
const getPages = (pages: TPage[]): TPage[] =>
  pages.flatMap((element) => [element, ...getPages(element.children ?? [])]);
export const pages = computed(() => getPages(data));
export const getFonts = (fonts: string[]) =>
  Object.fromEntries(
    fonts.map((value) => [value.toLowerCase().replaceAll(" ", "_"), value]),
  );
