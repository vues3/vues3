<template lang="pug">
router-view(v-slot="{ Component }")
  component(:is="Component", :the)
</template>
<script setup lang="ts">
import type { MetaFlat } from "zhead";

import { useHead, useSeoMeta } from "@unhead/vue";
import { fetchIcon, pages } from "app/src/stores/data";
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
const favicon = ref();
const key = "icon";
const link = [
  [favicon, "icon", key],
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
watch(a, async (value) => {
  favicon.value = (await fetchIcon(value?.icon)) ?? "/favicon.ico";
});
</script>
