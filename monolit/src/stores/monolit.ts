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
      const response = await fetch(`/assets/${(<TPage>this).id}.htm`, {
        cache,
      });
      return response.ok ? response.text() : "";
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
      const response = await fetch(`/assets/${(<TPage>this).id}.css`, {
        cache,
      });
      return response.ok ? response.text() : "";
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
      const response = await fetch(`/assets/${(<TPage>this).id}.js`, {
        cache,
      });
      return response.ok ? response.text() : "";
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
   * @returns {object} Шаблон
   */
  const fncTemplate = ({
    id: _id = "",
    _: id = `style_${_id}`,
    template = "",
    script = "",
    style = "",
    path = "",
    setup = true,
    scoped = true,
  }: {
    _: string;
    id: string;
    template: string;
    script: string;
    style: string;
    path: string;
    setup: boolean;
    scoped: boolean;
  }): object => {
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
    /**
     * Функция получения файла шаблона
     *
     * @type {Function}
     * @returns {string} Шаблон
     */
    const getFile = () =>
      Promise.resolve(`${cntScript}${cntTemplate}${cntStyle}`);

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

  return { fncTemplate, fix };
});
