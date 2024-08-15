import type { TComponent, TImportmap, TView } from "stores/types";
import type { Ref } from "vue";

import mimes from "assets/mimes.json";
import mime from "mime";
import { debounce, uid } from "quasar";
import { data, views } from "stores/data";
import {
  cache,
  configurable,
  deep,
  flush,
  second,
  writable,
} from "stores/defaults";
import { bucket, getObject, headObject, putFile, putObject } from "stores/s3";
import { validateComponent, validateImportmap } from "stores/types";
import { toXML } from "to-xml";
import { ref, version, watch } from "vue";

const parser = new DOMParser();
const sfc = {
  async get(this: TView) {
    if (!this.buffer && this.id) {
      const value = JSON.parse(
        (await (await getObject(`pages/${this.id}.json`, cache)).text()) ||
          "{}",
      ) as TComponent;
      validateComponent(value);
      Reflect.defineProperty(this, "buffer", { configurable, value });
      watch(
        this.buffer,
        debounce((component) => {
          if (this.id)
            putObject(
              `pages/${this.id}.json`,
              "application/json",
              JSON.stringify(component),
            ).catch(() => {});
        }, second),
      );
    }
    return this.buffer;
  },
};
const template = {
  async get(this: TView) {
    return (await this.sfc).template;
  },
  set(this: TView, value: string) {
    if (this.buffer) this.buffer.template = value;
  },
};
const style = {
  async get(this: TView) {
    return (await this.sfc).style;
  },
  set(this: TView, value: string) {
    if (this.buffer) this.buffer.style = value;
  },
};
const script = {
  async get(this: TView) {
    return (await this.sfc).script;
  },
  set(this: TView, value: string) {
    if (this.buffer) this.buffer.script = value;
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
              const { pathname } = new URL(
                src,
                new URL(`${window.location.origin}${this.to}`),
              );
              const url = src && pathname.replace(/^\//, "");
              const { origin } = new URL(url, window.location.origin);
              return bucket.value &&
                url &&
                !urls.has(url) &&
                window.location.origin === origin
                ? getObject(url)
                : undefined;
            }),
          )
        ).map((image) => image?.blob()),
      )
    ).forEach((image, index) => {
      const src = doc.images[index].getAttribute("src") ?? "";
      const { pathname } = new URL(
        src,
        new URL(`${window.location.origin}${this.to}`),
      );
      const url = src && pathname.replace(/^\//, "");
      if (image)
        if (image.size) urls.set(url, URL.createObjectURL(image));
        else urls.set(url, "");
      if (urls.get(url)) {
        doc.images[index].setAttribute("data-src", src);
        doc.images[index].setAttribute("src", urls.get(url) ?? "");
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
const vue = `assets/vue.esm-browser.prod-${version}.js`;
export const importmap: Ref<TImportmap | undefined> = ref();
watch(bucket, async (value) => {
  if (value) {
    (async () => {
      data.value = JSON.parse(
        (await (await getObject("index.json", cache)).text()) || "[{}]",
      ) as TView[];
    })().catch(() => {});
    (async () => {
      try {
        await headObject("index.css", cache);
      } catch (e) {
        putObject("index.css", "text/css", "").catch(() => {});
      }
    })().catch(() => {});
    (async () => {
      importmap.value = JSON.parse(
        (await (await getObject("index.importmap", cache)).text()) || "{}",
      ) as TImportmap;
      validateImportmap(importmap.value);
      if (importmap.value.imports.vue !== `/${vue}`) {
        importmap.value.imports.vue = `/${vue}`;
        putObject(
          "index.importmap",
          "application/importmap+json",
          JSON.stringify(importmap.value),
        ).catch(() => {});
      }
    })().catch(() => {});
    const [localManifest, serverManifest] = (
      (await Promise.all([
        (await fetch("monolit/.vite/manifest.json")).json(),
        Promise.resolve(
          (async (response) =>
            JSON.parse((await (await response).text()) || "{}") as object)(
            getObject(".vite/manifest.json", cache),
          ),
        ),
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
    try {
      await headObject(vue, cache);
    } catch (e) {
      localManifest.add(vue);
    }
    [...localManifest.add(".vite/manifest.json").add("robots.txt")]
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
      putObject("index.json", "application/json", JSON.stringify(value)).catch(
        () => {},
      );
  }, second),
  { deep },
);
export const rightDrawer = ref(false);
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
const value = false;
const contenteditable = { value, writable };
watch(
  views,
  (objects) => {
    objects.forEach((object) => {
      Object.defineProperties(object, {
        contenteditable,
        html,
        script,
        sfc,
        style,
        template,
      });
    });
  },
  { flush },
);
watch(
  views,
  debounce((view: TView[]) => {
    const url = view.map(({ changefreq, lastmod, priority, to }) => {
      const loc = `https://${bucket.value}${to}`;
      return { changefreq, lastmod, loc, priority };
    });
    const urlset = {
      "@xmlns": "https://www.sitemaps.org/schemas/sitemap/0.9",
      url,
    };
    putObject(
      "sitemap.xml",
      "application/xml",
      toXML({ "?": 'xml version="1.0" encoding="UTF-8"', urlset }),
    ).catch(() => {});
  }, second),
  { deep },
);
const index = await (await fetch("monolit/index.html")).text();
watch(
  [views, importmap],
  debounce((arr) => {
    const [view, imap] = arr as [TView[], TImportmap];
    const type = "text/html";
    const body = index.replace(
      '<script type="importmap"></script>',
      `<script type="importmap">${JSON.stringify(imap)}</script>`,
    );
    view.forEach(({ loc, path }) => {
      if (loc) putObject(`${loc}/index.html`, type, body).catch(() => {});
      putObject(path ? `${path}/index.html` : "index.html", type, body).catch(
        () => {},
      );
    });
  }, second),
  { deep },
);
