<template lang="pug">
div(:class="a.class", :id, role="main", v-cloak, v-if="a")
  Suspense
    component(
      :a,
      :is,
      :the,
      @vue:mounted="GLightbox({ loop, zoomable, selector })"
    )
</template>
<script setup lang="ts">
import { views } from "app/src/stores/data";
import { loop, zoomable } from "app/src/stores/defaults";
import GLightbox from "glightbox";
import { computed } from "vue";
import { useRoute } from "vue-router";

import { getAsyncComponent, selector } from "../stores/monolit";

const route = useRoute();
const the = computed(() => views.value.find(({ id }) => id === route.name));
const a = computed(
  () =>
    (route.path === "/" ? undefined : the.value) ?? views.value[0].children[0],
);
const id = computed(() => a.value.id);
const is = computed(() => getAsyncComponent(a.value));
</script>
