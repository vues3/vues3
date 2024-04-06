import {
  get,
  useArrayFind,
  useFetch,
  watchDebounced,
  whenever,
} from "@vueuse/core";
import { logicAnd } from "@vueuse/math";
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
     * Преводим в массив
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
          "application/json",
          JSON.stringify(value),
        );
    },
    { deep: true, debounce: 1000, maxWait: 10000 },
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
        putObject("sitemap.xml", "application/xml", toXML(value));
    },
    { debounce: 1000, maxWait: 10000 },
  );

  return {
    state,
    selectedValue,
    the,
  };
});
