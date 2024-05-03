import type { TView } from "app/src/stores/data";
import type { AsyncComponentLoader } from "vue";
import type { ContentData, ModuleExport, Options } from "vue3-sfc-loader";

import * as tresjsCientos from "@tresjs/cientos";
import * as tresjsCore from "@tresjs/core";
import * as vueuseComponents from "@vueuse/components";
import * as vueuseCore from "@vueuse/core";
import { useStyleTag } from "@vueuse/core";
import { cache } from "app/src/stores/defaults";
import { uid } from "quasar";
import * as vue from "vue";
import { defineAsyncComponent } from "vue";
import * as vueRouter from "vue-router";
import { loadModule } from "vue3-sfc-loader";

import selectors from "../assets/glightbox.json";

const moduleCache: ModuleExport = {
  "@tresjs/cientos": tresjsCientos,
  "@tresjs/core": tresjsCore,
  "@vueuse/components": vueuseComponents,
  "@vueuse/core": vueuseCore,
  vue,
  "vue-router": vueRouter,
};
const log = (type: keyof Console, ...args: string[]) => {
  (<(...optionalParams: string[]) => void>window.console[type])(...args);
};
export const getAsyncComponent = ({
  path,
  scoped,
  script,
  setup,
  style,
  template,
}: TView): Promise<object> => {
  const getFile = async (): Promise<ContentData> => {
    const [htm, js, css] = await Promise.all([template, script, style]);
    const cntScript: string =
      js && `<script${setup ? " setup" : ""}>${js}</script>`;
    const cntTemplate: string = htm && `<template>${htm}</template>`;
    const cntStyle: string =
      css && `<style${scoped ? " scoped" : ""}>${css}</style>`;
    return `${cntScript}${cntTemplate}${cntStyle}`;
  };
  const addStyle = (styles: string) => {
    useStyleTag(styles);
  };
  return defineAsyncComponent(<AsyncComponentLoader<Promise<object>>>(() =>
    loadModule(`${["", "~"].includes(path) ? "" : "/"}${path}/view.vue`, <
      Options
    >(<unknown>{
      addStyle,
      getFile,
      log,
      moduleCache,
    }))));
};
async function getResource(this: TView, ext: keyof TView): Promise<string> {
  if (this[ext] == null) {
    const response: Response = await fetch(`/views/${this.id ?? ""}.${ext}`, {
      cache,
    });
    const value: string = response.ok ? await response.text() : "";
    Object.defineProperty(this, ext, { value });
  }
  return <string>this[ext];
}
const template: PropertyDescriptor = {
  async get(this: TView): Promise<string> {
    return getResource.call(this, "htm");
  },
};
const style: PropertyDescriptor = {
  async get(this: TView): Promise<string> {
    return getResource.call(this, "css");
  },
};
const script: PropertyDescriptor = {
  async get(this: TView): Promise<string> {
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
    fix(value.children);
  });
};
export const selector: string = selectors.map((el) => `a[href${el}]`).join();
export const favicon: string = uid();
