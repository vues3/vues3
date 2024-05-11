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
input#drawer.peer.hidden(type="checkbox", v-model="drawer")
.size-screen.snap-y.snap-mandatory.overflow-y-auto.scroll-smooth(
  @scroll.passive="start"
)
  Suspense
    component(
      :is="navigator",
      :ready,
      :the,
      un-cloak,
      v-if="views[0]?.enabled"
    )
  router-view
label.pointer-events-none.fixed.inset-0.bg-black.bg-opacity-0.transition-opacity(
  class="peer-checked:pointer-events-auto peer-checked:cursor-pointer peer-checked:bg-opacity-25",
  for="drawer"
)
.fixed.inset-y-0.left-0.grid.-translate-x-full.overflow-auto.scroll-smooth.transition-transform(
  :class="{ 'right-0': views[0]?.full }",
  class="peer-checked:translate-x-0",
  v-if="views[0]?.enabled"
)
  .col-start-1.row-start-1.flex
    .prose.w-full.max-w-none.flex-auto.text-sm(
      class="md:text-base lg:text-lg xl:text-xl 2xl:text-2xl"
    )
      Suspense
        component(:is="root", :the="views[0]")
  label.sticky.right-1.top-1.col-start-1.row-start-1.flex.size-12.items-center.justify-center.justify-self-end.rounded-full.border.border-neutral-500.bg-neutral-50.text-neutral-500.transition-colors(
    class="hover:border-neutral-600 hover:bg-neutral-100 hover:text-neutral-600",
    for="drawer",
    role="button",
    v-if="views[0]?.full"
  )
    svg.size-6.fill-current
      path(:d="mdi.mdiClose")
</template>
<script setup lang="ts">
import type { TResource, TView } from "app/src/stores/data";

import * as mdi from "@mdi/js";
import { useTimeout } from "@vueuse/core";
import { $, views } from "app/src/stores/data";
import { controls } from "app/src/stores/defaults";
import uuid from "uuid-random";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { favicon, getAsyncComponent } from "./stores/monolit";

const { ready, start } = useTimeout(1000, { controls });
const path = "~";
const navigator = computed(() => {
  const id = uuid();
  return getAsyncComponent({
    id,
    ...$.value?.navbar,
    path,
  } as TView);
});
const route = useRoute();
const router = useRouter();
const root = computed(() => getAsyncComponent(views.value[0]));
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
