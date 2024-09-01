import type { TComponent, TConfig, TImportmap, TPage } from "stores/types";
import type { ComputedRef, Ref } from "vue";

import { useStorage } from "@vueuse/core";
import mimes from "assets/mimes.json";
import mime from "mime";
import { debounce, uid } from "quasar";
import { data, pages } from "stores/data";
import {
  cache,
  configurable,
  deep,
  flush,
  mergeDefaults,
  second,
  writable,
} from "stores/defaults";
import { bucket, getObject, headObject, putFile, putObject } from "stores/s3";
import {
  validateComponent,
  validateConfig,
  validateImportmap,
} from "stores/types";
import { toXML } from "to-xml";
import { computed, reactive, ref, version, watch } from "vue";

/**
 * Provides the ability to parse XML or HTML source code from a string into a
 * DOM Document.
 */
const parser = new DOMParser();
/** The app config */
export const config = useStorage(
  `.${bucket.value}`,
  () => {
    /** The init empty value for the config */
    const value = {} as TConfig;
    validateConfig(value);
    return value;
  },
  localStorage,
  { mergeDefaults },
);
export const the: ComputedRef<TPage | undefined> = computed(
  () =>
    pages.value.find(({ id }) => id === config.value.selected) ??
    pages.value[0],
);
const sfc = {
  async get(this: TPage) {
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
  async get(this: TPage) {
    return (await this.sfc).template;
  },
  set(this: TPage, value: string) {
    if (this.buffer) this.buffer.template = value;
  },
};
const style = {
  async get(this: TPage) {
    return (await this.sfc).style;
  },
  set(this: TPage, value: string) {
    if (this.buffer) this.buffer.style = value;
  },
};
const script = {
  async get(this: TPage) {
    return (await this.sfc).script;
  },
  set(this: TPage, value: string) {
    if (this.buffer) this.buffer.script = value;
  },
};
export const urls = reactive(new Map<string, string>());
const routerLink = "router-link";
const html = {
  async get(this: TPage) {
    const doc = parser.parseFromString(
      `<head><base href="//"></head><body>${await this.template}</body>`,
      "text/html",
    );
    doc.querySelectorAll(routerLink).forEach((link) => {
      const a = document.createElement("a");
      a.innerHTML = link.innerHTML;
      a.setAttribute(`data-${routerLink}`, "true");
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
              const url = src && pathname.replace(/^\/+/, "");
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
      const url = src && pathname.replace(/^\/+/, "");
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
  set(this: TPage, value: string) {
    const doc = parser.parseFromString(
      `<head><base href="//"></head><body>${value}</body>`,
      "text/html",
    );
    doc.querySelectorAll("a").forEach((a) => {
      try {
        const url = new URL(
          a.attributes.getNamedItem("href")?.value ?? "",
          window.location.origin,
        );
        if (
          Boolean(a.dataset[routerLink]) ||
          (window.location.origin === url.origin &&
            url.href === `${url.origin}${url.pathname}`)
        ) {
          a.removeAttribute(`data-${routerLink}`);
          const link = document.createElement(routerLink);
          link.innerHTML = a.innerHTML;
          [...a.attributes].forEach((attr) => {
            link.setAttribute(
              attr.nodeName === "href" ? "to" : attr.nodeName,
              attr.nodeValue ?? "",
            );
          });
          a.replaceWith(link);
        }
      } catch (e) {
        //
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
      ) as TPage[];
    })().catch(() => {});
    (async () => {
      importmap.value = JSON.parse(
        (await (await getObject("index.importmap", cache)).text()) || "{}",
      ) as TImportmap;
      validateImportmap(importmap.value);
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
watch(
  importmap,
  debounce((value, oldValue) => {
    const { imports } = value as TImportmap;
    let save = Boolean(oldValue);
    if (imports.vue !== `/${vue}`) {
      imports.vue = `/${vue}`;
      save = true;
    }
    if (save)
      putObject(
        "index.importmap",
        "application/importmap+json",
        JSON.stringify({ imports }),
      ).catch(() => {});
  }),
  { deep },
);
export const domain = (value: string) => {
  const lastIndexOfHyphen = value.lastIndexOf("-");
  if (lastIndexOfHyphen > value.lastIndexOf(".")) {
    const chars = [...value];
    chars[lastIndexOfHyphen] = ".";
    return chars.join("");
  }
  return value;
};
const value = false;
const contenteditable = { value, writable };
watch(
  pages,
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
  pages,
  debounce((page: TPage[]) => {
    const url = page.map(({ changefreq, lastmod, priority, to }) => {
      const loc = `https://${domain(bucket.value)}${to === "/" ? "" : encodeURI(to)}`;
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
  [pages, importmap],
  debounce((arr) => {
    const [page, imap] = arr as [TPage[], TImportmap];
    const body = index
      .replace(
        '<script type="importmap"></script>',
        `<script type="importmap">${JSON.stringify(imap)}</script>`,
      )
      .replace(
        "</head>",
        `${Object.values(imap.imports)
          .map(
            (href) => `<link rel="modulepreload" crossorigin href="${href}">`,
          )
          .join("")}</head>`,
      );
    page.forEach(
      ({ description, images, keywords, loc, path, title, to, type }) => {
        const canonical = `https://${domain(bucket.value)}${to === "/" ? "" : to}`;
        const htm = body.replace(
          "</head>",
          `<title>${title}</title><link rel="canonical" href="${canonical}">${[
            ["description", description],
            ["keywords", keywords.join()],
          ]
            .map(([name, content]) =>
              content
                ? `<meta name="${name as string}" content="${content}">`
                : "",
            )
            .join("")}${[
            ["url", canonical],
            ["description", description],
            ["title", title],
            ["type", type],
          ]
            .map(([property, content]) =>
              content
                ? `<meta property="og:${property as string}" content="${content}">`
                : "",
            )
            .join(
              "",
            )}${images.map(({ alt, url }) => `<meta property="og:image" content="https://${domain(bucket.value)}${url ?? ""}"><meta property="og:image:alt" content="${alt ?? ""}">`).join("")}</head>`,
        );
        if (loc)
          putObject(`${loc}/index.html`, "text/html", htm).catch(() => {});
        putObject(
          path ? `${path}/index.html` : "index.html",
          "text/html",
          htm,
        ).catch(() => {});
      },
    );
  }, second),
  { deep },
);
