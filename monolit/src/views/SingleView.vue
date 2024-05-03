<template lang="pug">
.flex.snap-start(:class="{ 'min-h-full': the.full }", :id="the.id", v-if="the")
  .prose.w-full.max-w-none.flex-auto.text-sm(
    :data-theme="the.theme",
    class="md:text-base lg:text-lg xl:text-xl 2xl:text-2xl",
    role="main",
    v-cloak
  )
    Suspense
      component(
        :is="template",
        :the="the",
        @vue:mounted="GLightbox({ loop, zoomable, selector })"
      )
</template>
<script setup lang="ts">
import type { TView } from "app/src/stores/data";
import type { ComputedRef } from "vue";
import type { RouteLocationNormalizedLoaded } from "vue-router";

import { views } from "app/src/stores/data";
import { loop, zoomable } from "app/src/stores/defaults";
import GLightbox from "glightbox";
import { computed } from "vue";
import { useRoute } from "vue-router";

import { getAsyncComponent, selector } from "../stores/monolit";

const route: RouteLocationNormalizedLoaded = useRoute();
const the: ComputedRef<TView | undefined> = computed(() => {
  const index: number = views.value.findIndex(({ id }) => id === route.name);
  const ret: TView = views.value[index];
  return index ? ret : ret.children[0];
});
const template: ComputedRef<object | undefined> = computed(
  () => the.value && getAsyncComponent(the.value),
);
</script>
