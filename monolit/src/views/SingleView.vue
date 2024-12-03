<template lang="pug">
div(:class="the?.class", :id="the?.id", un-cloak, v-if="the?.enabled")
  component(:id="the?.id", :is, @vue:mounted="() => { resolve(the); }")
</template>
<script setup lang="ts">
import type { TPage } from "@vues3/types";

import { computed, inject, onUpdated } from "vue";

import { getAsyncComponent, promises, resolve, that } from "../stores/monolit";

const { id } = defineProps<{ id?: string }>();
const pages: Record<string, TPage> | undefined = inject("pages");
const the = computed(() => (id ? pages?.[id as keyof object] : that.value));
const is = computed(() => {
  const [[key, value] = []] = promises;
  promises.clear();
  if (key) promises.set(key, value);
  return the.value && getAsyncComponent(the.value);
});
onUpdated(() => {
  if (id) resolve(the.value);
});
</script>
