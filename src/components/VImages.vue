<template lang="pug">
.q-pa-md.row.q-gutter-md.items-start
  q-card.w-full.max-w-96(
    :key="image.url",
    bordered,
    flat,
    v-for="(image, i) in images"
  )
    q-card-section(horizontal)
      q-img.col(:ratio="16 / 9", :src="urls.get(image.url ?? '')", fit="cover")
        .absolute-bottom
          q-input(dark, dense, v-model="image.alt")
      q-card-actions.q-px-md.justify-around(vertical)
        q-btn(@click="() => { add(i); }", flat, icon="add", round)
        q-btn(@click="() => { remove(i); }", flat, icon="remove", round)
        q-btn(
          @click="() => { if (i) [images[i - 1], images[i]] = [images[i], images[i - 1]]; }",
          flat,
          icon="arrow_left",
          round
        )
        q-btn(
          @click="() => { if (i < images.length - 1) [images[i], images[i + 1]] = [images[i + 1], images[i]]; }",
          flat,
          icon="arrow_right",
          round
        )
        q-btn(@click="() => { upload(i); }", flat, icon="upload", round)
</template>
<script setup lang="ts">
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

const $q = useQuasar();
const { t } = useI18n();
const { onChange, open } = useFileDialog({ accept, capture, multiple, reset });
const message = t("The graphic file type is not suitable for use on the web");
const images = ref([] as Record<string, string | undefined>[]);
let index = 0;
const upload = (i: number) => {
  index = i;
  open();
};
onChange((files) => {
  if (files) {
    const [file] = files;
    const { type } = file;
    if (mimes.includes(type)) {
      const filePath = `images/${uid()}.${mime.getExtension(type) ?? ""}`;
      (async () => {
        await putObject(
          filePath,
          new Uint8Array(await file.arrayBuffer()),
          type,
        );
      })().catch(() => {});
      urls.set(filePath, URL.createObjectURL(file));
      images.value[index].url = filePath;
    } else $q.notify({ message });
  }
});
const add = (i: number) => {
  images.value.splice(
    i + 1,
    0,
    Object.fromEntries(["alt", "url"].map((key) => [key, ""])),
  );
};
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
watch(
  images,
  (value, oldValue) => {
    if (!value.length) add(-1);
    value.forEach(({ url }) => {
      if (url && !urls.has(url))
        (async () => {
          urls.set(url, URL.createObjectURL(await getObjectBlob(url)));
        })().catch(() => {});
    });
    if (oldValue.length)
      the.value.images = value
        .filter(({ url }) => url)
        .map(({ alt, url }) => ({ alt, url }));
  },
  { deep },
);
watch(
  the,
  (value) => {
    if (!value.images.length) {
      images.value.length = 0;
      add(-1);
    } else images.value = value.images.map(({ alt, url }) => ({ alt, url }));
  },
  { immediate },
);
</script>
