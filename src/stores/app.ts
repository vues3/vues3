import type { RemovableRef } from "@vueuse/core";
import {
  useDebounceFn,
  useFetch,
  useStorage,
  watchDebounced,
  whenever,
} from "@vueuse/core";
import { logicAnd } from "@vueuse/math";
import type { AnySchema, ValidateFunction } from "ajv";
import Ajv from "ajv";
import mimes from "assets/mimes.json";
import { css_beautify, html_beautify, js_beautify } from "js-beautify";
import { FromSchema } from "json-schema-to-ts";
import mime from "mime";
import Config from "src/schemas/config";
import type { TData, TPage } from "stores/data";
import { $, code, pages, validate } from "stores/data";
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
} from "stores/defaults";
import {
  base,
  bucket,
  getObject,
  headObject,
  putFile,
  putObject,
  S3,
} from "stores/s3";
import { toXML } from "to-xml";
import type { Ref, WatchOptions } from "vue";
import { computed, ref, watch } from "vue";

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
 * @param {string} key - Название свойства для хранения считанного файла
 * @param {string} ext - Расширение файла
 * @param {Function} beautify - Ф-ция форматирования кода
 * @returns {Promise<string>} Содержимое файла
 */
async function getFile(
  this: TPage,
  key: keyof TPage,
  ext: string,
  beautify: Function,
): Promise<string> {
  if (this[key] == null) {
    const value = beautify((await getObject(`assets/${this.id}.${ext}`)) ?? "");
    Object.defineProperty(this, key, { value, configurable });
  }
  return this[key] as string;
}

/**
 * @param {string} key - Название свойства для хранения считанного файла
 * @param {string} ext - Расширение файла
 * @param {string} text - Новое содержимое файла
 */
export function save(this: TPage, key: string, ext: string, text: string) {
  putObject(
    `assets/${this.id}.${ext}`,
    mime.getType(ext) ?? "text/plain",
    text,
  );
  const value = new Date().toISOString();
  Reflect.defineProperty(this, "lastmod", { value });
}

const debounceFn = useDebounceFn(save, debounce);

/**
 * @param {string} key - Название свойства для хранения считанного файла
 * @param {string} ext - Расширение файла
 * @param {string} value - Новое содержимое файла
 */
function setFile(this: TPage, key: string, ext: string, value: string) {
  Object.defineProperty(this, key, { value, configurable });
  debounceFn.call(this, key, ext, value);
}

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
  get(this: TPage): Promise<string> {
    return getFile.call(this, "template", "htm", html_beautify);
  },
  /**
   * Сеттер шаблона страницы
   *
   * @param {string} value - Передаваемый шаблон страницы
   */
  set(this: TPage, value: string) {
    setFile.call(this, "template", "htm", value);
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
  async get(this: TPage): Promise<string> {
    const baseUrl = `${base.value}/`;
    return (await this.htm).replace(
      /(["'(;])([^"'(;:]*?\.(?:apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjp|png|svg|webp)[^'")&]?(?=[^<]+?>))/gi,
      (match, p1, p2) => `${p1}${new URL(p2.replace(/^\//, ""), baseUrl).href}`,
    );
  },
  /**
   * Запись исходного кода страницы в структуры данных
   *
   * @param {string} value - Template
   */
  set(this: TPage, value: string) {
    const regexp = new RegExp(`^${base.value}`);
    this.htm = value.replace(
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
  get(this: TPage): Promise<string> {
    return getFile.call(this, "style", "css", css_beautify);
  },

  /**
   * Сеттер стилей страницы
   *
   * @param {string} value - Передаваемые стили страницы
   */
  set(this: TPage, value: string) {
    setFile.call(this, "style", "css", value);
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
  async get(this: TPage): Promise<string> {
    return getFile.call(this, "script", "js", js_beautify);
  },
  /**
   * Сеттер скриптов страницы
   *
   * @param {string} value - Передаваемые скрипты страницы
   */
  set(this: TPage, value: string) {
    setFile.call(this, "script", "js", value);
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
  data.value.reduce(async (promise: any, asset: any, currentIndex: any) => {
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
    url: pages.value.map(({ url, lastmod, changefreq, priority }) => ({
      loc: `https://${bucket.value}/${url}`,
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
