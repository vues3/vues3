<template lang="pug">
div(:class="the?.class", :id="the?.id", un-cloak, v-if="the?.enabled")
  component(:id="the?.id", :is, @vue:mounted="resolve(the)")
</template>
<script setup lang="ts">
import type { TPage } from "src/stores/types";

import { computed, inject, onUpdated } from "vue";

import { getAsyncComponent, resolve, that } from "../stores/monolit";

const { id } = defineProps<{ id?: string }>();
const pages: Record<string, TPage> = inject("pages")!;
const the = computed(() => (id ? pages[id as keyof object] : that.value));
const is = computed(() => the.value && getAsyncComponent(the.value));
onUpdated(() => {
  resolve(the.value);
});
</script>
