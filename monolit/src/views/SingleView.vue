<template lang="pug">
div(:class="the.class", :id="the.id", role="main", v-cloak, v-if="the")
  Suspense
    component(
      :is="template",
      :the="the",
      @vue:mounted="GLightbox({ loop, zoomable, selector })"
    )
</template>
<script setup lang="ts">
import type { ComputedRef } from "vue";

import { views } from "app/src/stores/data";
import { loop, zoomable } from "app/src/stores/defaults";
import GLightbox from "glightbox";
import { computed } from "vue";
import { useRoute } from "vue-router";

import { getAsyncComponent, selector } from "../stores/monolit";

const route = useRoute();
const the = computed(
  () =>
    (route.path === "/"
      ? undefined
      : views.value.find(({ id }) => id === route.name)) ??
    views.value[0].children[0],
);
const template: ComputedRef<object | undefined> = computed(() =>
  getAsyncComponent(the.value),
);
</script>
