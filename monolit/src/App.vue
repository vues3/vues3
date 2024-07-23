<template lang="pug">
Head
  title {{ a?.title || " " }}
  meta(:content="a?.description", name="description", v-if="a?.description")
  meta(:content="a.title", property="og:title", v-if="a?.title")
  meta(:content="a.type", property="og:type", v-if="a?.type")
  meta(:content="canonical", property="og:url", v-if="canonical")
  meta(:content="image", property="og:image", v-if="image")
  meta(:content="a.alt[0]", property="og:image:alt", v-if="a?.alt[0]")
  // eslint-disable-next-line sonarjs/no-vue-bypass-sanitization
  link(:href="favicon", :key, rel="icon", type="image/svg+xml")
  // eslint-disable-next-line sonarjs/no-vue-bypass-sanitization
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
router-view(v-slot="{ Component }")
  component(:is="Component", :the)
</template>
<script setup lang="ts">
import { getIcon, iconExists, loadIcon } from "@iconify/vue";
import { data, views } from "app/src/stores/data";
import uuid from "uuid-random";
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const the = computed(() => views.value[0]);
const a = computed(() => views.value.find(({ id }) => id === route.name));
const drawer = ref(false);
const canonical = computed(
  () =>
    typeof a.value?.to === "string" && `${window.location.origin}${a.value.to}`,
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
  } catch (err) {
    const { message } = err as Error;
    window.console.log(message);
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
