import type { SFCDescriptor } from "@vue/compiler-sfc";
import type { TImportmap, TPage } from "@vuebro/shared";
import type { Reactive, Ref } from "vue";

import { atlas, consoleError, importmap, nodes, pages } from "@vuebro/shared";
import { editor, Uri } from "monaco-editor";
import { debounce } from "quasar";
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
import { version as routerVersion } from "vue-router/package.json";
import toString from "vue-sfc-descriptor-to-string";
import { parse } from "vue/compiler-sfc";

type TAppPage = TPage & {
  contenteditable: boolean;
  html: Promise<string> | string;
  jsonld: Promise<editor.ITextModel>;
  sfc: Promise<editor.ITextModel>;
};

const deleted: Ref<TPage | undefined> = ref(),
  domain = ref(""),
  external = Object.fromEntries(
    Object.entries({
      vue: version,
      "vue-router": routerVersion,
    }).map(([key, value]) => [
      key,
      `assets/${key}.esm-browser.prod-${value}.js`,
    ]),
  ),
  fonts: Reactive<string[]> = reactive([]),
  initJsonLD = `{
    "@context": "https://schema.org"
}`,
  parser = new DOMParser(),
  prevImages: string[] = [],
  putPage = (async () => {
    let body: string;

    const index = await (await fetch("runtime/index.html")).text(),
      oldPages: Record<string, null | string | undefined>[] = [],
      putPage = async ({
        branch,
        description,
        images,
        jsonld,
        keywords,
        loc,
        path,
        title,
        to,
        type,
      }: TAppPage) => {
        let value;
        try {
          value = JSON.stringify(
            JSON.parse((await jsonld).getValue()),
            null,
            1,
          );
        } catch {
          value = JSON.stringify(JSON.parse(initJsonLD), null, 1);
        }
        const canonical =
            domain.value &&
            `https://${domain.value}${to === "/" ? "" : (to ?? "")}`,
          htm = body
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
              `  <title>${title ?? ""}</title>
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
      ...(domain.value
        ? images.flatMap(({ alt, url }) => [
            [url ? `https://${domain.value}/${url}` : "", "image"],
            [alt ?? "", "image:alt"],
          ])
        : []),
    ]
      .filter(([content]) => content)
      .map(
        ([content, property]) =>
          content &&
          property &&
          `<meta property="og:${property}" content="${content.replaceAll('"', "&quot;")}">`,
      ).join(`
    `)}
    ${
      value &&
      `<script type="application/ld+json" id="application/ld+json">
${value}
    </script>`
    }
  </head>`,
            );
        if (loc)
          putObject(`${loc}/index.html`, htm, "text/html").catch(consoleError);
        putObject(
          path ? `${path}/index.html` : "index.html",
          htm,
          "text/html",
        ).catch(consoleError);
      };

    watch(
      [pages, importmap, domain],
      debounce(async (arr) => {
        const [page, imap] = arr as [TPage[], TImportmap, string],
          promises: Promise<void>[] = [];
        oldPages.forEach(({ loc, path }) => {
          if (loc && !page.find((value) => value.loc === loc))
            promises.push(deleteObject(`${loc}/index.html`));
          if (!page.find((value) => value.path === path))
            promises.push(
              deleteObject(path ? `${path}/index.html` : "index.html"),
            );
        });
        await Promise.allSettled(promises);
        await removeEmptyDirectories();
        body = index
          .replace(
            '<base href="" />',
            `<base href="" />
    <script type="importmap">
