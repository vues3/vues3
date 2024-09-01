<template lang="pug">
router-view(v-slot="{ Component }")
  component(:is="Component", :the)
</template>
<script setup lang="ts">
import type { MetaFlat } from "zhead";

import { getIcon, iconExists, loadIcon } from "@iconify/vue";
import { useHead, useSeoMeta } from "@unhead/vue";
import { pages } from "app/src/stores/data";
import { immediate } from "app/src/stores/defaults";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const the = computed(() => pages.value[0]);
const a = computed(() => pages.value.find(({ id }) => id === route.name));
const canonical = computed(() =>
  a.value?.to === undefined
    ? undefined
    : `${window.location.origin}${a.value.to === "/" ? "" : a.value.to}`,
);

const ogImage = () =>
  a.value?.images.map(({ alt, url }) => ({
    alt,
    url: url ? `${window.location.origin}${url}` : "",
  }));
const favicon = ref("");
const link = [
  [favicon, "icon"],
  [canonical, "canonical"],
].map(([href, rel]) => ({ href, rel }));
useHead({ link });
const title = () => a.value?.title ?? "";
const ogTitle = () => a.value?.title ?? "";
const description = () => a.value?.description ?? "";
const ogDescription = () => a.value?.description ?? "";
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
watch(
  a,
  async (value) => {
    const name = value?.icon ?? "mdi:web";
    let icon = null;
    try {
      icon = iconExists(name) ? getIcon(name) : await loadIcon(name);
    } catch (error) {
      icon = getIcon("mdi:web");
    } finally {
      if (icon) {
        const { body, height, left, top, width } = icon;
        favicon.value = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left.toString()} ${top.toString()} ${width.toString()} ${height.toString()}">${body}</svg>`;
      }
    }
  },
  { immediate },
);
</script>
