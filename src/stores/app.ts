import {
  get,
  useArrayFind,
  useDebounceFn,
  useFetch,
  watchDebounced,
  whenever,
} from "@vueuse/core";
import { logicAnd } from "@vueuse/math";
import { css_beautify, html_beautify, js_beautify } from "js-beautify";
import mime from "mime";
import { defineStore, storeToRefs } from "pinia";
import { toXML } from "to-xml";
import { computed, ComputedRef, reactive, watch } from "vue";

import Data, { TData, TPage } from "~/monolit/src/stores/data";

import storeS3 from "./s3";

export default defineStore("app", () => {
  const rootFileName = "index.html";
  const { S3, base, bucket } = storeToRefs(storeS3());
  const { putObject, headObject, getObject } = storeS3();
  const { pages } = storeToRefs(Data());
  const { $, validate } = Data();

  const debounce = 10000;

  /**
   * Модификатор для вотчера, указывает на проверку всех изменений в глубину
   *
   * @constant
   * @default
   * @type {boolean}
   */
  const deep: boolean = true;

  const configurable: boolean = true;

  /**
   * @param {TPage} that - Текущий объект страницы
   * @param {string} key - Название свойства для хранения считанного файла
   * @param {string} ext - Расширение файла
   * @param {Function} beautify - Ф-ция форматирования кода
   * @returns {Promise<string>} Содержимое файла
   */
  const getFile = async (
    that: TPage,
    key: string,
    ext: string,
    beautify: Function,
  ): Promise<string> => {
    if (that[key as keyof TPage] == null) {
      const value = beautify(
        (await getObject(`assets/${that.id}.${ext}`)) ?? "",
      );
      Object.defineProperty(that, key, { value, configurable });
    }
    return that[key as keyof TPage] as string;
  };

  /**
   * @param {TPage} that - Текущий объект страницы
   * @param {string} key - Название свойства для хранения считанного файла
   * @param {string} ext - Расширение файла
   * @param {string} text - Новое содержимое файла
   */
  const save = (that: TPage, key: string, ext: string, text: string) => {
    putObject(`assets/${that.id}.${ext}`, mime.getType(ext), text);
    const value = new Date().toISOString();
    Reflect.defineProperty(that, "lastmod", { value });
  };

  const debounceFn = useDebounceFn(save, debounce);

  /**
   * @param {TPage} that - Текущий объект страницы
   * @param {string} key - Название свойства для хранения считанного файла
   * @param {string} ext - Расширение файла
   * @param {string} value - Новое содержимое файла
   */
  const setFile = (that: TPage, key: string, ext: string, value: string) => {
    Object.defineProperty(that, key, { value, configurable });
    debounceFn(that, key, ext, value);
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
      const baseUrl = `${get(base)}/`;
      return (
        await getFile(this as TPage, "template", "htm", html_beautify)
      ).replace(
        /(["'(;])([^"'(;:]*?\.(?:apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)[^'")&]?(?=[^<]+?>))/gi,
        (match, p1, p2) =>
          `${p1}${new URL(p2.replace(/^\//, ""), baseUrl).href}`,
      );
    },
    /**
     * Сеттер шаблона страницы
     *
     * @param {string} value - Передаваемый шаблон страницы
     */
    set(value: string) {
      const regexp = new RegExp(`^${get(base)}`);
      setFile(
        this as TPage,
        "template",
        "htm",
        value.replace(
          /[^"'(;]+?\.(?:apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)[^'")&]?(?=[^<]+?>)/gi,
          (match) => match.replace(regexp, ""),
        ),
      );
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
    get(): Promise<string> {
      return getFile(this as TPage, "style", "css", css_beautify);
    },
    /**
     * Сеттер стилей страницы
     *
     * @param {string} value - Передаваемые стили страницы
     */
    set(value: string) {
      setFile(this as TPage, "style", "css", value);
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
      return getFile(this as TPage, "script", "js", js_beautify);
    },
    /**
     * Сеттер скриптов страницы
     *
     * @param {string} value - Передаваемые скрипты страницы
     */
    set(value: string) {
      setFile(this as TPage, "script", "js", value);
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
      Object.defineProperties(value, { htm, css, js });
      fix(value.children ?? []);
    });
  };

  watch(
    () => $?.content ?? [],
    (value) => {
      fix(value);
    },
    { deep },
  );

  watch(S3, async () => {
    const data = JSON.parse((await getObject("assets/data.json")) ?? "{}");
    validate?.(data);
    Object.keys(data).forEach((key) => {
      $[key as keyof TData] = data[key as keyof {}];
    });
  });

  /**
   * Переключатель видимости правой панели
   *
   * @type {boolean}
   */
  const { data } = useFetch("monolit/.vite/manifest.json", {
    /**
     * Переводим в массив
     *
     * @param {object} ctx - Возвращаемый объект
     * @returns {object} - Трансформируемый возвращаемый объект
     */
    afterFetch(ctx) {
      ctx.data = [
        ...new Set([
          rootFileName,
          "robots.txt",
          ...Object.values(ctx.data).map(({ file }: any) => file),
          ...ctx.data[rootFileName].css,
        ]),
      ];
      return ctx;
    },
  }).json();

  whenever(logicAnd(S3, data), () => {
    /** @param {string} pAsset - Путь до файла ресурса */
    const headPutObject = async (pAsset: any) => {
      try {
        if (pAsset === rootFileName) throw new Error();
        await headObject(pAsset);
      } catch (e) {
        const body = await (await fetch(`monolit/${pAsset}`)).blob();
        putObject(pAsset, body.type, body);
      }
    };
    get(data).reduce(async (promise: any, asset: any, currentIndex: any) => {
      if (currentIndex % 2) await promise;
      await headPutObject(asset);
    }, Promise.resolve());
  });
  watchDebounced(
    $,
    (value, oldValue) => {
      if (value && oldValue)
        putObject(
          "assets/data.json",
          mime.getType("json"),
          JSON.stringify(value),
        );
    },
    { deep, debounce },
  );
  const state = reactive({
    rightDrawer: null,
    js: {
      selected: undefined,
      tab: "script",
    },
    css: {
      selected: undefined,
      tab: "style",
    },
    content: {
      selected: undefined,
      tab: "wysiwyg",
      expanded: [],
    },
  });
  const the: ComputedRef<TPage> = <ComputedRef<TPage>>(
    useArrayFind(pages, ({ id }) => id === state.content.selected)
  );
  const sitemap = computed(() => ({
    "?": 'xml version="1.0" encoding="UTF-8"',
    urlset: {
      "@xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
      url: get(pages).map(({ urn, lastmod, changefreq, priority }) => ({
        loc: `https://${get(bucket)}/${urn}`,
        lastmod,
        changefreq,
        priority,
      })),
    },
  }));
  watchDebounced(
    sitemap,
    (value, oldValue) => {
      if (value && oldValue)
        putObject("sitemap.xml", mime.getType("xml"), toXML(value));
    },
    { debounce },
  );

  return { state, the, save };
});
