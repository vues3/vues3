import * as tresjsCientos from "@tresjs/cientos";
import * as tresjsCore from "@tresjs/core";
import * as vueuseComponents from "@vueuse/components";
import * as vueuseCore from "@vueuse/core";
import * as vueuseMath from "@vueuse/math";
import { defineStore } from "pinia";
import * as vue from "vue";
import * as vueRouter from "vue-router";
import { loadModule, Options } from "vue3-sfc-loader";

import { TPage } from "@/stores/data";

export default defineStore("monolit", () => {
  const { defineAsyncComponent } = vue;
  const { useStyleTag } = vueuseCore;

  const cache = "no-cache";

  /**
   * Модули, передаваемые шаблону
   *
   * @type {object}
   */
  const moduleCache = {
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
   * @param {...any} args - Содержимое записи
   */
  const log = (type = "", ...args: any[]) => {
    // eslint-disable-next-line no-console
    (<any>console)[type]?.(...args);
  };

  /**
   * Задержка рендеригна шаблона
   *
   * @type {number}
   */
  const delay = 0;

  /**
   * Функция, возвращающая Promise на сконструированный шаблон
   *
   * @type {Function}
   * @param {object} page - Объект страницы
   * @param {string} page._ - Фейковый параметр
   * @param {string} page.id - Id страницы
   * @param {string} page.template - Шаблон страницы
   * @param {string} page.script - Скрипты страницы
   * @param {string} page.style - Стили страницы
   * @param {string} page.path - Путь до страницы
   * @param {boolean} page.setup - Тип скриптов
   * @param {boolean} page.scoped - Тип стилей
   * @returns {Promise<object>} Шаблон
   */
  const fncTemplate = ({
    id: _id,
    _: id = `style_${_id}`,
    path = "",
    setup = true,
    scoped = true,
    htm,
    js,
    css,
  }: {
    _: string;
    id: string;
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
     * @returns {string} Шаблон
     */
    const getFile = async () => {
      const [template, script, style] = await Promise.all([htm, js, css]);
      /**
       * Константа со скриптами
       *
       * @type {string}
       */
      const cntScript =
        script && `<script${setup ? " setup" : ""}>${script}</script>`;
      /**
       * Константа с шаблоном
       *
       * @type {string}
       */
      const cntTemplate = template && `<template>${template}</template>`;

      /**
       * Константа со стилями
       *
       * @type {string}
       */
      const cntStyle =
        style && `<style${scoped ? " scoped" : ""}>${style}</style>`;

      return `${cntScript}${cntTemplate}${cntStyle}`;
    };

    /**
     * Процедура добавления стилей
     *
     * @type {Function}
     * @param {string} styles - Стили
     */
    const addStyle = (styles = "") => {
      useStyleTag(styles, { id });
    };

    /**
     * Загрузчик шаблона
     *
     * @type {Function}
     * @returns {Promise} Промис
     */
    const loader = () =>
      loadModule(`${["", "~"].includes(path) ? "" : "/"}${path}/view.vue`, <
        Options
      >(<unknown>{
        moduleCache,
        getFile,
        addStyle,
        log,
      }));

    return defineAsyncComponent(<any>{ loader, delay });
  };

  /**
   * @param {TPage} that - Текущий объект страницы
   * @param {string} key - Название свойства для хранения считанного файла
   * @param {string} ext - Расширение файла
   * @returns {Promise<string>} Содержимое файла
   */
  const getFile = async (
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

  return { fncTemplate, fix };
});
