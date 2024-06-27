<template lang="pug">
q-page.column.full-height
  v-interactive-tree(:list, type="url", v-model:selected="config.js.selected")
</template>
<script setup lang="ts">
import type { TConfig } from "stores/types";

import { useStorage } from "@vueuse/core";
import VInteractiveTree from "components/VInteractiveTree.vue";
import { rightDrawer } from "stores/app";
import { $ } from "stores/data";
import { mergeDefaults } from "stores/defaults";
import { bucket } from "stores/s3";
import { validateConfig } from "stores/types";
import { computed } from "vue";

const config = useStorage(
  `.${bucket.value}`,
  () => {
    const value = {} as TConfig;
    validateConfig(value);
    return value;
  },
  localStorage,
  { mergeDefaults },
);
const list = computed(() => $.value?.js);
rightDrawer.value = undefined;
</script>
