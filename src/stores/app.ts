import type { SFCDescriptor } from "@vue/compiler-sfc";
import type { TImportmap, TPage } from "@vues3/shared";

import { data, deep, importmap, pages } from "@vues3/shared";
import mimes from "assets/mimes.json";
import mime from "mime";
import { editor, Uri } from "monaco-editor";
import { debounce, uid } from "quasar";
import { cache, second, writable } from "stores/defaults";
import {
  bucket,
  deleteObject,
  domain,
  getObjectBlob,
  getObjectText,
  headObject,
  putObject,
} from "stores/io";
import { toXML } from "to-xml";
import { computed, reactive, ref, version, watch } from "vue";
import toString from "vue-sfc-descriptor-to-string";
import { parse } from "vue/compiler-sfc";

export type TAppPage = TPage & {
  contenteditable: boolean;
  html: Promise<string> | string;
  sfc: Promise<editor.ITextModel>;
};

const parser = new DOMParser();
export const selected = ref();
export const the = computed(
  () =>
    (pages.value.find(({ id }) => id === selected.value) ??
      pages.value[0]) as TAppPage,
);
export const urls = reactive(new Map<string, string>());
const routerLink = "router-link";
let sfcDescriptor: SFCDescriptor | undefined;
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
          model.onDidChangeContent(
            debounce(() => {
              if (this.id)
                putObject(
                  `pages/${this.id}.vue`,
                  model?.getValue() ?? "",
                  "text/html",
                ).catch(() => {});
            }, second),
          );
        }
      }
      return model;
    }
    return undefined;
  },
};
const html = {
  async get(this: TAppPage) {
    const { descriptor } = parse((await this.sfc).getValue());
    sfcDescriptor = descriptor;
    const { template } = descriptor;
    if (template) {
      const { content } = template;
      const doc = parser.parseFromString(
        `<head><base href="//"></head><body>${content}</body>`,
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
          [...doc.images].map((image) => {
            const src = image.getAttribute("src");
            return src && !urls.has(src) ? getObjectBlob(src) : undefined;
          }),
        )
      ).forEach((image, index) => {
        const src = doc.images[index].getAttribute("src") ?? "";
        if (image?.size) urls.set(src, URL.createObjectURL(image));
        const url = urls.get(src);
        if (url) {
          doc.images[index].setAttribute("data-src", src);
          doc.images[index].setAttribute("src", url);
        }
      });
      return doc.body.innerHTML;
    }
    return "";
  },
  async set(this: TAppPage, value: string) {
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
    if (sfcDescriptor) {
      if (sfcDescriptor.template)
        sfcDescriptor.template.content = doc.body.innerHTML;
      (await this.sfc).setValue(
        `${
          sfcDescriptor.template
            ? ""
            : `<template>${doc.body.innerHTML}</template>
`
        }${(toString as (sfcDescriptor: SFCDescriptor) => string)(sfcDescriptor)}`,
      );
    }
  },
};
{
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
    })().catch(() => {});
    (async () => {
      fonts.length = 0;
      fonts.push(
        ...(JSON.parse(
          (await getObjectText("fonts.json", cache)) || "[]",
        ) as never[]),
      );
    })().catch(() => {});
    (async () => {
      const { imports } = JSON.parse(
        (await getObjectText("index.importmap", cache)) || "{}",
      ) as TImportmap;
      importmap.imports = imports;
    })().catch(() => {});
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
    const files = [vue, "robots.txt", "fonts.json"];
    (
      await Promise.allSettled(files.map((file) => headObject(file, cache)))
    ).forEach(({ status }, index) => {
      if (status === "rejected") localManifest.add(files[index]);
    });
    [...serverManifest]
      .filter((x) => !localManifest.has(x))
      .forEach((element) => {
        deleteObject(element).catch(() => {});
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
          ).catch(() => {});
        })().catch(() => {});
      });
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
        () => {},
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
        () => {},
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
        toXML({ "?": 'xml version="1.0" encoding="UTF-8"', urlset }),
        "application/xml",
      ).catch(() => {});
    }
  }, second),
  { deep },
);
(async () => {
  const index = await (await fetch("runtime/index.html")).text();
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
          `  ${Object.values(imap.imports)
            .filter((href) => !href.endsWith("/"))
            .map(
              (href) => `<link rel="modulepreload" crossorigin href="${href}">`,
            ).join(`
    `)}
    </head>`,
        );
      page.forEach(
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
          const canonical =
            domain.value && `https://${domain.value}${to === "/" ? "" : to}`;
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
              `<title>${title}</title>
    ${canonical && `<link rel="canonical" href="${canonical.replaceAll('"', "&quot;")}">`}
    ${[
      [description ?? "", "description"],
      [keywords.join(), "keywords"],
    ]
      .filter(([content]) => content)
      .map(
        ([content, name]) =>
          `<meta name="${name}" content="${content.replaceAll('"', "&quot;")}">`,
      ).join(`
    `)}
    ${[
      [canonical, "url"],
      [description ?? "", "description"],
      [title, "title"],
      [type ?? "", "type"],
      ...(domain.value &&
        images.flatMap(({ alt, url }) => [
          [url ? `https://${domain.value}/${url}` : "", "image"],
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
            putObject(`${loc}/index.html`, htm, "text/html").catch(() => {});
          putObject(
            path ? `${path}/index.html` : "index.html",
            htm,
            "text/html",
          ).catch(() => {});
        },
      );
    }, second),
    { deep },
  );
})().catch(() => {});
