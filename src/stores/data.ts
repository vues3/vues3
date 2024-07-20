import type { TData, TView } from "app/src/stores/types";
import type { Ref } from "vue";

import { configurable, deep, flush } from "app/src/stores/defaults";
import { validateData } from "app/src/stores/types";
import { computed, ref, watch } from "vue";

const getViews = (views: TView[]): TView[] =>
  views.flatMap((element) => [element, ...getViews(element.children ?? [])]);
const index = {
  get(this: TView) {
    return this.siblings.findIndex(({ id }) => this.id === id);
  },
};
const prev = {
  get(this: TView) {
    return this.siblings[this.index - 1];
  },
};
const next = {
  get(this: TView) {
    return this.siblings[this.index + 1];
  },
};
const branch = {
  get(this: TView) {
    const ret = [this];
    while (ret[0].parent) ret.unshift(ret[0].parent);
    return ret;
  },
};
const path = {
  get(this: TView) {
    return this.branch
      .slice(1)
      .map(
        ({ id, name }) =>
          encodeURIComponent(name?.replace(" ", "_") ?? "") || id,
      )
      .join("/");
  },
};
const to = {
  get(this: TView) {
    const ret =
      (this.loc && encodeURI(this.loc.replace(" ", "_") || "")) ?? this.path;
    return ret && `/${ret}`;
  },
};
const title = {
  get(this: TView) {
    return this.header ?? this.name;
  },
};
const fixDeep = (
  siblings: { configurable?: boolean; value: TView[] },
  parent: { configurable?: boolean; value?: TView } = { value: undefined },
) => {
  siblings.value.forEach((value) => {
    Object.defineProperties(value, {
      branch,
      index,
      next,
      parent,
      path,
      prev,
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
export const data: Ref<TData | undefined> = ref();
const get = () => getViews(data.value?.content ?? []);
export const views = computed(() =>
  get().map((value: TView) => {
    Reflect.defineProperty(value, "views", { get });
    return value;
  }),
);
watch(
  () => data.value?.content,
  (value) => {
    if (value) fixDeep({ value });
  },
  { deep, flush },
);
const value = undefined;
watch(
  data,
  (obj) => {
    if (obj) {
      if (
        Object.hasOwn(obj, "content") &&
        !(obj["content" as keyof TData] as TView[]).length
      )
        Reflect.defineProperty(obj, "content", { value });
      validateData(obj);
    }
  },
  { deep, flush },
);
