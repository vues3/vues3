<template lang="pug">
q-page.column.full-height
  q-tabs.text-grey(
    v-model="config.js.tab",
    dense,
    active-color="primary",
    indicator-color="primary",
    align="justify",
    narrow-indicator
  )
    q-tab(name="script", label="Script")
    q-tab(name="js", label="JS")
  q-separator
  q-tab-panels.full-width.col(v-model="config.js.tab")
    q-tab-panel.column(name="script")
      v-source-code.col(v-model="$.script", lang="javascript")
    q-tab-panel.column(name="js")
      v-interactive-tree(
        v-model:selected="config.js.selected",
        type="url",
        :list="$.js"
      )
</template>
<script setup lang="ts">
import type { RemovableRef } from "@vueuse/core";
import { useStorage } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { watch } from "vue";

import VInteractiveTree from "@/components/VInteractiveTree.vue";
import VSourceCode from "@/components/VSourceCode.vue";
import type { TConfig } from "@/stores/app";
import app from "@/stores/app";
import data from "~/monolit/src/stores/data";

const { accessKeyId, rightDrawer } = storeToRefs(app());
const { validateConfig } = app();
const { $ } = data();
rightDrawer.value = null;
const mergeDefaults = true;

const config: RemovableRef<TConfig> = useStorage(
  `config-${accessKeyId.value}`,
  {} as TConfig,
  localStorage,
  {
    mergeDefaults,
  },
);
const immediate = true;
watch(
  config,
  (value) => {
    validateConfig?.(value);
  },
  { immediate },
);
</script>
