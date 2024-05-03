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
  meta(:content="the?.image", property="og:image", v-if="the?.image")
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
.drawer.h-dvh
  input#drawer.drawer-toggle(
    aria-labelledby="#drawer",
    type="checkbox",
    v-model="drawer"
  )
  .drawer-content.snap-y.snap-mandatory.overflow-y-auto.scroll-smooth(
    @scroll.passive="start"
  )
    .z-40(
      :class="[...(ready ? [] : $.navbar?.scroll ?? []), ...($.navbar?.classes ?? [])]",
      :data-theme="$.navbar?.theme",
      v-if="views[0]?.enabled"
    )
      .navbar
        Suspense
          component(:is="navigator", :the)
    router-view
  .drawer-side.z-50(v-if="views[0]?.enabled")
    label.drawer-overlay(for="drawer")
    .grid.max-w-full.self-stretch.overflow-x-auto.scroll-smooth(
      :class="{ 'justify-self-stretch': views[0]?.full }"
    )
      .col-start-1.row-start-1.flex
        .prose.w-full.max-w-none.flex-auto.text-sm(
          :data-theme="views[0]?.theme",
          class="md:text-base lg:text-lg xl:text-xl 2xl:text-2xl"
        )
          Suspense
            component(:is="root", :the="views[0]")
      label.btn.btn-circle.btn-ghost.sticky.right-1.top-1.col-start-1.row-start-1.justify-self-end(
        for="drawer"
      )
        svg.h-6.w-6
          path(:d="mdi.mdiClose")
</template>
<script setup lang="ts">
import type { TResource, TView } from "app/src/stores/data";
import type { ComputedRef, Ref } from "vue";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";

import * as mdi from "@mdi/js";
import { useTimeout } from "@vueuse/core";
import { $, views } from "app/src/stores/data";
import { controls } from "app/src/stores/defaults";
import { uid } from "quasar";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { favicon, getAsyncComponent } from "./stores/monolit";

const { ready, start } = useTimeout(1000, { controls });
const path: string = "~";
const navigator: ComputedRef<object> = computed(() => {
  const id: string = uid();
  return getAsyncComponent(<TView>{
    id,
    ...$.value?.navbar,
    path,
  });
});
const route: RouteLocationNormalizedLoaded = useRoute();
const router: Router = useRouter();
const root: ComputedRef<object> = computed(() =>
  getAsyncComponent(views.value[0]),
);
const the: ComputedRef<TView | undefined> = computed(() =>
  views.value.find(({ id }) => id === route.name),
);
const drawer: Ref<boolean> = ref(false);
const canonical: ComputedRef<false | string> = computed(
  () =>
    the.value?.url.constructor === String &&
    `${window.location.origin}/${the.value.url}`,
);
const alive = ({ enabled, url }: TResource): boolean => !!(enabled && url);
const theJS: ComputedRef<TResource[]> = computed(
  () => (<TResource[] | undefined>$.value?.js)?.filter(alive) ?? [],
);
const theCSS: ComputedRef<TResource[]> = computed(
  () => (<TResource[] | undefined>$.value?.css)?.filter(alive) ?? [],
);
router.beforeEach(() => {
  drawer.value = false;
});
</script>
