import type { SFCDescriptor } from "@vue/compiler-sfc";
import type { TImportmap, TPage } from "@vues3/shared";
import type { Ref } from "vue";

import {
  atlas,
  consoleError,
  deep,
  importmap,
  nodes,
  pages,
} from "@vues3/shared";
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
import toString from "vue-sfc-descriptor-to-string";
import { parse } from "vue/compiler-sfc";

/* -------------------------------------------------------------------------- */

type TAppPage = TPage & {
  contenteditable: boolean;
  html: Promise<string> | string;
  sfc: Promise<editor.ITextModel>;
};

/* -------------------------------------------------------------------------- */

const deleted: Ref<TPage | undefined> = ref(),
  domain = ref(""),
  fonts = reactive([]),
  parser = new DOMParser(),
  prevImages: string[] = [],
  rightDrawer = ref(false),
  routerLink = "router-link",
  selected: Ref<string | undefined> = ref(),
  the = computed(
    () =>
      (atlas[selected.value ?? ""] ?? pages.value[0]) as TAppPage | undefined,
  ),
  urls = reactive(new Map<string, string>()),
  vue = `assets/vue.esm-browser.prod-${version}.js`;

/* -------------------------------------------------------------------------- */

let descriptor: SFCDescriptor | undefined;

/* -------------------------------------------------------------------------- */

function cleaner(value: TAppPage[]) {
  value.forEach((page) => {
    const { children, id, images } = page;
    if (children.length) cleaner(children as TAppPage[]);
    images.forEach(({ url }) => {
      deleteObject(url).catch(consoleError);
    });
    if (id) deleteObject(`pages/${id}.vue`).catch(consoleError);
  });
}

function getContent(model: editor.ITextModel) {
  const filename = `${selected.value ?? "anonymous"}.vue`;
  ({ descriptor } = parse(model.getValue(), { filename }));
  const { template } = descriptor;
  const { content } = template ?? {};
  return content ?? "";
}

function getDocument(value: string) {
  return parser.parseFromString(
    `<head><base href="//"></head><body>${value}</body>`,
    "text/html",
  );
}

/* -------------------------------------------------------------------------- */

const html = {
    async get(this: TAppPage) {
      const doc: Document = getDocument(getContent(await this.sfc));
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
  sfc = {
    async get(this: TAppPage) {
      if (this.id) {
        const uri = Uri.parse(`file:///${this.id}.vue`);
        let model = editor.getModel(uri);
        if (!model) {
          const value = await getObjectText(`pages/${this.id}.vue`, cache);
          model = editor.getModel(uri);
          if (!model) {
            model = editor.createModel(value, "vue", uri);
            model.onDidChangeContent(
              debounce(() => {
                if (model && this.id)
                  putObject(
                    `pages/${this.id}.vue`,
                    model.getValue(),
                    "text/html",
                  ).catch(consoleError);
              }, second),
            );
            if (!value)
              model.setValue(`<template></template>
`);
          }
        }
        return model;
      }
      return undefined;
    },
  };

/* -------------------------------------------------------------------------- */

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
  { deep },
);

watch(pages, (objects) => {
  const value = false,
    contenteditable = { value, writable };
  objects.forEach((object) => {
    Object.defineProperties(object, {
      contenteditable,
      html,
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
  { deep },
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
    if (imports.vue !== `./${vue}`) {
      imports.vue = `./${vue}`;
      save = true;
    }
    if (save)
      putObject(
        "index.importmap",
        JSON.stringify({ imports }),
        "application/importmap+json",
      ).catch(consoleError);
  }),
  { deep },
);

watch(
  [pages, domain],
  debounce((arr) => {
    const [page, cname] = arr as [TPage[], string];
    if (cname) {
      const url = page
          .filter(({ enabled, path }) => enabled && path !== undefined)
          .map(({ changefreq, lastmod, priority, to }) => {
            const loc = `https://${cname}${to === "/" ? "" : encodeURI(to ?? "")}`;
            return {
              ...(changefreq && { changefreq }),
              ...(lastmod && { lastmod }),
              ...(priority && { priority }),
              loc,
            };
          }),
        urlset = {
          "@xmlns": "https://www.sitemaps.org/schemas/sitemap/0.9",
          url,
        };
      putObject(
        "sitemap.xml",
        toXML({ "?": 'xml version="1.0" encoding="UTF-8"', urlset }),
        "application/xml",
      ).catch(consoleError);
    }
  }, second),
  { deep },
);

(async () => {
  const index = await (await fetch("runtime/index.html")).text(),
    oldPages: Record<string, null | string | undefined>[] = [];
  watch(
    [pages, importmap, domain],
    debounce(async (arr) => {
      const [page, imap, cname] = arr as [TPage[], TImportmap, string],
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
        .filter(({ path }) => path !== undefined)
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
                cname && `https://${cname}${to === "/" ? "" : (to ?? "")}`,
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
      ...(cname
        ? images.flatMap(({ alt, url }) => [
            [url ? `https://${cname}/${url}` : "", "image"],
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
  </head>`,
                );
            if (loc)
              putObject(`${loc}/index.html`, htm, "text/html").catch(
                consoleError,
              );
            putObject(
              path ? `${path}/index.html` : "index.html",
              htm,
              "text/html",
            ).catch(consoleError);
          },
        );
    }, second),
    { deep },
  );
})().catch(consoleError);

/* -------------------------------------------------------------------------- */

export type { TAppPage };

export { deleted, domain, fonts, rightDrawer, selected, the, urls };
