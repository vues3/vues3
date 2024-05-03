import type { ValidateFunction } from "ajv";
import type { TData, TView } from "stores/data";
import type { Ref } from "vue";

import { useDebounceFn, useStorage, watchDebounced } from "@vueuse/core";
import Ajv from "ajv";
import mimes from "assets/mimes.json";
import { css_beautify, html_beautify, js_beautify } from "js-beautify";
import { FromSchema } from "json-schema-to-ts";
import mime from "mime";
import { uid } from "quasar";
import Config from "src/schemas/config";
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
import { S3, bucket, getObject, putFile, putObject } from "stores/s3";
import { toXML } from "to-xml";
import { computed, ref, watch } from "vue";

const parser = new DOMParser();
export type TConfig = FromSchema<typeof Config>;
const schemas = [Config];
const ajv = new Ajv({
  code,
  coerceTypes,
  removeAdditional,
  schemas,
  useDefaults,
});
export const validateConfig = ajv.getSchema(
  "urn:jsonschema:config",
) as ValidateFunction;
async function getFile(
  this: TView,
  ext: keyof TView,
  beautify: (js_source_text: string) => string,
) {
  if (this[ext] == null && this.id) {
    const value = beautify(
      (await (await getObject(`views/${this.id}.${ext}`, cache)).text()) || "",
    );
    Object.defineProperty(this, ext, { configurable, value });
  }
  return this[ext];
}
export function save(this: TView | undefined, ext: string, text: string) {
  if (this?.id) {
    putObject(
      `views/${this.id}.${ext}`,
      mime.getType(ext) ?? "text/plain",
      text,
    ).catch(() => {});
    const value = new Date().toISOString();
    Reflect.defineProperty(this, "lastmod", { value });
  }
}
const debounceFn = useDebounceFn(save, debounce);
function setFile(this: TView, ext: string, value: string) {
  Object.defineProperty(this, ext, { configurable, value });
  debounceFn.call(this, ext, value).catch(() => {});
}
const template = {
  async get(this: TView) {
    return getFile.call(this, "htm", html_beautify);
  },
  set(this: TView, value: string) {
    setFile.call(this, "htm", value);
  },
};
const urls: Record<string, string | undefined> = {};
const html = {
  async get(this: TView) {
    const doc = parser.parseFromString(
      `<head><base href="//"></head><body>${await this.template}</body>`,
      "text/html",
    );
    doc.querySelectorAll("router-link").forEach((link) => {
      const a = document.createElement("a");
      a.innerHTML = link.innerHTML;
      a.setAttribute("href", link.attributes.getNamedItem("to")?.value ?? "");
      link.replaceWith(a);
    });
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
              urls[image.src] === undefined &&
              window.location.origin ===
                new URL(image.src, window.location.origin).origin
                ? getObject(image.src)
                : undefined,
            ),
          )
        ).map((image) => image?.blob()),
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
    const doc = parser.parseFromString(
      `<head><base href="//"></head><body>${value}</body>`,
      "text/html",
    );

    doc.querySelectorAll("a").forEach((a) => {
      const href = a.attributes.getNamedItem("href")?.value ?? "";
      if (
        window.location.origin === new URL(href, window.location.origin).origin
      ) {
        const link = document.createElement("router-link");
        link.innerHTML = a.innerHTML;
        link.setAttribute("to", href);
        a.replaceWith(link);
      }
    });

    [...doc.images].forEach((image) => {
      if (image.dataset.src) {
        image.setAttribute("src", image.dataset.src);
        image.removeAttribute("data-src");
      }
    });
    this.template = doc.body.innerHTML;
  },
};
const style = {
  async get(this: TView) {
    return getFile.call(this, "css", css_beautify);
  },
  set(this: TView, value: string) {
    setFile.call(this, "css", value);
  },
};
const script = {
  async get(this: TView) {
    return getFile.call(this, "js", js_beautify);
  },
  set(this: TView, value: string) {
    setFile.call(this, "js", value);
  },
};
watch(S3, async (value) => {
  if (value)
    $.value = JSON.parse(
      (await (await getObject("data.json", cache)).text()) || "{}",
    ) as TData;
  else $.value = undefined;
});
watch(S3, async (newValue) => {
  if (newValue) {
    const [localManifest, serverManifest] = (
      (await Promise.all([
        (await fetch("monolit/.vite/manifest.json")).json(),
        new Promise((resolve) => {
          resolve(
            (async (response) =>
              JSON.parse((await (await response).text()) || "{}") as object)(
              getObject(".vite/manifest.json", cache),
            ),
          );
        }),
      ])) as Record<string, Record<string, string | string[]>>[]
    ).map(
      (value) =>
        new Set(
          [
            ...Object.values(value).map(({ file }) => file),
            ...(value["index.html"].css || []),
          ].filter(Boolean) as string[],
        ),
    );
    [
      ...localManifest
        .add("index.html")
        .add(".vite/manifest.json")
        .add("robots.txt"),
    ]
      .filter((x) => !serverManifest.has(x))
      .forEach((value) => {
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
  { debounce, deep },
);
export const accessKeyId: Ref<string | undefined> = ref();
export const config = useStorage(
  `config-${accessKeyId.value ?? ""}`,
  {} as TConfig,
  localStorage,
  { mergeDefaults },
);
export const rightDrawer = ref();
const sitemap = computed(() => ({
  "?": 'xml version="1.0" encoding="UTF-8"',
  urlset: {
    "@xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
    url: views.value.map(({ changefreq, lastmod, priority, url }) => ({
      changefreq,
      lastmod,
      loc: `https://${bucket.value}/${url}`,
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
export const putImage = async (file: File) => {
  const { type } = file;
  const filePath = `images/${uid()}.${mime.getExtension(type) ?? ""}`;
  let message;
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
const flush = "sync";
watch(
  views,
  (newValue) => {
    newValue.forEach((value) => {
      Object.defineProperties(value, { html, script, style, template });
    });
  },
  { flush },
);