${JSON.stringify(imap, null, 1)}
    </script>`,
          )
          .replace(
            "</head>",
            `  ${Object.values(imap.imports)
              .filter((href) => !href.endsWith("/"))
              .map(
                (href) =>
                  `<link rel="modulepreload" crossorigin href="${href}">`,
              ).join(`
    `)}
  </head>`,
          );
        oldPages.length = 0;
        (page as TAppPage[])
          .filter(({ path }) => path !== undefined)
          .forEach((value) => {
            const { loc, path } = value;
            oldPages.push({ loc, path });
            void putPage(value);
          });
      }, second),
      { deep: true },
    );

    return putPage;
  })(),
  rightDrawer = ref(false),
  routerLink = "router-link",
  selected: Ref<string | undefined> = ref(),
  the = computed(
    () =>
      (atlas[selected.value ?? ""] ?? pages.value[0]) as TAppPage | undefined,
  ),
  urls = reactive(new Map<string, string>());

let descriptor: SFCDescriptor | undefined;

const cleaner = (value: TAppPage[]) => {
    value.forEach((page) => {
      const { children, id, images } = page;
      if (children.length) cleaner(children as TAppPage[]);
      images.forEach(({ url }) => {
        void deleteObject(url);
      });
      if (id) {
        void deleteObject(`pages/${id}.vue`);
        void deleteObject(`pages/${id}.jsonld`);
      }
    });
  },
  getDocument = (value: string) =>
    parser.parseFromString(
      `<head><base href="//"></head><body>${value}</body>`,
      "text/html",
    ),
  getModel = async (
    id: string,
    ext: string,
    language: string,
    mime: string,
    init: string,
  ) => {
    const uri = Uri.parse(`file:///${id}.${language}`);
    let model = editor.getModel(uri);
    if (!model) {
      const value = (await getObjectText(`pages/${id}.${ext}`, cache)) || init;
      model = editor.getModel(uri);
      if (!model) {
        model = editor.createModel(value, language, uri);
        model.onDidChangeContent(
          debounce(async () => {
            if (model && id) {
              putObject(`pages/${id}.${ext}`, model.getValue(), mime).catch(
                consoleError,
              );
              if (language === "json" && atlas[id])
                void (await putPage)(atlas[id] as TAppPage);
            }
          }, second),
        );
      }
    }
    return model;
  },
  html = {
    async get(this: TAppPage) {
      const filename = `${selected.value ?? "anonymous"}.vue`;
      ({ descriptor } = parse((await this.sfc).getValue(), { filename }));
      const { template } = descriptor;
      const { content } = template ?? {};
      const doc = getDocument(content ?? "");
      doc.querySelectorAll(routerLink).forEach((link) => {
        const a = document.createElement("a");
        a.innerHTML = link.innerHTML;
        a.setAttribute(`data-${routerLink}`, "true");
        [...link.attributes].forEach((attr) => {
          if (attr.nodeName === "to")
            a.setAttribute("href", attr.nodeValue ?? "");
          else a.setAttributeNode(attr.cloneNode() as Attr);
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
      const doc = getDocument(value),
        sfc: editor.ITextModel = await this.sfc;
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
              if (attr.nodeName === "href")
                link.setAttribute("to", attr.nodeValue ?? "");
              else link.setAttributeNode(attr.cloneNode() as Attr);
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
  },
  jsonld = {
    get(this: TAppPage) {
      return this.id
        ? getModel(this.id, "jsonld", "json", "application/ld+json", initJsonLD)
        : undefined;
    },
  },
  sfc = {
    get(this: TAppPage) {
      return this.id
        ? getModel(this.id, "vue", "vue", "text/html", "<template></template>")
        : undefined;
    },
  };

watch(deleted, (value) => {
  if (value) cleaner([value as TAppPage]);
});

watch(
  the,
  (value, oldValue) => {
    const images = value?.images.map(({ url = "" }) => url);
    if (images) {
      if (value?.id === oldValue?.id) {
        prevImages
          .filter((url) => !images.includes(url))
          .forEach((url) => {
            URL.revokeObjectURL(urls.get(url) ?? "");
            urls.delete(url);
            deleteObject(url).catch(consoleError);
          });
      }
      prevImages.length = 0;
      prevImages.push(...images);
    }
  },
  { deep: true },
);

watch(pages, (objects) => {
  const value = false,
    contenteditable = { value, writable };
  objects.forEach((object) => {
    Object.defineProperties(object, {
      contenteditable,
      html,
      jsonld,
      sfc,
    });
  });
});

watch(bucket, async (value) => {
  if (value) {
    (async () => {
      nodes.push(
        (
          JSON.parse(
            (await getObjectText("index.json", cache)) || "[{}]",
          ) as TPage[]
        )[0] ?? ({} as TPage),
      );
    })().catch(consoleError);
    (async () => {
      fonts.length = 0;
      fonts.push(
        ...(JSON.parse(
          (await getObjectText("fonts.json", cache)) || "[]",
        ) as never[]),
      );
    })().catch(consoleError);
    (async () => {
      const { imports } = JSON.parse(
        (await getObjectText("index.importmap", cache)) || "{}",
      ) as TImportmap;
      importmap.imports = imports;
    })().catch(consoleError);
    (async () => {
      {
        const [cname = ""] = (await getObjectText("CNAME", cache)).split(
          "\n",
          1,
        );
        domain.value = cname.trim();
      }
      watch(domain, (cname) => {
        putObject("CNAME", cname, "text/plain").catch(consoleError);
      });
    })().catch(consoleError);
    const [localManifest, serverManifest] = (
      (await Promise.all([
        (await fetch("runtime/.vite/manifest.json")).json(),
        Promise.resolve(
          JSON.parse(
            (await getObjectText(".vite/manifest.json", cache)) || "{}",
          ),
        ),
      ])) as Record<string, Record<string, string[]> | undefined>[]
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
      const files = [...Object.values(external), "robots.txt", "fonts.json"];
      (
        await Promise.allSettled(files.map((file) => headObject(file, cache)))
      ).forEach(({ status }, index) => {
        if (status === "rejected" && files[index])
          localManifest.add(files[index]);
      });
      [...serverManifest]
        .filter((x) => !localManifest.has(x))
        .forEach((element) => {
          deleteObject(element).catch(consoleError);
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
            ).catch(consoleError);
          })().catch(consoleError);
        });
    }
  } else {
    nodes.length = 0;
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
  nodes,
  debounce((value) => {
    if (value)
      putObject("index.json", JSON.stringify(value), "application/json").catch(
        consoleError,
      );
  }, second),
  { deep: true },
);

watch(
  fonts,
  debounce((value, oldValue) => {
    if (oldValue)
      putObject("fonts.json", JSON.stringify(value), "application/json").catch(
        consoleError,
      );
  }),
);

watch(
  importmap,
  debounce((value, oldValue) => {
    const { imports } = value as TImportmap;
    let save = Boolean(oldValue);
    Object.entries(external).forEach(([key, value]) => {
      if (imports[key] !== `./${value}`) {
        imports[key] = `./${value}`;
        save = true;
      }
    });
    if (save)
      putObject(
        "index.importmap",
        JSON.stringify({ imports }),
        "application/importmap+json",
      ).catch(consoleError);
  }),
  { deep: true },
);

watch(
  [pages, domain],
  debounce((arr) => {
    const [page, cname] = arr as [TPage[], string];
    if (cname) {
      putObject(
        "sitemap.xml",
        toXML({
          "?": 'xml version="1.0" encoding="UTF-8"',
          urlset: {
            "@xmlns": "https://www.sitemaps.org/schemas/sitemap/0.9",
            url: [
              ...page
                .filter(({ enabled, path }) => enabled && path !== undefined)
                .map(({ changefreq, lastmod, priority, to }) => ({
                  ...(changefreq && { changefreq }),
                  ...(lastmod && { lastmod }),
                  ...(priority && { priority }),
                  loc: `https://${cname}${to === "/" ? "" : encodeURI(to ?? "")}`,
                })),
              ...page
                .filter(({ enabled, loc }) => enabled && loc)
                .map(({ changefreq, lastmod, loc, priority }) => ({
                  ...(changefreq && { changefreq }),
                  ...(lastmod && { lastmod }),
                  ...(priority && { priority }),
                  loc: `https://${cname}${encodeURI(loc?.replace(/^\/?/, "/").replace(/\/?$/, "/") ?? "")}`,
                })),
            ],
          },
        }),
        "application/xml",
      ).catch(consoleError);
    }
  }, second),
  { deep: true },
);

export type { TAppPage };

export { deleted, domain, fonts, rightDrawer, selected, the, urls };
