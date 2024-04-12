<template lang="pug">
q-page.column.full-height
  q-tabs.text-grey(
    v-model="config.css.tab",
    dense,
    active-color="primary",
    indicator-color="primary",
    align="justify",
    narrow-indicator
  )
    q-tab(name="style", label="Style")
    q-tab(name="css", label="CSS")
  q-separator
  q-tab-panels.full-width.col(v-model="config.css.tab")
    q-tab-panel.column(name="style")
      v-source-code.col(v-model="$.style", lang="css")
    q-tab-panel.column(name="css")
      v-interactive-tree(
        v-model:selected="config.css.selected",
        type="url",
        :list="$.css"
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
