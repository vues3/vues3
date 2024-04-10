import * as tresjsCientos from "@tresjs/cientos";
import * as tresjsCore from "@tresjs/core";
import * as vueuseComponents from "@vueuse/components";
import * as vueuseCore from "@vueuse/core";
import * as vueuseMath from "@vueuse/math";
import { defineStore } from "pinia";
import * as vue from "vue";
import { AsyncComponentLoader } from "vue";
import * as vueRouter from "vue-router";
import {
  ContentData,
  loadModule,
  ModuleExport,
  Options,
} from "vue3-sfc-loader";

import { TPage } from "@/stores/data";

export default defineStore("monolit", () => {
  const { defineAsyncComponent } = vue;
  const { useStyleTag } = vueuseCore;

  /**
   * Настройка кеширования
   *
   * @type {RequestCache}
   */
  const cache: RequestCache = "no-cache";

  /**
   * Модули, передаваемые шаблону
   *
   * @type {ModuleExport}
   */
  const moduleCache: ModuleExport = {
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
   * @type {Function}
   * @param {string} type - Тип записи
   * @param {any[]} args - Содержимое записи
   */
  const log: Function = (type: string, ...args: any[]) => {
    // eslint-disable-next-line no-console
    (console[type as keyof Console] as Function)(...args);
  };

  /**
   * Функция, возвращающая Promise на сконструированный шаблон
   *
   * @type {Function}
   * @param {object} page - Объект страницы
   * @param {string} page.path - Путь до страницы
   * @param {boolean} page.setup - Тип скриптов
   * @param {boolean} page.scoped - Тип стилей
   * @param {string} page.htm - Шаблон страницы
   * @param {string} page.js - Скрипты страницы
   * @param {string} page.css - Стили страницы
   * @returns {Promise<object>} Шаблон
   */
  const getAsyncComponent: Function = ({
    path,
    setup,
    scoped,
    htm,
    js,
    css,
  }: {
    path: string;
    setup: boolean;
    scoped: boolean;
    htm: Promise<string>;
    css: Promise<string>;
    js: Promise<string>;
  }): Promise<object> => {
    /**
     * Функция получения файла шаблона
     *
     * @type {Function}
     * @returns {Promise<ContentData>} Шаблон
     */
    const getFile: Function = async (): Promise<ContentData> => {
      /** @type {[string, string, string]} */
      const [template, script, style]: [string, string, string] =
        await Promise.all([htm, js, css]);

      /**
       * Константа со скриптами
       *
       * @type {string}
       */
      const cntScript: string =
        script && `<script${setup ? " setup" : ""}>${script}</script>`;

      /**
       * Константа с шаблоном
       *
       * @type {string}
       */
      const cntTemplate: string =
        template && `<template>${template}</template>`;

      /**
       * Константа со стилями
       *
       * @type {string}
       */
      const cntStyle: string =
        style && `<style${scoped ? " scoped" : ""}>${style}</style>`;

      return `${cntScript}${cntTemplate}${cntStyle}`;
    };

    /**
     * Процедура добавления стилей
     *
     * @type {Function}
     * @param {string} styles - Стили
     */
    const addStyle: Function = (styles: string) => {
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
   * @type {Function}
   * @param {TPage} that - Текущий объект страницы
   * @param {string} key - Название свойства для хранения считанного файла
   * @param {string} ext - Расширение файла
   * @returns {Promise<string>} Содержимое файла
   */
  const getFile: Function = async (
    that: TPage,
    key: string,
    ext: string,
  ): Promise<string> => {
    if (that[key as keyof TPage] == null) {
      const response = await fetch(`/assets/${that.id}.${ext}`, { cache });
      const value = response.ok ? await response.text() : "";
      Object.defineProperty(that, key, { value });
    }
    return that[key as keyof TPage] as string;
  };

  /**
   * Объект, на котором определяется загрузка шаблона страницы
   *
   * @type {PropertyDescriptor}
   */
  const htm: PropertyDescriptor = {
    /**
     * Геттер шаблона страницы
     *
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
  const css: PropertyDescriptor = {
    /**
     * Геттер стилей страницы
     *
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
  const js: PropertyDescriptor = {
    /**
     * Геттер скриптов страницы
     *
     * @returns {Promise<string>} - Скрипты страницы
     */
    async get(): Promise<string> {
      return getFile(this as TPage, "script", "js");
    },
  };

  /**
   * Рекурсивная функция ремонта страниц
   *
   * @type {Function}
   * @param {TPage[]} siblings - Элементы массива страниц
   */
  const fix: Function = (siblings: TPage[]) => {
    siblings.forEach((value) => {
      Object.defineProperties(value, {
        htm,
        css,
        js,
      });
      fix(value.children ?? []);
    });
  };

  return { getAsyncComponent, fix };
});
