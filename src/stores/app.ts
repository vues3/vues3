import type { SFCDescriptor } from "@vue/compiler-sfc";
import type { TImportmap, TPage } from "@vues3/shared";
import type { Ref } from "vue";

import { data, deep, importmap, pages } from "@vues3/shared";
import mimes from "assets/mimes.json";
import mime from "mime";
import { editor, Uri } from "monaco-editor";
import { debounce, uid } from "quasar";
import { cache, second, writable } from "stores/defaults";
import {
  bucket,
  deleteObject,
  getObjectBlob,
  getObjectText,
  headObject,
  putObject,
  removeEmptyDirectories,
} from "stores/io";
import { toXML } from "to-xml";
import { computed, reactive, ref, version, watch } from "vue";
import toString from "vue-sfc-descriptor-to-string";
import { parse, parseCache } from "vue/compiler-sfc";

export type TAppPage = TPage & {
  contenteditable: boolean;
  html: Promise<string> | string;
  sfc: Promise<editor.ITextModel>;
};

export const domain = ref("");
const parser = new DOMParser();
const getDocument = (value: string) =>
  parser.parseFromString(
    `<head><base href="//"></head><body>${value}</body>`,
    "text/html",
  );
export const selected: Ref<string | undefined> = ref();
let descriptor: SFCDescriptor | undefined;
let errors = [];
const getContent = (model: editor.ITextModel) => {
  const filename = `${selected.value ?? "anonymous"}.vue`;
  ({ descriptor, errors } = parse(model.getValue(), { filename }));
  const { template } = descriptor;
  const { content } = template ?? {};
  return content ?? "";
};
const getImages = (model: editor.ITextModel) => {
  parseCache.clear();
  const { images } = getDocument(getContent(model));
  return [...images].map(({ src }: { src: string }) => src);
};
export const deleted: Ref<TPage | undefined> = ref();
const cleaner = (value: TAppPage[]) => {
  value.forEach(({ children, id, sfc }) => {
    if (children.length) cleaner(children as TAppPage[]);
    (async () => {
      const { images } = getDocument(getContent(await sfc));
      if (id)
        deleteObject(`pages/${id}.vue`).catch((error: unknown) => {
          window.console.error(error);
        });
      [...images].forEach(({ src }) => {
        deleteObject(src).catch((error: unknown) => {
          window.console.error(error);
        });
      });
    })().catch((error: unknown) => {
      window.console.error(error);
    });
  });
};
watch(deleted, (value) => {
  if (value) cleaner([value as TAppPage]);
});
export const the = computed(
  () =>
    (pages.value.find(({ id }) => id === selected.value) ?? pages.value[0]) as
      | TAppPage
      | undefined,
);
export const urls = reactive(new Map<string, string>());
const prevImages: string[] = [];
watch(
  the,
  (value, oldValue) => {
    const images = value?.images.map(({ url = "" }) => url);
    if (images) {
      if (value?.id === oldValue?.id) {
        prevImages
          .filter((url: string) => !images.includes(url))
          .forEach((url) => {
            URL.revokeObjectURL(urls.get(url) ?? "");
            urls.delete(url);
            deleteObject(url).catch((error: unknown) => {
              window.console.error(error);
            });
          });
      }
      prevImages.length = 0;
      prevImages.push(...images);
    }
  },
  { deep },
);
const routerLink = "router-link";
{
  const html = {
    async get(this: TAppPage) {
      const doc = getDocument(getContent(await this.sfc));
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
          [...doc.images].map((image) => {
            const src = image.getAttribute("src");
            return src && !urls.has(src) ? getObjectBlob(src) : undefined;
          }),
        )
      ).forEach((image, index) => {
        const src = doc.images[index]?.getAttribute("src") ?? "";
        if (image?.size) urls.set(src, URL.createObjectURL(image));
        const url = urls.get(src);
        if (url) {
          doc.images[index]?.setAttribute("data-src", src);
          doc.images[index]?.setAttribute("src", url);
        }
      });
      return doc.body.innerHTML;
    },
    async set(this: TAppPage, value: string) {
      const doc = getDocument(value);
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
        } catch {
          //
        }
      });
      [...doc.images].forEach((image) => {
        if (image.dataset.src) {
          image.setAttribute("src", image.dataset.src);
          image.removeAttribute("data-src");
        }
      });
      const sfc = await this.sfc;
      if (descriptor) {
        if (descriptor.template)
          descriptor.template.content = doc.body.innerHTML;
        sfc.setValue(
          `${
            descriptor.template
              ? ""
              : `<template>${doc.body.innerHTML}</template>
`
          }${(toString as (sfcDescriptor: SFCDescriptor) => string)(descriptor)}`,
        );
      }
    },
  };
  const sfc = {
    async get(this: TAppPage) {
      if (this.id) {
        const uri = Uri.parse(`file:///${this.id}.vue`);
        let model = editor.getModel(uri);
        if (!model) {
          const value =
            (await getObjectText(`pages/${this.id}.vue`, cache)) ||
            `<template></template>
`;
          model = editor.getModel(uri);
          if (!model) {
            model = editor.createModel(value, "vue", uri);
            const oldImages = getImages(model);
            model.onDidChangeContent(
              debounce(() => {
                if (model) {
                  const sources = getImages(model);
                  if (!errors.length) {
                    oldImages
                      .filter((src: string) => !sources.includes(src))
                      .forEach((src) => {
                        URL.revokeObjectURL(urls.get(src) ?? "");
                        urls.delete(src);
                        deleteObject(src).catch((error: unknown) => {
                          window.console.error(error);
                        });
                      });
                    oldImages.length = 0;
                    oldImages.push(...sources);
                    if (this.id)
                      putObject(
                        `pages/${this.id}.vue`,
                        model.getValue(),
                        "text/html",
                      ).catch((error: unknown) => {
                        window.console.error(error);
                      });
                  }
                }
              }, second),
            );
          }
        }
        return model;
      }
      return undefined;
    },
  };
  const value = false;
  const contenteditable = { value, writable };
  watch(pages, (objects) => {
    objects.forEach((object) => {
      Object.defineProperties(object, {
        contenteditable,
        html,
        sfc,
      });
    });
  });
}
const vue = `assets/vue.esm-browser.prod-${version}.js`;
export const fonts = reactive([]);
watch(bucket, async (value) => {
  if (value) {
    (async () => {
      data.push(
        (
          JSON.parse(
            (await getObjectText("index.json", cache)) || "[{}]",
          ) as TPage[]
        )[0] ?? ({} as TPage),
      );
    })().catch((error: unknown) => {
      window.console.error(error);
    });
    (async () => {
      fonts.length = 0;
      fonts.push(
        ...(JSON.parse(
          (await getObjectText("fonts.json", cache)) || "[]",
        ) as never[]),
      );
    })().catch((error: unknown) => {
      window.console.error(error);
    });
    (async () => {
      const { imports } = JSON.parse(
        (await getObjectText("index.importmap", cache)) || "{}",
      ) as TImportmap;
      importmap.imports = imports;
    })().catch((error: unknown) => {
      window.console.error(error);
    });
    (async () => {
      {
        const [cname = ""] = (await getObjectText("CNAME", cache)).split(
          "\n",
          1,
        );
        domain.value = cname.trim();
      }
      watch(domain, (cname) => {
        putObject("CNAME", cname, "text/plain").catch((error: unknown) => {
          window.console.error(error);
        });
      });
    })().catch((error: unknown) => {
      window.console.error(error);
    });
    const [localManifest, serverManifest] = (
      (await Promise.all([
        (await fetch("runtime/.vite/manifest.json")).json(),
        Promise.resolve(
          JSON.parse(
            (await getObjectText(".vite/manifest.json", cache)) || "{}",
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
    if (localManifest && serverManifest) {
      const files = [vue, "robots.txt", "fonts.json"];
      (
        await Promise.allSettled(files.map((file) => headObject(file, cache)))
      ).forEach(({ status }, index) => {
        if (status === "rejected" && files[index])
          localManifest.add(files[index]);
      });
      [...serverManifest]
        .filter((x) => !localManifest.has(x))
        .forEach((element) => {
          deleteObject(element).catch((error: unknown) => {
            window.console.error(error);
          });
        });
      [...localManifest.add(".vite/manifest.json")]
        .filter((x) => !serverManifest.has(x))
        .forEach((element) => {
          (async () => {
            const body = await (await fetch(`runtime/${element}`)).blob();
            putObject(
              element,
              new Uint8Array(await body.arrayBuffer()),
              body.type,
            ).catch((error: unknown) => {
              window.console.error(error);
            });
          })().catch((error: unknown) => {
            window.console.error(error);
          });
        });
    }
  } else {
    data.length = 0;
    editor.getModels().forEach((model) => {
      model.dispose();
    });
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
      putObject("index.json", JSON.stringify(value), "application/json").catch(
        (error: unknown) => {
          window.console.error(error);
        },
      );
  }, second),
  { deep },
);
export const rightDrawer = ref(false);
export const putImage = async (file: File) => {
  const { type } = file;
  const filePath = `images/${uid()}.${mime.getExtension(type) ?? ""}`;
  let message = "";
  try {
    if (mimes.includes(type))
      await putObject(filePath, new Uint8Array(await file.arrayBuffer()), type);
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
      putObject("fonts.json", JSON.stringify(value), "application/json").catch(
        (error: unknown) => {
          window.console.error(error);
        },
      );
  }),
);
watch(
  importmap,
  debounce((value, oldValue) => {
    const { imports } = value as TImportmap;
    let save = Boolean(oldValue);
    if (imports.vue !== `./${vue}`) {
      imports.vue = `./${vue}`;
      save = true;
    }
    if (save)
      putObject(
        "index.importmap",
        JSON.stringify({ imports }),
        "application/importmap+json",
      ).catch((error: unknown) => {
        window.console.error(error);
      });
  }),
  { deep },
);
watch(
  [pages, domain],
  debounce((arr) => {
    const [page, cname] = arr as [TPage[], string];
    if (cname) {
      const url = page
        .filter(({ enabled, path }) => enabled && path !== null)
        .map(({ changefreq, lastmod, priority, to }) => {
          const loc = `https://${cname}${to === "/" ? "" : encodeURI(to ?? "")}`;
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
        toXML({ "?": 'xml version="1.0" encoding="UTF-8"', urlset }),
        "application/xml",
      ).catch((error: unknown) => {
        window.console.error(error);
      });
    }
  }, second),
  { deep },
);
(async () => {
  const oldPages: Record<string, null | string | undefined>[] = [];
  const index = await (await fetch("runtime/index.html")).text();
  watch(
    [pages, importmap, domain],
    debounce((arr) => {
      const [page, imap, cname] = arr as [TPage[], TImportmap, string];
      const promises: Promise<void>[] = [];
      oldPages.forEach(({ loc, path }) => {
        if (loc && !page.find((value) => value.loc === loc))
          promises.push(deleteObject(`${loc}/index.html`));
        if (!page.find((value) => value.path === path))
          promises.push(
            deleteObject(path ? `${path}/index.html` : "index.html"),
          );
      });
      (async () => {
        await Promise.allSettled(promises);
        await removeEmptyDirectories();
      })().catch((error: unknown) => {
        window.console.error(error);
      });
      const body = index
        .replace(
          '<script type="importmap"></script>',
          `<script type="importmap">
${JSON.stringify(imap, null, " ")}
    </script>`,
        )
        .replace(
          "</head>",
          `  ${Object.values(imap.imports)
            .filter((href) => !href.endsWith("/"))
            .map(
              (href) => `<link rel="modulepreload" crossorigin href="${href}">`,
            ).join(`
    `)}
    </head>`,
        );
      oldPages.length = 0;
      page
        .filter(({ path }) => path !== null)
        .forEach(
          ({
            branch,
            description,
            images,
            keywords,
            loc,
            path,
            title,
            to,
            type,
          }) => {
            oldPages.push({ loc, path });
            const canonical =
              cname && `https://${cname}${to === "/" ? "" : (to ?? "")}`;
            const htm = body
              .replace(
                '<base href="" />',
                `<base href="${
                  Array(branch.length - 1)
                    .fill("..")
                    .join("/") || "./"
                }" />`,
              )
              .replace(
                "</head>",
                `<title>${title ?? ""}</title>
    ${canonical && `<link rel="canonical" href="${canonical.replaceAll('"', "&quot;")}">`}
    ${[
      [description ?? "", "description"],
      [keywords.join(), "keywords"],
    ]
      .filter(([content]) => content)
      .map(
        ([content, name]) =>
          content &&
          name &&
          `<meta name="${name}" content="${content.replaceAll('"', "&quot;")}">`,
      ).join(`
    `)}
    ${[
      [canonical, "url"],
      [description ?? "", "description"],
      [title, "title"],
      [type ?? "", "type"],
      ...(cname &&
        images.flatMap(({ alt, url }) => [
          [url ? `https://${cname}/${url}` : "", "image"],
          [alt ?? "", "image:alt"],
        ])),
    ]
      .filter(([content]) => content)
      .map(
        ([content, property]) =>
          content &&
          property &&
          `<meta property="og:${property}" content="${content.replaceAll('"', "&quot;")}">`,
      ).join(`
    `)}
  </head>`,
              );
            if (loc)
              putObject(`${loc}/index.html`, htm, "text/html").catch(
                (error: unknown) => {
                  window.console.error(error);
                },
              );
            putObject(
              path ? `${path}/index.html` : "index.html",
              htm,
              "text/html",
            ).catch((error: unknown) => {
              window.console.error(error);
            });
          },
        );
    }, second),
    { deep },
  );
})().catch((error: unknown) => {
  window.console.error(error);
});
