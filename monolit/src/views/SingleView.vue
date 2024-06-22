<template lang="pug">
div(:class="a.class", :id, role="main", v-if="a")
  component(:a, :is="is", :the, un-cloak, v-cloak)
</template>
<script setup lang="ts">
import { views } from "app/src/stores/data";
import { computed } from "vue";
import { useRoute } from "vue-router";

import { getAsyncComponent } from "../stores/monolit";

const route = useRoute();
const the = computed(() => views.value.find(({ id }) => id === route.name));
const a = computed(() =>
  route.path === "/" ? the.value?.children?.[0] : the.value,
);
const id = computed(() => a.value?.id);
const is = computed(() => a.value && getAsyncComponent(a.value));
</script>
