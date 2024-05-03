import * as mdi from "@mdi/js";
import type { FuncKeywordDefinition, ValidateFunction } from "ajv";
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
import type { ComputedRef, Ref } from "vue";
import { computed, ref, watch } from "vue";

export type TView = FromSchema<typeof plainView> & {
  children: TView[];
  parent?: TView;
  siblings: TView[];
  branch: TView[];
  prev?: TView;
  next?: TView;
  views: TView[];
  html: Promise<string> | string;
  htm: string;
  js: string;
  css: string;
  path: string;
  index: number;
  name: string;
  url: string;
  favicon: keyof typeof mdi;
  style: Promise<string> | string;
  script: Promise<string> | string;
  template: Promise<string> | string;
};
export type TResource = FromSchema<typeof Resource> & {
  parent?: undefined;
  children?: undefined;
  siblings: TView[];
  prev?: TView;
  next?: TView;
  index: number;
};
export type TSettings = FromSchema<typeof Settings>;
export type TNavbar = FromSchema<typeof Navbar>;
export type TData = FromSchema<
  typeof plainData,
  { references: [typeof Settings, typeof Resource, typeof Navbar] }
> & { content: TView[] };
dynamicDefaults.DEFAULTS.uuid = (): (() => string) => () => uid();
const schemas: object[] = [Resource, View, Settings, Navbar, Data];
export const code: object = { esm };
const keywords: FuncKeywordDefinition[] = [dynamicDefaults()];
const ajv: Ajv = new Ajv({
  useDefaults,
  coerceTypes,
  removeAdditional,
  schemas,
  code,
  keywords,
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
        ({ label, id }) =>
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
  get(this: TView): string | null {
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
    Object.defineProperties(element, { siblings, index, prev, next });
  });
};
const fixDeep = (
  siblings: { value: TView[]; configurable?: boolean },
  parent: { value?: TView; configurable?: boolean } = { value: undefined },
) => {
  siblings.value.forEach((value) => {
    Object.defineProperties(value, {
      parent,
      siblings,
      branch,
      path,
      index,
      prev,
      next,
      name,
      url,
      favicon,
    });
    fixDeep({ value: value.children, configurable }, { value, configurable });
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
  () => <TResource[]>($.value?.css ?? []),
  (value: TResource[]) => {
    fixPlain({ value });
  },
  { deep },
);
watch(
  () => <TResource[]>($.value?.js ?? []),
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
        if (!(<TView[] | TResource[]>newValue[<keyof TData>key]).length)
          Reflect.defineProperty(newValue, key, { value });
      });
      validate(newValue);
    }
  },
  { deep },
);
