import * as tresjsCientos from "@tresjs/cientos";
import * as tresjsCore from "@tresjs/core";
import * as vueuseComponents from "@vueuse/components";
import * as vueuseCore from "@vueuse/core";
import { useStyleTag } from "@vueuse/core";
import * as vueuseMath from "@vueuse/math";
import type { AsyncComponentLoader } from "vue";
import * as vue from "vue";
import { defineAsyncComponent } from "vue";
import * as vueRouter from "vue-router";
import type { ContentData, ModuleExport, Options } from "vue3-sfc-loader";
import { loadModule } from "vue3-sfc-loader";

import type { TPage } from "@/stores/data";

/**
 * Настройка кеширования
 *
 * @constant
 * @default
 * @type {RequestCache}
 */
export const cache: RequestCache = "no-cache";

/**
 * Модули, передаваемые шаблону
 *
 * @constant
 * @default
 * @type {ModuleExport}
 */
export const moduleCache: ModuleExport = {
  vue,
  "vue-router": vueRouter,
  "@vueuse/core": vueuseCore,
  "@vueuse/math": vueuseMath,
  "@vueuse/components": vueuseComponents,
  "@tresjs/core": tresjsCore,
  "@tresjs/cientos": tresjsCientos,
};

/**
 * Процедура логирования ошибок
 *
 * @function log
 * @param {string} type - Тип записи
 * @param {any[]} args - Содержимое записи
 */
export const log = (type: string, ...args: any[]) => {
  (window.console[type as keyof Console] as Function)(...args);
};

/**
 * Функция, возвращающая Promise на сконструированный шаблон
 *
 * @function getAsyncComponent
 * @param {TPage} page - Объект страницы
 * @param {string} page.path - Путь до страницы
 * @param {boolean} page.setup - Тип скриптов
 * @param {boolean} page.scoped - Тип стилей
 * @param {string} page.htm - Шаблон страницы
 * @param {string} page.js - Скрипты страницы
 * @param {string} page.css - Стили страницы
 * @returns {Promise<object>} Шаблон
 */
export const getAsyncComponent = ({
  path,
  setup,
  scoped,
  htm,
  js,
  css,
}: TPage): Promise<object> => {
  /**
   * Функция получения файла шаблона
   *
   * @async
   * @function getFile
   * @returns {Promise<ContentData>} Шаблон
   */
  const getFile = async (): Promise<ContentData> => {
    const [template, script, style] = await Promise.all([htm, js, css]);

    /**
     * Константа со скриптами
     *
     * @constant
     * @default
     * @type {string}
     */
    const cntScript: string =
      script && `<script${setup ? " setup" : ""}>${script}</script>`;

    /**
     * Константа с шаблоном
     *
     * @constant
     * @default
     * @type {string}
     */
    const cntTemplate: string = template && `<template>${template}</template>`;

    /**
     * Константа со стилями
     *
     * @constant
     * @default
     * @type {string}
     */
    const cntStyle: string =
      style && `<style${scoped ? " scoped" : ""}>${style}</style>`;

    return `${cntScript}${cntTemplate}${cntStyle}`;
  };

  /**
   * Процедура добавления стилей
   *
   * @function addStyle
   * @param {string} styles - Стили
   */
  const addStyle = (styles: string) => {
    useStyleTag(styles);
  };

  return defineAsyncComponent((() =>
    loadModule(`${["", "~"].includes(path) ? "" : "/"}${path}/view.vue`, {
      moduleCache,
      getFile,
      addStyle,
      log,
    } as unknown as Options)) as AsyncComponentLoader);
};

/**
 * Запрос на сервер за контентом
 *
 * @async
 * @function getFile
 * @param {TPage} that - Текущий объект страницы
 * @param {string} key - Название свойства для хранения считанного файла
 * @param {string} ext - Расширение файла
 * @returns {Promise<string>} Содержимое файла
 */
export const getFile = async (
  that: TPage,
  key: string,
  ext: string,
): Promise<string> => {
  if (that[key as keyof TPage] == null) {
    /**
     * Ответ сервера
     *
     * @constant
     * @default
     * @type {Response}
     */
    const response: Response = await fetch(`/assets/${that.id}.${ext}`, {
      cache,
    });

    /**
     * Текстовые данные, полученные с сервера
     *
     * @constant
     * @default
     * @type {string}
     */
    const value: string = response.ok ? await response.text() : "";

    Object.defineProperty(that, key, { value });
  }
  return that[key as keyof TPage] as string;
};

/**
 * Объект, на котором определяется загрузка шаблона страницы
 *
 * @type {PropertyDescriptor}
 */
export const htm: PropertyDescriptor = {
  /**
   * Геттер шаблона страницы
   *
   * @async
   * @function get
   * @returns {Promise<string>} - Шаблон страницы
   */
  async get(): Promise<string> {
    return getFile(this as TPage, "template", "htm");
  },
};

/**
 * Объект, на котором определяется загрузка стилей страницы
 *
 * @type {PropertyDescriptor}
 */
export const css: PropertyDescriptor = {
  /**
   * Геттер стилей страницы
   *
   * @async
   * @function get
   * @returns {Promise<string>} - Стили страницы
   */
  async get(): Promise<string> {
    return getFile(this as TPage, "style", "css");
  },
};

/**
 * Объект, на котором определяется загрузка скриптов страницы
 *
 * @type {PropertyDescriptor}
 */
export const js: PropertyDescriptor = {
  /**
   * Геттер скриптов страницы
   *
   * @async
   * @function get
   * @returns {Promise<string>} - Скрипты страницы
   */
  async get(): Promise<string> {
    return getFile(this as TPage, "script", "js");
  },
};

/**
 * Рекурсивная функция ремонта страниц
 *
 * @function fix
 * @param {TPage[]} siblings - Элементы массива страниц
 */
export const fix = (siblings: TPage[]) => {
  siblings.forEach((value) => {
    Object.defineProperties(value, {
      htm,
      css,
      js,
    });

    fix(value.children ?? []);
  });
};
