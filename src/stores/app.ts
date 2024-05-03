import type { RemovableRef } from "@vueuse/core";
import { useDebounceFn, useStorage, watchDebounced } from "@vueuse/core";
import type { AnySchema, ValidateFunction } from "ajv";
import Ajv from "ajv";
import mimes from "assets/mimes.json";
import { css_beautify, html_beautify, js_beautify } from "js-beautify";
import { FromSchema } from "json-schema-to-ts";
import mime from "mime";
import { uid } from "quasar";
import Config from "src/schemas/config";
import type { TData, TView } from "stores/data";
import { $, code, views } from "stores/data";
import {
  cache,
  coerceTypes,
  configurable,
  debounce,
  deep,
  immediate,
  mergeDefaults,
  removeAdditional,
  useDefaults,
} from "stores/defaults";
import { bucket, getObject, putFile, putObject, S3 } from "stores/s3";
import { toXML } from "to-xml";
import type { ComputedRef, Ref, WatchOptions } from "vue";
import { computed, ref, watch } from "vue";
/** Объект для парсинга */
const parser: DOMParser = new DOMParser();
export type TConfig = FromSchema<typeof Config>;
const schemas: AnySchema[] = [Config];
const ajv: Ajv = new Ajv({
  useDefaults,
  coerceTypes,
  removeAdditional,
  schemas,
  code,
});
/** Функция проверки конфига */
export const validateConfig: ValidateFunction = <ValidateFunction>(
  ajv.getSchema("urn:jsonschema:config")
);
/**
 * @param ext - Расширение файла
 * @param beautify - Ф-ция форматирования кода
 * @returns Содержимое файла
 */
async function getFile(
  this: TView,
  ext: keyof TView,
  beautify: (js_source_text: string) => string,
): Promise<string> {
  if (this[ext] == null && this.id) {
    const value = beautify(
      (await (await getObject(`views/${this.id}.${ext}`, cache)).text()) || "",
    );
    Object.defineProperty(this, ext, { value, configurable });
  }
  return <string>this[ext];
}
/**
 * @param ext - Расширение файла
 * @param text - Новое содержимое файла
 */
export function save(this: TView | undefined, ext: string, text: string) {
  if (this?.id) {
    putObject(
      `views/${this.id}.${ext}`,
      mime.getType(ext) ?? "text/plain",
      text,
    ).catch(() => {});
    /** Дата в формате iso */
    const value: string = new Date().toISOString();
    Reflect.defineProperty(this, "lastmod", { value });
  }
}
/** Функция с супер способностью устранения дребезга */
const debounceFn = useDebounceFn(save, debounce);
/**
 * @param ext - Расширение файла
 * @param value - Новое содержимое файла
 */
