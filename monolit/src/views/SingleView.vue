<template lang="pug">
div(:class="the?.class", :id, un-cloak, v-if="the?.enabled")
  component(:is="is", :the, @vue:mounted="() => { resolve(the); }")
</template>
<script setup lang="ts">
import type { TPage } from "src/stores/types";

import { computed } from "vue";

import { getAsyncComponent, resolve, that } from "../stores/monolit";

const props = defineProps<{ the?: TPage }>();
const the = computed(() => props.the ?? that.value);
const id = computed(() => the.value?.id);
const is = computed(() => the.value && getAsyncComponent(the.value));
</script>
