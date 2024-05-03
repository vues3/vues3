import * as tresjsCientos from "@tresjs/cientos";
import * as tresjsCore from "@tresjs/core";
import * as vueuseComponents from "@vueuse/components";
import * as vueuseCore from "@vueuse/core";
import { useStyleTag } from "@vueuse/core";
import type { TView } from "app/src/stores/data";
import { cache } from "app/src/stores/defaults";
import { uid } from "quasar";
import type { AsyncComponentLoader } from "vue";
import * as vue from "vue";
import { defineAsyncComponent } from "vue";
import * as vueRouter from "vue-router";
import type { ContentData, ModuleExport, Options } from "vue3-sfc-loader";
import { loadModule } from "vue3-sfc-loader";

import selectors from "../assets/glightbox.json";
/**
 * Модули, передаваемые шаблону
 *
 * @default
 */
const moduleCache: ModuleExport = {
  vue,
  "vue-router": vueRouter,
  "@vueuse/core": vueuseCore,
  "@vueuse/components": vueuseComponents,
  "@tresjs/core": tresjsCore,
  "@tresjs/cientos": tresjsCientos,
};
/**
 * Процедура логирования ошибок
 *
 * @param type - Тип записи
 * @param args - Содержимое записи
 */
const log = (type: keyof Console, ...args: string[]) => {
  (<(...optionalParams: string[]) => void>window.console[type])(...args);
};
/**
 * Функция, возвращающая Promise на сконструированный шаблон
 *
 * @param view - Объект страницы
 * @param view.path - Путь до страницы
 * @param view.setup - Тип скриптов
 * @param view.scoped - Тип стилей
 * @param view.template - Шаблон страницы
 * @param view.script - Скрипты страницы
 * @param view.style - Стили страницы
 * @returns Шаблон
 */
export const getAsyncComponent = ({
  path,
  setup,
  scoped,
  template,
  script,
  style,
}: TView): Promise<object> => {
  /**
   * Функция получения файла шаблона
   *
   * @async
   * @returns Шаблон
   */
  const getFile = async (): Promise<ContentData> => {
    const [htm, js, css] = await Promise.all([template, script, style]);
    /** Константа со скриптами */
    const cntScript: string =
      js && `<script${setup ? " setup" : ""}>${js}</script>`;
    /** Константа с шаблоном */
    const cntTemplate: string = htm && `<template>${htm}</template>`;
    /** Константа со стилями */
    const cntStyle: string =
      css && `<style${scoped ? " scoped" : ""}>${css}</style>`;
    return `${cntScript}${cntTemplate}${cntStyle}`;
  };

  /**
   * Процедура добавления стилей
   *
   * @param styles - Стили
   */
  const addStyle = (styles: string) => {
    useStyleTag(styles);
  };
  return defineAsyncComponent(<AsyncComponentLoader<Promise<object>>>(() =>
    loadModule(`${["", "~"].includes(path) ? "" : "/"}${path}/view.vue`, <
      Options
    >(<unknown>{
      moduleCache,
      getFile,
      addStyle,
      log,
    }))));
};
/**
 * Запрос на сервер за контентом
 *
 * @async
 * @param ext - Расширение файла
 * @returns Содержимое файла
 */
async function getResource(this: TView, ext: keyof TView): Promise<string> {
  if (this[ext] == null) {
    /** Ответ сервера */
    const response: Response = await fetch(`/views/${this.id ?? ""}.${ext}`, {
      cache,
    });
    /** Текстовые данные, полученные с сервера */
    const value: string = response.ok ? await response.text() : "";
    Object.defineProperty(this, ext, { value });
  }
  return <string>this[ext];
}
/** Объект, на котором определяется загрузка шаблона страницы */
const template: PropertyDescriptor = {
  /**
   * Геттер шаблона страницы
   *
   * @async
   * @returns - Шаблон страницы
   */
  async get(this: TView): Promise<string> {
    return getResource.call(this, "htm");
  },
};
/** Объект, на котором определяется загрузка стилей страницы */
const style: PropertyDescriptor = {
  /**
   * Геттер стилей страницы
   *
   * @async
   * @returns - Стили страницы
   */
  async get(this: TView): Promise<string> {
    return getResource.call(this, "css");
  },
};
/** Объект, на котором определяется загрузка скриптов страницы */
const script: PropertyDescriptor = {
  /**
   * Геттер скриптов страницы
   *
   * @async
   * @returns - Скрипты страницы
   */
  async get(this: TView): Promise<string> {
    return getResource.call(this, "js");
  },
};
/**
 * Рекурсивная функция ремонта страниц
 *
 * @param siblings - Элементы массива страниц
 */
export const fix = (siblings: TView[]) => {
  siblings.forEach((value) => {
    Object.defineProperties(value, {
      template,
      style,
      script,
    });
    fix(value.children);
  });
};
/**
 * Name of the selector for example '.glightbox' or 'data-glightbox' or
 * '*[data-glightbox]'
 *
 * @default
 * @see {@link https://github.com/biati-digital/glightbox} см. документацию
 */
export const selector: string = selectors.map((el) => `a[href${el}]`).join();
/**
 * Уникальный ключ для favicon. Иначе иконка динамически не обновляется в chrome
 * при смене страницы
 */
export const favicon: string = uid();
