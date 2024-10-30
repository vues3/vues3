/**
 * Основное место хранения общего программного кода для приложение vueS3
 *
 * @packageDocumentation
 */

import type { TComponent, TImportmap, TPage } from "stores/types";

import mimes from "assets/mimes.json";
import mime from "mime";
import { debounce, uid } from "quasar";
import { data, pages } from "stores/data";
import { cache, configurable, deep, second, writable } from "stores/defaults";
import {
  bucket,
  domain,
  getObject,
  headObject,
  putFile,
  putObject,
} from "stores/s3";
import { validateComponent, validateImportmap } from "stores/types";
import { toXML } from "to-xml";
import { computed, reactive, ref, version, watch } from "vue";

/** Экземпляр парсера DOM для преобразования шаблона в WYSIWYG и обратно */
const parser = new DOMParser();
export const selected = ref();
export const the = computed(
  () => pages.value.find(({ id }) => id === selected.value) ?? pages.value[0],
);
export const urls = reactive(new Map<string, string>());
{
  const routerLink = "router-link";
  /**
   * Динамическое вычисляемое свойство для страницы, в нем содержится компонент,
   * полученный для страницы из хранилища S3.
   */
  const sfc = {
    /**
     * Геттер свойства sfc, который при первом обращении создает свойство buffer
     * и инициализирует его значением, загруженным из хранилища S3. Также он
     * создает триггер, отслеживающий изменения свойства buffer. Если значение
     * buffer изменяется, происходит запись в хранилище S3 по соответствующему
     * идентификатору.
     *
     * @param this - Страница , которой назначено свойство sfc
     * @returns Обещание на значение свойства buffer
     */
    async get(this: TPage) {
      if (!this.buffer && this.id) {
        /** Компонент, загружаемый из хранилища S3 */
        const value = JSON.parse(
          (await (await getObject(`pages/${this.id}.json`, cache)).text()) ||
            "{}",
        ) as TComponent;
        validateComponent(value);
        Reflect.defineProperty(this, "buffer", { configurable, value });
        watch(
          this.buffer,
          debounce(
            /**
             * Функция записи компонента с соответствущим идентификатором в
             * хранилище S3
             *
             * @param component - Компонент страницы для записи
             */
            (component) => {
              if (this.id)
                putObject(
                  `pages/${this.id}.json`,
                  "application/json",
                  JSON.stringify(component),
                ).catch(
                  /** Фейковая функция обнаружения сбоев */
                  () => {},
                );
            },
            second,
          ),
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
  const value = false;
  const contenteditable = { value, writable };
  watch(pages, (objects) => {
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
  });
}
const vue = `assets/vue.esm-browser.prod-${version}.js`;
export const importmap = reactive({} as TImportmap);
export const fonts = reactive([]);
watch(bucket, async (value) => {
  if (value) {
    (async () => {
      data.push(
        (
          JSON.parse(
            (await (await getObject("index.json", cache)).text()) || "[{}]",
          ) as TPage[]
        )[0] ?? {},
      );
    })().catch(() => {});
    (async () => {
      fonts.length = 0;
      fonts.push(
        ...(JSON.parse(
          (await (await getObject("fonts.json", cache)).text()) || "[]",
        ) as never[]),
      );
    })().catch(() => {});
    (async () => {
      const { imports } = JSON.parse(
        (await (await getObject("index.importmap", cache)).text()) || "{}",
      ) as TImportmap;
      importmap.imports = imports;
      validateImportmap(importmap);
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
    const files = [vue, "robots.txt", "fonts.json"];
    (
      await Promise.allSettled(files.map((file) => headObject(file, cache)))
    ).forEach(({ status }, index) => {
      if (status === "rejected") localManifest.add(files[index]);
    });
    [...localManifest.add(".vite/manifest.json")]
      .filter((x) => !serverManifest.has(x))
      .forEach((element) => {
        (async () => {
          const body = await (await fetch(`monolit/${element}`)).blob();
          putObject(element, body.type, body).catch(() => {});
        })().catch(() => {});
      });
  } else {
    data.length = 0;
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
  fonts,
  debounce((value, oldValue) => {
    if (oldValue)
      putObject("fonts.json", "application/json", JSON.stringify(value)).catch(
        () => {},
      );
  }),
);
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
watch(
  pages,
  debounce((page: TPage[]) => {
    if (domain.value) {
      const url = page
        .filter(({ enabled }) => enabled)
        .map(({ changefreq, lastmod, priority, to }) => {
          const loc = `https://${domain.value}${to === "/" ? "" : encodeURI(to)}`;
          return {
            ...(changefreq && { changefreq }),
            ...(lastmod && { lastmod }),
            ...(priority && { priority }),
            loc,
          };
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
    }
  }, second),
  { deep },
);
(async () => {
  const index = await (await fetch("monolit/index.html")).text();
  watch(
    [pages, importmap],
    debounce((arr) => {
      const [page, imap] = arr as [TPage[], TImportmap];
      const body = index
        .replace(
          '<script type="importmap"></script>',
          `<script type="importmap">
${JSON.stringify(imap, null, " ")}
    </script>`,
        )
        .replace(
          "</head>",
          `  ${Object.values(imap.imports ?? {})
            .filter((href) => !href.endsWith("/"))
            .map(
              (href) => `<link rel="modulepreload" crossorigin href="${href}">`,
            ).join(`
    `)}
    </head>`,
        );
      page.forEach(
        ({ description, images, keywords, loc, path, title, to, type }) => {
          const canonical =
            domain.value && `https://${domain.value}${to === "/" ? "" : to}`;
          const htm = body.replace(
            "</head>",
            `<title>${title}</title>
    ${canonical && `<link rel="canonical" href="${canonical.replaceAll('"', "&quot;")}">`}
    ${[
      [description ?? "", "description"],
      [keywords.join() ?? "", "keywords"],
    ]
      .filter(([content]) => content)
      .map(
        ([content, name]) =>
          `<meta name="${name}" content="${content.replaceAll('"', "&quot;")}">`,
      ).join(`
    `)}
    ${[
      [canonical ?? "", "url"],
      [description ?? "", "description"],
      [title ?? "", "title"],
      [type ?? "", "type"],
      ...(domain.value &&
        images.flatMap(({ alt, url }) => [
          [url ? `https://${domain.value}${url}` : "", "image"],
          [alt ?? "", "image:alt"],
        ])),
    ]
      .filter(([content]) => content)
      .map(
        ([content, property]) =>
          `<meta property="og:${property}" content="${content.replaceAll('"', "&quot;")}">`,
      ).join(`
    `)}
  </head>`,
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
})().catch(() => {});
