<template lang="pug">
div(:class="a.class", :id, role="main", v-if="a")
  component(:a, :is="is", :the, un-cloak, v-cloak)
</template>
<script setup lang="ts">
import { computed } from "vue";

import { that as a, getAsyncComponent, the } from "../stores/monolit";

const id = computed(() => a.value?.id);
const is = computed(() => a.value && getAsyncComponent(a.value));
</script>
