import type { TData, TResource, TView } from "app/src/stores/types";
import type { Ref } from "vue";

import { configurable, deep } from "app/src/stores/defaults";
import { validate } from "app/src/stores/types";
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
      .map(
        ({ id, text }) =>
          encodeURIComponent(text?.replace(" ", "_") ?? "") || id,
      )
      .slice(1)
      .join("/");
  },
};
const url = {
  get(this: TView) {
    return (
      (this.loc && encodeURI(this.loc.replace(" ", "_") || "")) ?? this.path
    );
  },
};
const name = {
  get(this: TView) {
    return this.title ?? this.text;
  },
};
const fixPlain = (siblings: { value: TResource[] }) => {
  siblings.value.forEach((element) => {
    Object.defineProperties(element, { index, next, prev, siblings });
  });
};
const fixDeep = (
  siblings: { configurable?: boolean; value: TView[] },
  parent: { configurable?: boolean; value?: TView } = { value: undefined },
) => {
  siblings.value.forEach((value) => {
    Object.defineProperties(value, {
      branch,
      index,
      name,
      next,
      parent,
      path,
      prev,
      siblings,
      url,
    });
    fixDeep(
      { configurable, value: value.children ?? [] },
      { configurable, value },
    );
  });
};
export const $: Ref<TData | undefined> = ref();
const get = () => getViews($.value?.content ?? []);
export const views = computed(() =>
  get().map((value: TView) => {
    Object.defineProperty(value, "views", { get });
    return value;
  }),
);
watch(
  () => $.value?.content,
  (value) => {
    if (value) {
      const [{ id }] = value;
      if (id) fixDeep({ value });
    }
  },
  { deep },
);
watch(
  () => $.value?.css,
  (value) => {
    if (value) fixPlain({ value });
  },
  { deep },
);
watch(
  () => $.value?.js,
  (value) => {
    if (value) fixPlain({ value });
  },
  { deep },
);
const value = undefined;
const flush = "sync";
watch(
  $,
  (obj) => {
    if (obj) {
      ["content", "css", "js"].forEach((prop) => {
        if (
          Object.hasOwn(obj, prop) &&
          !(obj[prop as keyof TData] as TResource[] | TView[]).length
        )
          Reflect.defineProperty(obj, prop, { value });
      });
      validate(obj);
    }
  },
  { deep, flush },
);
