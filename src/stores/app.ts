import type { TData, TView } from "stores/types";

import mimes from "assets/mimes.json";
import { css_beautify, html_beautify, js_beautify } from "js-beautify";
import mime from "mime";
import { debounce, uid } from "quasar";
import { data, views } from "stores/data";
import { cache, configurable, deep, flush } from "stores/defaults";
import { bucket, getObject, putFile, putObject } from "stores/s3";
import { toXML } from "to-xml";
import { computed, ref, watch } from "vue";

const parser = new DOMParser();
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
const debounceSave = debounce(save);
function setFile(this: TView, ext: string, value: string) {
  Object.defineProperty(this, ext, { configurable, value });
  debounceSave.call(this, ext, value);
}
const template = {
  async get(this: TView) {
    return getFile.call(this, "htm", html_beautify);
  },
  set(this: TView, value: string) {
    setFile.call(this, "htm", value);
  },
};
export const urls = new Map<string, string>();
const html = {
  async get(this: TView) {
    const doc = parser.parseFromString(
      `<head><base href="//"></head><body>${await this.template}</body>`,
      "text/html",
    );
    doc.querySelectorAll("router-link").forEach((link) => {
      const a = document.createElement("a");
      a.innerHTML = link.innerHTML;
      [...link.attributes].forEach((attr) => {
        a.setAttribute(
          attr.nodeName === "to" ? "href" : attr.nodeName,
          attr.nodeValue ?? "",
        );
      });
      link.replaceWith(a);
    });
    (
      await Promise.all(
        (
          await Promise.all(
            [...doc.images].map((image) => {
              const src = image.getAttribute("src") ?? "";
              return bucket.value &&
                src &&
                !urls.has(src) &&
                window.location.origin ===
                  new URL(src, window.location.origin).origin
                ? getObject(src)
                : undefined;
            }),
          )
        ).map((image) => image?.blob()),
      )
    ).forEach((image, index) => {
      const src = doc.images[index].getAttribute("src") ?? "";
      if (image)
        if (image.size) urls.set(src, URL.createObjectURL(image));
        else urls.set(src, "");
      if (urls.get(src)) {
        doc.images[index].setAttribute("data-src", src);
        doc.images[index].setAttribute("src", urls.get(src) ?? "");
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
      const url = new URL(
        a.attributes.getNamedItem("href")?.value ?? "",
        window.location.origin,
      );
      if (
        window.location.origin === url.origin &&
        url.href === `${url.origin}${url.pathname}`
      ) {
        const link = document.createElement("router-link");
        link.innerHTML = a.innerHTML;
        [...a.attributes].forEach((attr) => {
          link.setAttribute(
            attr.nodeName === "href" ? "to" : attr.nodeName,
            attr.nodeValue ?? "",
          );
        });
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
watch(bucket, async (value) => {
  if (value) {
    (async () => {
      data.value = JSON.parse(
        (await (await getObject("data.json", cache)).text()) || "{}",
      ) as TData;
    })().catch(() => {});
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
      ])) as Record<string, Record<string, string | string[]> | undefined>[]
    ).map(
      (element) =>
        new Set(
          [
            ...Object.values(element).map(({ file } = {}) => file),
            ...(element["index.html"]?.css ?? []),
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
      .forEach((element) => {
        (async () => {
          const body = await (await fetch(`monolit/${element}`)).blob();
          putObject(element, body.type, body).catch(() => {});
        })().catch(() => {});
      });
  } else {
    data.value = undefined;
    urls.forEach((url, key) => {
      URL.revokeObjectURL(url);
      urls.delete(key);
    });
  }
});
watch(
  data,
  debounce((value) => {
    if (value)
      putObject("data.json", "application/json", JSON.stringify(value)).catch(
        () => {},
      );
  }),
  { deep },
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
watch(
  sitemap,
  debounce((value) => {
    putObject("sitemap.xml", "application/xml", toXML(value)).catch(() => {});
  }),
);
export const putImage = async (file: File) => {
  const { type } = file;
  const filePath = `images/${uid()}.${mime.getExtension(type) ?? ""}`;
  let message;
  try {
    if (mimes.includes(type)) await putFile(filePath, type, file);
    else
      throw new Error(
        "The graphic file type is not suitable for use on the Internet",
      );
  } catch (err) {
    ({ message } = err as Error);
  }
  return { filePath, message };
};
watch(
  views,
  (newValue) => {
    newValue.forEach((value) => {
      Object.defineProperties(value, { html, script, style, template });
    });
  },
  { flush },
);
