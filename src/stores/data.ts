import type { FuncKeywordDefinition, ValidateFunction } from "ajv";
import type { ComputedRef, Ref } from "vue";

import * as mdi from "@mdi/js";
import Ajv from "ajv";
import dynamicDefaults from "ajv-keywords/dist/definitions/dynamicDefaults";
import Data, { plainData } from "app/src/schemas/data";
import Navbar from "app/src/schemas/navbar";
import Resource from "app/src/schemas/resource";
import Settings from "app/src/schemas/settings";
import View, { plainView } from "app/src/schemas/view";
import {
  coerceTypes,
  configurable,
  deep,
  esm,
  removeAdditional,
  useDefaults,
} from "app/src/stores/defaults";
import { FromSchema } from "json-schema-to-ts";
import { uid } from "quasar";
import { computed, ref, watch } from "vue";

export type TView = {
  branch: TView[];
  children: TView[];
  css: string;
  favicon: keyof typeof mdi;
  htm: string;
  html: Promise<string> | string;
  index: number;
  js: string;
  name: string;
  next?: TView;
  parent?: TView;
  path: string;
  prev?: TView;
  script: Promise<string> | string;
  siblings: TView[];
  style: Promise<string> | string;
  template: Promise<string> | string;
  url: string;
  views: TView[];
} & FromSchema<typeof plainView>;
export type TResource = {
  children?: undefined;
  index: number;
  next?: TView;
  parent?: undefined;
  prev?: TView;
  siblings: TView[];
} & FromSchema<typeof Resource>;
export type TSettings = FromSchema<typeof Settings>;
export type TNavbar = FromSchema<typeof Navbar>;
export type TData = {
  content: TView[];
  css: TResource[];
  js: TResource[];
} & FromSchema<
  typeof plainData,
  { references: [typeof Settings, typeof Resource, typeof Navbar] }
>;
dynamicDefaults.DEFAULTS.uuid = (): (() => string) => () => uid();
const schemas: object[] = [Resource, View, Settings, Navbar, Data];
export const code: object = { esm };
const keywords: FuncKeywordDefinition[] = [dynamicDefaults()];
const ajv: Ajv = new Ajv({
  code,
  coerceTypes,
  keywords,
  removeAdditional,
  schemas,
  useDefaults,
});
export const validate: ValidateFunction = <ValidateFunction>(
  ajv.getSchema("urn:jsonschema:data")
);
export const validateNavbar: ValidateFunction = <ValidateFunction>(
  ajv.getSchema("urn:jsonschema:navbar")
);
const getViews = (views: TView[]): TView[] =>
  views.flatMap((element) => [element, ...getViews(element.children)]);
const index: PropertyDescriptor = {
  get(this: TView): number {
    return this.siblings.findIndex(({ id }) => this.id === id);
  },
};
const prev: PropertyDescriptor = {
  get(this: TView): TView | undefined {
    return this.siblings[this.index - 1];
  },
};
const next: PropertyDescriptor = {
  get(this: TView): TView | undefined {
    return this.siblings[this.index + 1];
  },
};
const branch: PropertyDescriptor = {
  get(this: TView): TView[] {
    const ret: TView[] = [this];
    while (ret[0].parent) ret.unshift(ret[0].parent);
    return ret;
  },
};
const path: PropertyDescriptor = {
  get(this: TView): string {
    return this.branch
      .map(
        ({ id, label }) =>
          encodeURIComponent(label?.replace(" ", "_") ?? "") || id,
      )
      .slice(1)
      .join("/");
  },
};
const url: PropertyDescriptor = {
  get(this: TView): string {
    return (
      (this.loc && encodeURI(this.loc.replace(" ", "_") || "")) || this.path
    );
  },
};
const name: PropertyDescriptor = {
  get(this: TView): null | string {
    return this.title ?? this.label;
  },
};
const favicon: PropertyDescriptor = {
  get(this: TView): string | undefined {
    return this.icon?.replace(/-./g, (x) => x[1].toUpperCase());
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
      favicon,
      index,
      name,
      next,
      parent,
      path,
      prev,
      siblings,
      url,
    });
    fixDeep({ configurable, value: value.children }, { configurable, value });
  });
};
export const $: Ref<TData | undefined> = ref();
const get: () => TView[] = (): TView[] => getViews($.value?.content ?? []);
export const views: ComputedRef<TView[]> = computed(() =>
  get().map((value: TView) => {
    Object.defineProperty(value, "views", { get });
    return value;
  }),
);
watch(
  () => $.value?.content ?? [],
  (value) => {
    fixDeep({ value });
  },
  { deep },
);
watch(
  () => $.value?.css ?? [],
  (value: TResource[]) => {
    fixPlain({ value });
  },
  { deep },
);
watch(
  () => $.value?.js ?? [],
  (value: TResource[]) => {
    fixPlain({ value });
  },
  { deep },
);
const value: undefined = undefined;
watch(
  $,
  (newValue) => {
    if (newValue) {
      ["content", "css", "js"].forEach((key) => {
        if (!(<TResource[] | TView[]>newValue[<keyof TData>key]).length)
          Reflect.defineProperty(newValue, key, { value });
      });
      validate(newValue);
    }
  },
  { deep },
);
