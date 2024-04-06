import {
  get,
  useArrayFind,
  useDebounceFn,
  useFetch,
  watchDebounced,
  whenever,
} from "@vueuse/core";
import { logicAnd } from "@vueuse/math";
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

  const debounce = 1000;

  /**
   * Модификатор для вотчера, указывает на проверку всех изменений в глубину
   *
   * @constant
   * @default
   * @type {boolean}
   */
  const deep: boolean = true;

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
      return (await getObject(`/assets/${(<TPage>this).id}.htm`)) ?? "";
    },
    /**
     * Сеттер шаблона страницы
     *
     * @param {string} value - Передаваемый шаблон страницы
     */
    set(value) {
      console.log("set htm");
      useDebounceFn(() => {
        putObject(
          `/assets/${(<TPage>this).id}.htm`,
          mime.getType("htm"),
          value,
        );
      }, debounce)();
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
      return (await getObject(`/assets/${(<TPage>this).id}.css`)) ?? "";
    },
    /**
     * Сеттер стилей страницы
     *
     * @param {string} value - Передаваемые стили страницы
     */
    set(value) {
      console.log("set css");
      useDebounceFn(() => {
        putObject(
          `/assets/${(<TPage>this).id}.css`,
          mime.getType("css"),
          value,
        );
      }, debounce)();
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
      return (await getObject(`/assets/${(<TPage>this).id}.js`)) ?? "";
    },
    /**
     * Сеттер скриптов страницы
     *
     * @param {string} value - Передаваемые скрипты страницы
     */
    set(value) {
      console.log("set js");
      useDebounceFn(() => {
        putObject(`/assets/${(<TPage>this).id}.js`, mime.getType("js"), value);
      }, debounce)();
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
  const selectedValue = computed({
    /**
     * Считывание исходного кода из структуры данных
     *
     * @returns {string} - Template
     */
    get() {
      const { template = "" } = get(the) ?? {};
      const baseUrl = `${get(base)}/`;
      return template.replace(
        /(["'(;])([^"'(;:]*?\.(?:apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)[^'")&]?(?=[^<]+?>))/gi,
        (match, p1, p2) =>
          `${p1}${new URL(p2.replace(/^\//, ""), baseUrl).href}`,
      );
    },
    /**
     * Запись исходного кода страницы в структуры данных
     *
     * @param {string} value - Template
     */
    set(value) {
      const regexp = new RegExp(`^${get(base)}`);
      get(the).template = value.replace(
        /[^"'(;]+?\.(?:apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)[^'")&]?(?=[^<]+?>)/gi,
        (match) => match.replace(regexp, ""),
      );
      get(the).lastmod = new Date().toISOString();
    },
  });
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

  return {
    state,
    selectedValue,
    the,
  };
});
