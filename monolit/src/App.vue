<template lang="pug">
Head
  title {{ the?.title || " " }}
  meta(
    :content="the?.description",
    name="description",
    v-if="the?.description"
  )
  meta(:content="the.title", property="og:title", v-if="the?.title")
  meta(:content="the.type", property="og:type", v-if="the?.type")
  meta(:content="canonical", property="og:url", v-if="canonical")
  meta(:content="image", property="og:image", v-if="image")
  meta(:content="the.alt[0]", property="og:image:alt", v-if="the?.alt[0]")
  link(:href="favicon", :key, rel="icon", type="image/svg+xml")
  link(:href="canonical", rel="canonical", v-if="canonical")
  meta(
    :content="settings?.yandex",
    name="yandex-verification",
    v-if="settings?.yandex"
  )
  meta(
    :content="settings?.google",
    name="google-site-verification",
    v-if="settings?.google"
  )
div(:class="a.class", :id, v-if="a && a.enabled")
  component(:a, :is="root", :the, un-cloak, v-cloak)
</template>
<script setup lang="ts">
import { getIcon, iconExists, loadIcon } from "@iconify/vue";
import { settings, views } from "app/src/stores/data";
import uuid from "uuid-random";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getAsyncComponent } from "./stores/monolit";

const route = useRoute();
const router = useRouter();
const a = computed(() => (views.value.length ? views.value[0] : undefined));
const root = computed(() => a.value && getAsyncComponent(a.value));
const the = computed(() => views.value.find(({ id }) => id === route.name));
const id = computed(() => a.value?.id);
const drawer = ref(false);
const canonical = computed(
  () =>
    typeof the.value?.url === "string" &&
    `${window.location.origin}/${the.value.url}`,
);
const image = computed(
  () =>
    typeof the.value?.image[0] === "string" &&
    `${window.location.origin}/${the.value.image[0]}`,
);
router.beforeEach(() => {
  drawer.value = false;
});
const key = uuid();
const favicon = ref("");
watch(the, async (value) => {
  const name = value?.icon ?? "mdi:web";
  let icon = null;
  try {
    icon = iconExists(name) ? getIcon(name) : await loadIcon(name);
  } catch (e) {
    icon = getIcon("mdi:web");
  } finally {
    if (icon) {
      const { body, height, left, top, width } = icon;
      favicon.value = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left.toString()} ${top.toString()} ${width.toString()} ${height.toString()}">${body}</svg>`;
    }
  }
});
if (!iconExists("mdi:web")) loadIcon("mdi:web").catch(() => {});
</script>
