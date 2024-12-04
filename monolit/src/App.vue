<template lang="pug">
router-view(v-slot="{ Component }")
  component(:id="pages[0].id", :is="Component")
</template>
<script setup lang="ts">
import type { MetaFlat } from "zhead";

import { getIcon, iconExists, loadIcon } from "@iconify/vue";
import { useHead, useSeoMeta } from "@unhead/vue";
import { pages } from "@vues3/shared";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const a = computed(() => pages.value.find(({ id }) => id === route.name));
const canonical = computed(() =>
  a.value?.to === undefined
    ? undefined
    : `${window.location.origin}${a.value.to === "/" ? "" : a.value.to}`,
);
const ogImage = () =>
  a.value?.images
    .filter(({ url }) => url)
    .map(({ alt, url }) => ({
      alt,
      url: url ? `${window.location.origin}/${url}` : "",
    }));
const favicon = ref();
const link = [
  [favicon, "icon", "icon"],
  [canonical, "canonical"],
].map(([href, rel, key]) => ({ href, key, rel }));
useHead({ link });
const title = () => a.value?.title ?? "";
const ogTitle = () => a.value?.title;
const description = () => a.value?.description;
const ogDescription = () => a.value?.description;
const ogType = () => a.value?.type as MetaFlat["ogType"];
const ogUrl = canonical;
const keywords = () => a.value?.keywords.join();
useSeoMeta({
  description,
  keywords,
  ogDescription,
  ogImage,
  ogTitle,
  ogType,
  ogUrl,
  title,
});
watch(a, async (value) => {
  let href = "/favicon.ico";
  if (value?.icon) {
    const icon = iconExists(value.icon)
      ? getIcon(value.icon)
      : await loadIcon(value.icon);
    if (icon) {
      const { body, height, left, top, width } = icon;
      href = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left.toString()} ${top.toString()} ${width.toString()} ${height.toString()}">${body}</svg>`;
    }
  }
  favicon.value = href;
});
</script>
