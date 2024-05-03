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
export const validateConfig: ValidateFunction = <ValidateFunction>(
  ajv.getSchema("urn:jsonschema:config")
);
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
export function save(this: TView | undefined, ext: string, text: string) {
  if (this?.id) {
    putObject(
      `views/${this.id}.${ext}`,
      mime.getType(ext) ?? "text/plain",
      text,
    ).catch(() => {});
    const value: string = new Date().toISOString();
    Reflect.defineProperty(this, "lastmod", { value });
  }
}
const debounceFn = useDebounceFn(save, debounce);
function setFile(this: TView, ext: string, value: string) {
  Object.defineProperty(this, ext, { value, configurable });
  debounceFn.call(this, ext, value).catch(() => {});
}
const template: PropertyDescriptor = {
  async get(this: TView): Promise<string> {
    return getFile.call(this, "htm", html_beautify);
  },
  set(this: TView, value: string) {
    setFile.call(this, "htm", value);
  },
};
const urls: Record<string, string | undefined> = {};
const html: PropertyDescriptor = {
  async get(this: TView): Promise<string> {
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
  set(this: TView, value: string) {
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
const style: PropertyDescriptor = {
  async get(this: TView): Promise<string> {
    return getFile.call(this, "css", css_beautify);
  },
  set(this: TView, value: string) {
    setFile.call(this, "css", value);
  },
};
const script: PropertyDescriptor = {
  async get(this: TView): Promise<string> {
    return getFile.call(this, "js", js_beautify);
  },
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
export const config: RemovableRef<TConfig> = useStorage(
  `config-${accessKeyId.value ?? ""}`,
  <TConfig>{},
  localStorage,
  { mergeDefaults },
);
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
