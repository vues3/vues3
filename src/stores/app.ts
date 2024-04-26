import type { RemovableRef } from "@vueuse/core";
import { useDebounceFn, useStorage, watchDebounced } from "@vueuse/core";
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
/**
 * Объект для парсинга
 *
 * @type {DOMParser}
 */
const parser: DOMParser = new DOMParser();
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
 * @function getFile
 * @param {keyof TPage} ext - Расширение файла
 * @param {Function} beautify - Ф-ция форматирования кода
 * @returns {Promise<string>} Содержимое файла
 */
async function getFile(
  this: TPage,
  ext: keyof TPage,
  beautify: Function,
): Promise<string> {
  if (this[ext] == null) {
    const value = beautify((await getObject(`views/${this.id}.${ext}`)) ?? "");
    Object.defineProperty(this, ext, { value, configurable });
  }
  return this[ext] as string;
}
/**
 * @function save
 * @param {string} ext - Расширение файла
 * @param {string} text - Новое содержимое файла
 */
export function save(this: TPage | undefined, ext: string, text: string) {
  if (this) {
    putObject(
      `views/${this.id}.${ext}`,
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
}
/**
 * Функция с супер способностью устранения дребезга
 *
 * @function debounceFn
 */
const debounceFn: Function = useDebounceFn(save, debounce);
/**
 * @function setFile
 * @param {string} ext - Расширение файла
 * @param {string} value - Новое содержимое файла
 */
function setFile(this: TPage, ext: string, value: string) {
  Object.defineProperty(this, ext, { value, configurable });
  debounceFn.call(this, ext, value);
}
/**
 * Объект, на котором определяется загрузка шаблона страницы
 *
 * @type {PropertyDescriptor}
 */
const template: PropertyDescriptor = {
  /**
   * Геттер шаблона страницы
   *
   * @function get
   * @returns {Promise<string>} - Шаблон страницы
   */
  get(this: TPage): Promise<string> {
    return getFile.call(this, "htm", html_beautify);
  },
  /**
   * Сеттер шаблона страницы
   *
   * @function set
   * @param {string} value - Передаваемый шаблон страницы
   */
  set(this: TPage, value: string) {
    setFile.call(this, "htm", value);
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
    const doc = parser.parseFromString(
      `<head><base href="${base.value}/"></head><body>${await this.template}</body>`,
      "text/html",
    );
    [...doc.images].forEach((image) => {
      image.setAttribute("src", image.src);
    });
    return doc.body.innerHTML;
  },
  /**
   * Запись исходного кода страницы в структуры данных
   *
   * @function set
   * @param {string} value - Template
   */
  set(this: TPage, value: string) {
    const regexp = new RegExp(`^${base.value}/`);
    const doc = parser.parseFromString(
      `<head><base href="${base.value}/"></head><body>${value}</body>`,
      "text/html",
    );
    [...doc.images].forEach((image) => {
      image.setAttribute("src", image.src.replace(regexp, ""));
    });
    this.template = doc.body.innerHTML;
  },
};
/**
 * Объект, на котором определяется загрузка стилей страницы
 *
 * @type {PropertyDescriptor}
 */
const style: PropertyDescriptor = {
  /**
   * Геттер стилей страницы
   *
   * @function get
   * @returns {Promise<string>} - Стили страницы
   */
  get(this: TPage): Promise<string> {
    return getFile.call(this, "css", css_beautify);
  },
  /**
   * Сеттер стилей страницы
   *
   * @function set
   * @param {string} value - Передаваемые стили страницы
   */
  set(this: TPage, value: string) {
    setFile.call(this, "css", value);
  },
};
/**
 * Объект, на котором определяется загрузка скриптов страницы
 *
 * @type {PropertyDescriptor}
 */
const script: PropertyDescriptor = {
  /**
   * Геттер скриптов страницы
   *
   * @async
   * @function get
   * @returns {Promise<string>} - Скрипты страницы
   */
  async get(this: TPage): Promise<string> {
    return getFile.call(this, "js", js_beautify);
  },
  /**
   * Сеттер скриптов страницы
   *
   * @function set
   * @param {string} value - Передаваемые скрипты страницы
   */
  set(this: TPage, value: string) {
    setFile.call(this, "js", value);
  },
};
watch(S3, async (value) => {
  if (value) {
    /** @type {object} */
    const data: object = JSON.parse((await getObject("data.json")) ?? "{}");
    validate?.(data);
    Object.keys(data).forEach((key) => {
      $[key as keyof TData] = data[key as keyof {}];
    });
  } else
    Object.keys($).forEach((key) => {
      delete $[key as keyof {}];
    });
});
watch(S3, async (newValue) => {
  if (newValue) {
    const [localManifest, serverManifest] = (
      (await Promise.all([
        (await fetch("monolit/.vite/manifest.json")).json(),
        new Promise((resolve) => {
          getObject(".vite/manifest.json").then((value = "{}") => {
            try {
              resolve(JSON.parse(value));
            } catch (e) {
              resolve({});
            }
          });
        }),
      ])) as Record<string, Record<string, string | string[]>>[]
    ).map(
      (value) =>
        new Set(
          [
            ...Object.values(value).map(({ file }) => file),
            ...(value["index.html"]?.css ?? []),
          ].filter(Boolean),
        ),
    );
    localManifest
      .add("index.html")
      .add(".vite/manifest.json")
      .add("robots.txt")
      // @ts-ignore
      .difference(serverManifest)
      .forEach(async (value: string) => {
        const body = await (await fetch(`monolit/${value}`)).blob();
        putObject(value, body.type, body);
      });
  }
});
watchDebounced(
  $,
  (value, oldValue) => {
    if (value && oldValue)
      putObject("data.json", "application/json", JSON.stringify(value));
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
  const filePath: string = `images/${crypto.randomUUID()}.${mime.getExtension(type)}`;
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
      Object.defineProperties(value, { html, template, style, script });
    });
  },
  { flush },
);
