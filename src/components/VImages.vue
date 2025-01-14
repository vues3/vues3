<template lang="pug">
.q-pa-md.row.q-gutter-md.items-start
  q-card.w-full.max-w-96(
    :key="i",
    bordered,
    flat,
    v-for="(image, i) in images"
  )
    q-card-section(horizontal)
      q-img.col(:ratio="16 / 9", :src="urls.get(image.url ?? '')", fit="cover")
        .absolute-bottom
          q-input(dark, dense, v-model="image.alt")
      q-card-actions.q-px-md.justify-around(vertical)
        q-btn(@click="add(i)", flat, icon="add", round)
        q-btn(@click="remove(i)", flat, icon="remove", round)
        q-btn(@click="left(i)", flat, icon="arrow_left", round)
        q-btn(@click="right(i)", flat, icon="arrow_right", round)
        q-btn(@click="upload(i)", flat, icon="upload", round)
</template>

<script setup lang="ts">
/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { TPage } from "@vues3/shared";
import type { UseFileDialogReturn } from "@vueuse/core";
import type { QVueGlobals } from "quasar";
import type { Composer } from "vue-i18n";

import { deep } from "@vues3/shared";
import { useFileDialog } from "@vueuse/core";
import mimes from "assets/mimes.json";
import mime from "mime";
import { uid, useQuasar } from "quasar";
import { the, urls } from "stores/app";
import { accept, capture, immediate, multiple, reset } from "stores/defaults";
import { getObjectBlob, putObject } from "stores/io";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

/* -------------------------------------------------------------------------- */
/*                                   Objects                                  */
/* -------------------------------------------------------------------------- */

const $q: QVueGlobals = useQuasar();

/* -------------------------------------------------------------------------- */

const { t }: Composer = useI18n();

/* -------------------------------------------------------------------------- */

const { onChange, open }: UseFileDialogReturn = useFileDialog({
  accept,
  capture,
  multiple,
  reset,
});

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const message: string = t(
  "The graphic file type is not suitable for use on the web",
);

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */

let index = 0;

/* -------------------------------------------------------------------------- */
/*                                 References                                 */
/* -------------------------------------------------------------------------- */

const images = ref([] as TPage["images"]);

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const upload = (i: number) => {
  index = i;
  open();
};

/* -------------------------------------------------------------------------- */

const left = (i: number) => {
  if (i) {
    const prev = images.value[i - 1];
    if (images.value[i] && prev)
      [images.value[i - 1], images.value[i]] = [images.value[i], prev];
  }
};

/* -------------------------------------------------------------------------- */

const right = (i: number) => {
  if (i < images.value.length - 1) {
    const next = images.value[i + 1];
    if (images.value[i] && next)
      [images.value[i], images.value[i + 1]] = [next, images.value[i]];
  }
};

/* -------------------------------------------------------------------------- */

const add = (i: number) => {
  images.value.splice(
    i + 1,
    0,
    Object.fromEntries(["alt", "url"].map((key) => [key, ""])),
  );
};

/* -------------------------------------------------------------------------- */

const remove = (i: number) => {
  $q.dialog({
    cancel: true,
    message: t("Do you really want to delete?"),
    persistent: true,
    title: t("Confirm"),
  }).onOk(() => {
    images.value.splice(i, 1);
  });
};

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

onChange((files) => {
  const image = images.value[index];
  if (files && image) {
    const [file] = files;
    if (file) {
      const { type } = file;
      if (mimes.includes(type)) {
        const filePath = `images/${uid()}.${mime.getExtension(type) ?? ""}`;
        (async () => {
          await putObject(
            filePath,
            new Uint8Array(await file.arrayBuffer()),
            type,
          );
        })().catch((error: unknown) => {
          console.error(error);
        });
        urls.set(filePath, URL.createObjectURL(file));
        image.url = filePath;
      } else $q.notify({ message });
    }
  }
});

/* -------------------------------------------------------------------------- */

watch(
  images,
  (value) => {
    if (!value.length) add(-1);
    if (the.value) {
      the.value.images = value
        .filter(({ url }) => url)
        .map(({ alt = "", url = "" }) => ({ alt, url }));
      the.value.images
        .filter(({ url = "" }) => !urls.has(url))
        .forEach(({ url = "" }) => {
          (async () => {
            urls.set(url, URL.createObjectURL(await getObjectBlob(url)));
          })().catch((error: unknown) => {
            console.error(error);
          });
        });
    }
  },
  { deep },
);

/* -------------------------------------------------------------------------- */

watch(
  the,
  (value) => {
    if (!value?.images.length) {
      images.value.length = 0;
      add(-1);
    } else
      images.value = value.images.map(({ alt = "", url = "" }) => ({
        alt,
        url,
      }));
  },
  { immediate },
);

/* -------------------------------------------------------------------------- */
</script>
