<template lang="pug">
div(:class="the?.class", :id, v-cloak)
  component(:is="is", :the, un-cloak, v-cloak)
</template>
<script setup lang="ts">
import type { TView } from "src/stores/types";

import { computed } from "vue";

import { getAsyncComponent, that } from "../stores/monolit";

const props = defineProps<{ the?: TView }>();
const the = computed(() => props.the ?? that.value);
const id = computed(() => the.value?.id);
const is = computed(() => the.value && getAsyncComponent(the.value));
</script>