function setFile(this: TView, ext: string, value: string) {
  Object.defineProperty(this, ext, { value, configurable });
  debounceFn.call(this, ext, value).catch(() => {});
}
/** Объект, на котором определяется загрузка шаблона страницы */
const template: PropertyDescriptor = {
  /**
   * Геттер шаблона страницы
   *
   * @returns - Шаблон страницы
   */
  async get(this: TView): Promise<string> {
    return getFile.call(this, "htm", html_beautify);
  },
  /**
   * Сеттер шаблона страницы
   *
   * @param value - Передаваемый шаблон страницы
   */
  set(this: TView, value: string) {
    setFile.call(this, "htm", value);
  },
};
/** Массив временных урлов для картинок */
const urls: Record<string, string | undefined> = {};
/** Объект, на котором определяется загрузка шаблона страницы */
const html: PropertyDescriptor = {
  /**
   * Считывание исходного кода из структуры данных
   *
   * @async
   * @returns - Template
   */
  async get(this: TView): Promise<string> {
    /** Преобразованный в документ шаблон */
    const doc: Document = parser.parseFromString(
      `<head><base href="//"></head><body>${await this.template}</body>`,
      "text/html",
    );
    Object.keys(urls).forEach((url) => {
      if (![...doc.images].find((image) => image.src === url)) {
        URL.revokeObjectURL(urls[url] ?? "");
        urls[url] = undefined;
      }
    });
    (
      await Promise.all(
        (
          await Promise.all(
            [...doc.images].map((image) =>
              image.src &&
              !(image.src in urls) &&
              window.location.origin ===
                new URL(image.src, window.location.origin).origin
                ? getObject(image.src)
                : undefined,
            ),
          )
        ).map((image: Response | undefined) => image?.blob()),
      )
    ).forEach((image, index) => {
      if (image)
        if (image.size)
          urls[doc.images[index].src] = URL.createObjectURL(image);
        else urls[doc.images[index].src] = "";
      if (urls[doc.images[index].src]) {
        doc.images[index].setAttribute("data-src", doc.images[index].src);
        doc.images[index].setAttribute(
          "src",
          urls[doc.images[index].src] ?? "",
        );
      }
    });
    return doc.body.innerHTML;
  },
  /**
   * Запись исходного кода страницы в структуры данных
   *
   * @param value - Template
   */
  set(this: TView, value: string) {
    /** Преобразованный в документ шаблон */
    const doc: Document = parser.parseFromString(
      `<head><base href="//"></head><body>${value}</body>`,
      "text/html",
    );
    [...doc.images].forEach((image) => {
      if (image.dataset.src) {
        image.setAttribute("src", image.dataset.src);
        image.removeAttribute("data-src");
      }
    });
    this.template = doc.body.innerHTML;
  },
};
/** Объект, на котором определяется загрузка стилей страницы */
const style: PropertyDescriptor = {
  /**
   * Геттер стилей страницы
   *
   * @returns - Стили страницы
   */
  async get(this: TView): Promise<string> {
    return getFile.call(this, "css", css_beautify);
  },
  /**
   * Сеттер стилей страницы
   *
   * @param value - Передаваемые стили страницы
   */
  set(this: TView, value: string) {
    setFile.call(this, "css", value);
  },
};
/** Объект, на котором определяется загрузка скриптов страницы */
const script: PropertyDescriptor = {
  /**
   * Геттер скриптов страницы
   *
   * @async
   * @returns - Скрипты страницы
   */
  async get(this: TView): Promise<string> {
    return getFile.call(this, "js", js_beautify);
  },
  /**
   * Сеттер скриптов страницы
   *
   * @param value - Передаваемые скрипты страницы
   */
  set(this: TView, value: string) {
    setFile.call(this, "js", value);
  },
};
watch(S3, async (value) => {
  if (value)
    $.value = <TData>(
      JSON.parse((await (await getObject("data.json", cache)).text()) || "{}")
    );
  else $.value = undefined;
});
watch(S3, async (newValue) => {
  if (newValue) {
    const [localManifest, serverManifest] = (<
      Record<string, Record<string, string | string[]>>[]
    >await Promise.all([
      (await fetch("monolit/.vite/manifest.json")).json(),
      new Promise((resolve) => {
        resolve(
          (async (response: Promise<Response>) =>
            <object>JSON.parse((await (await response).text()) || "{}"))(
            getObject(".vite/manifest.json", cache),
          ),
        );
      }),
    ])).map(
      (value) =>
        new Set(
          <string[]>(
            [
              ...Object.values(value).map(({ file }) => file),
              ...(value["index.html"].css || []),
            ].filter(Boolean)
          ),
        ),
    );
    [
      ...localManifest
        .add("index.html")
        .add(".vite/manifest.json")
        .add("robots.txt"),
    ]
      .filter((x) => !serverManifest.has(x))
      .forEach((value: string) => {
        (async () => {
          const body = await (await fetch(`monolit/${value}`)).blob();
          putObject(value, body.type, body).catch(() => {});
        })().catch(() => {});
      });
  }
});
watchDebounced(
  $,
  (value, oldValue) => {
    if (value && oldValue)
      putObject("data.json", "application/json", JSON.stringify(value)).catch(
        () => {},
      );
  },
  { deep, debounce },
);
export const accessKeyId: Ref<string | undefined> = ref();
/** Хранимая конфигурация приложения */
export const config: RemovableRef<TConfig> = useStorage(
  `config-${accessKeyId.value ?? ""}`,
  <TConfig>{},
  localStorage,
  { mergeDefaults },
);
/** Флаг правой открывающейся панели */
export const rightDrawer: Ref<boolean | undefined> = ref();
const sitemap: ComputedRef<object> = computed(() => ({
  "?": 'xml version="1.0" encoding="UTF-8"',
  urlset: {
    "@xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
    url: views.value.map(({ url, lastmod, changefreq, priority }) => ({
      loc: `https://${bucket.value}/${url}`,
      lastmod,
      changefreq,
      priority,
    })),
  },
}));
watchDebounced(
  sitemap,
  (value) => {
    putObject("sitemap.xml", "application/xml", toXML(value)).catch(() => {});
  },
  { debounce },
);
watch(
  config,
  (value) => {
    validateConfig(value);
  },
  { immediate },
);
/**
 * @param file - Файл
 * @returns Возвращаем путь файла или undefined в случае ошибки
 * @see {@link
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types#image_types}
 */
export const putImage = async (
  file: File,
): Promise<Record<string, string | undefined>> => {
  const { type } = file;
  const filePath: string = `images/${uid()}.${mime.getExtension(type) ?? ""}`;
  let message: string | undefined;
  try {
    if (mimes.includes(type)) await putFile(filePath, type, file);
    else
      throw new Error(
        "Тип графического файла не подходит для использования в сети интернет",
      );
  } catch (err) {
    ({ message } = <Error>err);
  }
  return { filePath, message };
};
/**
 * Adjust the callback's flush timing
 *
 * @default
 */
const flush: WatchOptions["flush"] = "sync";
watch(
  views,
  (newValue) => {
    newValue.forEach((value) => {
      Object.defineProperties(value, { html, template, style, script });
    });
  },
  { flush },
);
