import type { TView } from "app/src/stores/types";
import type { AsyncComponentLoader } from "vue";
import type { Options } from "vue3-sfc-loader";

import * as tresjsCientos from "@tresjs/cientos";
import * as tresjsCore from "@tresjs/core";
import * as vueuseComponents from "@vueuse/components";
import * as vueuseCore from "@vueuse/core";
import { useStyleTag } from "@vueuse/core";
import { cache } from "app/src/stores/defaults";
import uuid from "uuid-random";
import * as vue from "vue";
import { defineAsyncComponent } from "vue";
import * as vueRouter from "vue-router";
import { loadModule } from "vue3-sfc-loader";

import selectors from "../assets/glightbox.json";

const moduleCache = {
  "@tresjs/cientos": tresjsCientos,
  "@tresjs/core": tresjsCore,
  "@vueuse/components": vueuseComponents,
  "@vueuse/core": vueuseCore,
  vue,
  "vue-router": vueRouter,
};
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
  return defineAsyncComponent((() =>
    loadModule(`${["", "~"].includes(path) ? "" : "/"}${path}/view.vue`, {
      addStyle,
      getFile,
      log,
      moduleCache,
    } as unknown as Options)) as AsyncComponentLoader<Promise<object>>);
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
    fix(value.children);
  });
};
export const selector = selectors.map((el) => `a[href${el}]`).join();
export const favicon = uuid();
