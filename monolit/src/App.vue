<template lang="pug">
Head
  title {{ a?.title || " " }}
  meta(:content="a?.description", name="description", v-if="a?.description")
  meta(:content="a.title", property="og:title", v-if="a?.title")
  meta(:content="a.type", property="og:type", v-if="a?.type")
  meta(:content="canonical", property="og:url", v-if="canonical")
  meta(:content="image", property="og:image", v-if="image")
  meta(:content="a.alt[0]", property="og:image:alt", v-if="a?.alt[0]")
  link(:href="favicon", :key, rel="icon", type="image/svg+xml")
  link(:href="canonical", rel="canonical", v-if="canonical")
  meta(
    :content="data.settings?.yandex",
    name="yandex-verification",
    v-if="data?.settings?.yandex"
  )
  meta(
    :content="data.settings?.google",
    name="google-site-verification",
    v-if="data?.settings?.google"
  )
div(:class="the?.class", :id, v-if="route.name !== ''")
  component(:is="is", :the, un-cloak, v-cloak, v-if="the?.enabled")
not-found-view(v-else)
</template>
<script setup lang="ts">
import { getIcon, iconExists, loadIcon } from "@iconify/vue";
import NotFoundView from "app/monolit/src/views/NotFoundView.vue";
import { data, views } from "app/src/stores/data";
import uuid from "uuid-random";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getAsyncComponent } from "./stores/monolit";

const route = useRoute();
const router = useRouter();
const the = computed(() => (views.value.length ? views.value[0] : undefined));
const is = computed(() => the.value && getAsyncComponent(the.value));
const a = computed(() => views.value.find(({ id }) => id === route.name));
const id = computed(() => the.value?.id);
const drawer = ref(false);
const canonical = computed(
  () =>
    typeof a.value?.url === "string" &&
    `${window.location.origin}/${a.value.url}`,
);
const image = computed(
  () =>
    typeof a.value?.image[0] === "string" &&
    `${window.location.origin}/${a.value.image[0]}`,
);
router.beforeEach(() => {
  drawer.value = false;
});
const key = uuid();
const favicon = ref("");
watch(a, async (value) => {
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
