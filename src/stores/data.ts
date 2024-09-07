import type { TPage } from "app/src/stores/types";
import type { Reactive } from "vue";

import { getIcon, iconExists, loadIcon } from "@iconify/vue";
import { configurable } from "app/src/stores/defaults";
import { validateData } from "app/src/stores/types";
import { computed, reactive, watch } from "vue";

const getPages = (pages: TPage[]): TPage[] =>
  pages.flatMap((element) => [element, ...getPages(element.children ?? [])]);
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
      .map(({ name }) => name?.replaceAll(" ", "_") ?? "-")
      .join("/");
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
export const data: Reactive<TPage[]> = reactive([]);
const root = {
  get() {
    return data[0];
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
const get = () => getPages(data);
export const pages = computed(() =>
  get().map((value: TPage) => {
    Reflect.defineProperty(value, "pages", { get });
    return value;
  }),
);
export const fetchIcon = async (name: null | string | undefined) => {
  if (name) {
    const icon = iconExists(name) ? getIcon(name) : await loadIcon(name);
    if (icon) {
      const { body, height, left, top, width } = icon;
      return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left.toString()} ${top.toString()} ${width.toString()} ${height.toString()}">${body}</svg>`;
    }
    return icon;
  }
  return null;
};
export const getFonts = (fonts: string[]) =>
  Object.fromEntries(
    fonts.map((value) => [value.toLowerCase().replaceAll(" ", "_"), value]),
  );
watch(data, (value) => {
  validateData(value);
  fixDeep({ value });
});
