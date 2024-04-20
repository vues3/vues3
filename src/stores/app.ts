import type { RemovableRef } from "@vueuse/core";
import {
  get,
  useDebounceFn,
  useFetch,
  useStorage,
  watchDebounced,
  whenever,
} from "@vueuse/core";
import { logicAnd } from "@vueuse/math";
import type { AnySchema, ValidateFunction } from "ajv";
import Ajv from "ajv";
import { css_beautify, html_beautify, js_beautify } from "js-beautify";
import { FromSchema } from "json-schema-to-ts";
import mime from "mime";
import { toXML } from "to-xml";
import type { Ref, WatchOptions } from "vue";
import { computed, ref, watch } from "vue";

import mimes from "@/assets/mimes.json";
import Config from "@/schemas/config";
import type { TData, TPage } from "@/stores/data";
import { $, code, pages, validate } from "@/stores/data";
import {
  coerceTypes,
  configurable,
  debounce,
  deep,
  immediate,
  itemsPerPage,
  page,
  removeAdditional,
  useDefaults,
} from "@/stores/defaults";

import {
  base,
  bucket,
  getObject,
  headObject,
  putFile,
  putObject,
  S3,
} from "./s3";

export type TConfig = FromSchema<typeof Config>;

/**
 * @constant
 * @type {AnySchema[]}
 */
const schemas: AnySchema[] = [Config];

/**
 * @constant
 * @type {Ajv}
 */
const ajv: Ajv = new Ajv({
  useDefaults,
  coerceTypes,
  removeAdditional,
  schemas,
  code,
});

/**
 * Функция проверки конфига
 *
 * @function validateConfig
 * @type {ValidateFunction}
 */
export const validateConfig: ValidateFunction = ajv.getSchema(
  "urn:jsonschema:config",
) as ValidateFunction;

const rootFileName = "index.html";

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
    const value = beautify((await getObject(`assets/${that.id}.${ext}`)) ?? "");
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
export const save = (that: TPage, key: string, ext: string, text: string) => {
  putObject(
    `assets/${that.id}.${ext}`,
    mime.getType(ext) ?? "text/plain",
    text,
  );
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
  get(): Promise<string> {
    return getFile(this as TPage, "template", "htm", html_beautify);
  },
  /**
   * Сеттер шаблона страницы
   *
   * @param {string} value - Передаваемый шаблон страницы
   */
  set(value: string) {
    setFile(this as TPage, "template", "htm", value);
  },
};

/**
 * Объект, на котором определяется загрузка шаблона страницы
 *
 * @type {PropertyDescriptor}
 */
const html: PropertyDescriptor = {
  /**
   * Считывание исходного кода из структуры данных
   *
   * @returns {Promise<string>} - Template
   */
  async get(): Promise<string> {
    const baseUrl = `${get(base)}/`;
    return (await (<TPage>this).htm).replace(
      /(["'(;])([^"'(;:]*?\.(?:apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)[^'")&]?(?=[^<]+?>))/gi,
      (match, p1, p2) => `${p1}${new URL(p2.replace(/^\//, ""), baseUrl).href}`,
    );
  },
  /**
   * Запись исходного кода страницы в структуры данных
   *
   * @param {string} value - Template
   */
  set(value: string) {
    const regexp = new RegExp(`^${get(base)}`);
    (<TPage>this).htm = value.replace(
      /[^"'(;]+?\.(?:apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)[^'")&]?(?=[^<]+?>)/gi,
      (match) => match.replace(regexp, ""),
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
 * Adjust the callback's flush timing
 *
 * @constant
 * @default
 * @type {WatchOptions["flush"]}
 */
const flush: WatchOptions["flush"] = "sync";

watch(
  pages,
  (newValue) => {
    newValue.forEach((value) => {
      Object.defineProperties(value, { html, htm, css, js });
    });
  },
  { flush },
);

watch(S3, async (value) => {
  if (value) {
    const data = JSON.parse((await getObject("assets/data.json")) ?? "{}");
    validate?.(data);
    Object.keys(data).forEach((key) => {
      $[key as keyof TData] = data[key as keyof {}];
    });
  } else
    Object.keys($).forEach((key) => {
      delete $[key as keyof {}];
    });
});

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
      putObject("assets/data.json", "application/json", JSON.stringify(value));
  },
  { deep, debounce },
);

export const accessKeyId: Ref<string | null> = ref(null);

/**
 * Смешивание сохраненного объекта с объектом по умолчанию
 *
 * @constant
 * @default
 * @type {boolean}
 */
const mergeDefaults: boolean = true;

/**
 * Хранимая конфигурация приложения
 *
 * @type {RemovableRef<TConfig>}
 */
export const config: RemovableRef<TConfig> = useStorage(
  `config-${accessKeyId.value}`,
  {} as TConfig,
  localStorage,
  {
    mergeDefaults,
  },
);

export const rightDrawer: Ref<boolean | null> = ref(null);

const sitemap = computed(() => ({
  "?": 'xml version="1.0" encoding="UTF-8"',
  urlset: {
    "@xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
    url: get(pages).map(({ url, lastmod, changefreq, priority }) => ({
      loc: `https://${get(bucket)}/${url}`,
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
  { debounce },
);

watch(
  config,
  (value) => {
    validateConfig?.(value);
  },
  { immediate },
);

/**
 * Настройки страниц при выборе иконок
 *
 * @constant
 * @default
 * @type {object}
 */
export const pagination: object = { itemsPerPage, page };

/**
 * @function putImage
 * @param {object} file - Файл
 * @returns {Promise<Record<string, string | null>>} Возвращаем путь файла или
 *   null в случае ошибки
 * @see {@link
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#image_types}
 */
export const putImage = async (
  file: File,
): Promise<Record<string, string | null>> => {
  const { type } = file;

  /** @type {string} */
  const filePath: string = `assets/${crypto.randomUUID()}.${mime.getExtension(type)}`;

  /** @type {string | null} */
  let message: string | null = null;

  try {
    if (mimes.includes(type)) await putFile(filePath, type, file);
    else
      throw new Error(
        "Тип графического файла не подходит для использования в сети интернет",
      );
  } catch (err) {
    ({ message } = err as Error);
  }
  return { filePath, message };
};
