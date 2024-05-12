<template lang="pug">
v-head
  title {{ the?.name || " " }}
  link(
    :href="a.url",
    :key="a.id",
    crossorigin="",
    rel="stylesheet",
    v-for="a in theCSS"
  )
  component(
    :is="'script'",
    :key="a.id",
    :src="a.url",
    crossorigin="",
    deffer,
    v-for="a in theJS"
  )
  meta(
    :content="the?.description",
    name="description",
    v-if="the?.description"
  )
  meta(:content="the?.name", property="og:title", v-if="the?.name")
  meta(:content="the?.type", property="og:type", v-if="the?.type")
  meta(:content="canonical", property="og:url", v-if="canonical")
  meta(:content="the?.img", property="og:image", v-if="the?.img")
  meta(:content="the?.alt", property="og:image:alt", v-if="the?.alt")
  link(
    :href="`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='${mdi[the?.favicon ?? 'mdiWeb']}'/></svg>`",
    :key="favicon",
    rel="icon",
    type="image/svg+xml"
  )
  link(:href="canonical", rel="canonical", v-if="canonical")
  component(:is="'style'", v-if="$?.style") {{ $.style }}
  component(:is="'script'", v-if="$?.script") {{ $.script }}
  meta(
    :content="$.settings?.yandex",
    name="yandex-verification",
    v-if="$?.settings?.yandex"
  )
  meta(
    :content="$.settings?.google",
    name="google-site-verification",
    v-if="$?.settings?.google"
  )
Suspense
  component(:is="root", :the="views[0]")
</template>
<script setup lang="ts">
import type { TResource } from "app/src/stores/data";

import * as mdi from "@mdi/js";
import { $, views } from "app/src/stores/data";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { favicon, getAsyncComponent } from "./stores/monolit";

const route = useRoute();
const router = useRouter();
const root = computed(() =>
  views.value.length ? getAsyncComponent(views.value[0]) : undefined,
);
const the = computed(() => views.value.find(({ id }) => id === route.name));
const drawer = ref(false);
const canonical = computed(
  () =>
    the.value?.url.constructor === String &&
    `${window.location.origin}/${the.value.url}`,
);
const alive = ({ enabled, url }: TResource) => !!(enabled && url);
const theJS = computed(() => $.value?.js.filter(alive) ?? []);
const theCSS = computed(() => $.value?.css.filter(alive) ?? []);
router.beforeEach(() => {
  drawer.value = false;
});
</script>
