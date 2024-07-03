<template lang="pug">
div(:class="that.class", :id, role="main", v-if="that")
  component(:is="is", :the="that", un-cloak, v-cloak)
</template>
<script setup lang="ts">
import { computed } from "vue";

import { getAsyncComponent, that } from "../stores/monolit";

const id = computed(() => that.value?.id);
const is = computed(() => that.value && getAsyncComponent(that.value));
</script>
