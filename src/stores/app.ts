import type { AfterFetchContext, RemovableRef } from "@vueuse/core";
import {
  useDebounceFn,
  useFetch,
  useStorage,
  watchDebounced,
} from "@vueuse/core";
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
  mergeDefaults,
  page,
  removeAdditional,
  useDefaults,
} from "stores/defaults";
import { base, bucket, getObject, putFile, putObject, S3 } from "stores/s3";
import { toXML } from "to-xml";
import type { ComputedRef, Ref, WatchOptions } from "vue";
import { computed, ref, watch } from "vue";
/** @type {TConfig} */
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
/**
 * @constant
 * @default
 * @type {string}
 */
const rootFileName: string = "index.html";
/**
 * @function getFile
 * @param {keyof TPage} key - Название свойства для хранения считанного файла
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
 * @function save
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
  /**
   * Дата в формате iso
   *
   * @constant
   * @type {string}
   */
  const value: string = new Date().toISOString();
  Reflect.defineProperty(this, "lastmod", { value });
}
/**
 * Функция с супер способностью устранения дребезга
 *
 * @function debounceFn
 */
const debounceFn: Function = useDebounceFn(save, debounce);
/**
 * @function setFile
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
   * @function get
   * @returns {Promise<string>} - Шаблон страницы
   */
  get(this: TPage): Promise<string> {
    return getFile.call(this, "template", "htm", html_beautify);
  },
  /**
   * Сеттер шаблона страницы
   *
   * @function set
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
   * @async
   * @function get
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
   * @function set
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
   * @function get
   * @returns {Promise<string>} - Стили страницы
   */
  get(this: TPage): Promise<string> {
    return getFile.call(this, "style", "css", css_beautify);
  },
  /**
   * Сеттер стилей страницы
   *
   * @function set
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
   * @async
   * @function get
   * @returns {Promise<string>} - Скрипты страницы
   */
  async get(this: TPage): Promise<string> {
    return getFile.call(this, "script", "js", js_beautify);
  },
  /**
   * Сеттер скриптов страницы
   *
   * @function set
   * @param {string} value - Передаваемые скрипты страницы
   */
  set(this: TPage, value: string) {
    setFile.call(this, "script", "js", value);
  },
};
watch(S3, async (value) => {
  if (value) {
    /** @type {object} */
    const data: object = JSON.parse(
      (await getObject("assets/data.json")) ?? "{}",
    );
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
   * Переводим в коллекцию значений
   *
   * @param {AfterFetchContext} ctx - Возвращаемый объект
   * @returns {Partial<AfterFetchContext>} - Трансформируемая возвращаемая
   *   коллекция значений
   */
  afterFetch(ctx: AfterFetchContext): Partial<AfterFetchContext> {
    ctx.data = new Set(
      [
        rootFileName,
        ".vite/manifest.json",
        "robots.txt",
        ...(Object.values(ctx.data) as { file: string }[]).map(
          ({ file }) => file,
        ),
        ...(ctx.data[rootFileName]?.css ?? []),
      ].filter(Boolean),
    );
    return ctx;
  },
}).json();
watch(
  () => S3.value && data.value,
  async () => {
    /**
     * Манифест, сохраненный на сервере
     *
     * @type {Record<string, Record<string, string | string[]>>}
     * @todo СтОит сделать полноценную валидацию, да где вот на манифест найти
     *   схему?
     */
    const manifest: Record<
      string,
      Record<string, string | string[]>
    > = JSON.parse((await getObject(".vite/manifest.json")) ?? "{}");
    [
      ...data.value.difference(
        new Set(
          [
            ...Object.values(manifest).map(({ file }) => file),
            ...(manifest[rootFileName]?.css ?? []),
          ].filter(Boolean),
        ),
      ),
    ].reduce(async (promise: Promise<string>, asset: string, index: number) => {
      if (index % 2) await promise;
      const body = await (await fetch(`monolit/${asset}`)).blob();
      putObject(asset, body.type, body);
    }, Promise.resolve());
  },
);
watchDebounced(
  $,
  (value, oldValue) => {
    if (value && oldValue)
      putObject("assets/data.json", "application/json", JSON.stringify(value));
  },
  { deep, debounce },
);
/** @type {Ref<string | undefined>} */
export const accessKeyId: Ref<string | undefined> = ref();
/**
 * Хранимая конфигурация приложения
 *
 * @type {RemovableRef<TConfig>}
 */
export const config: RemovableRef<TConfig> = useStorage(
  `config-${accessKeyId.value}`,
  {} as TConfig,
  localStorage,
  { mergeDefaults },
);
/**
 * Флаг правой открывающейся панели
 *
 * @constant
 * @type {Ref<boolean | undefined>}
 */
export const rightDrawer: Ref<boolean | undefined> = ref();
/** @type {ComputedRef<object>} */
const sitemap: ComputedRef<object> = computed(() => ({
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
 * @returns {Promise<Record<string, string | undefined>>} Возвращаем путь файла
 *   или undefined в случае ошибки
 * @see {@link
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#image_types}
 */
export const putImage = async (
  file: File,
): Promise<Record<string, string | undefined>> => {
  const { type } = file;
  /** @type {string} */
  const filePath: string = `assets/${crypto.randomUUID()}.${mime.getExtension(type)}`;
  /** @type {string | undefined} */
  let message: string | undefined;
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
