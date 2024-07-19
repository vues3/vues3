import type { TComponent, TData, TView } from "stores/types";

import mimes from "assets/mimes.json";
import mime from "mime";
import { debounce, uid } from "quasar";
import { data, views } from "stores/data";
import { cache, configurable, deep, flush, writable } from "stores/defaults";
import { bucket, getObject, putFile, putObject } from "stores/s3";
import { validateComponent } from "stores/types";
import { toXML } from "to-xml";
import { computed, ref, watch } from "vue";

const parser = new DOMParser();
const sfc = {
  async get(this: TView) {
    if (!this.buffer && this.id) {
      const value = JSON.parse(
        (await (await getObject(`views/${this.id}.json`, cache)).text()) ||
          "{}",
      ) as TComponent;
      validateComponent(value);
      Reflect.defineProperty(this, "buffer", { configurable, value });
      watch(
        this.buffer,
        debounce((component) => {
          if (this.id)
            putObject(
              `views/${this.id}.json`,
              "application/json",
              JSON.stringify(component),
            ).catch(() => {});
        }),
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
                new URL(`${window.location.origin}${this.pathname}`),
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
        new URL(`${window.location.origin}${this.pathname}`),
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
export const rightDrawer = ref(false);
const sitemap = computed(() => ({
  "?": 'xml version="1.0" encoding="UTF-8"',
  urlset: {
    "@xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9",
    url: views.value.map(({ changefreq, lastmod, pathname, priority }) => ({
      changefreq,
      lastmod,
      loc: `https://${bucket.value}${pathname}`,
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
