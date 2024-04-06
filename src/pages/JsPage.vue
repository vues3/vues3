<template lang="pug">
q-page.column.full-height
  q-tabs.text-grey(
    v-model="state.js.tab",
    dense,
    active-color="primary",
    indicator-color="primary",
    align="justify",
    narrow-indicator
  )
    q-tab(name="script", label="Script")
    q-tab(name="js", label="JS")
  q-separator
  q-tab-panels.full-width.col(v-model="state.js.tab")
    q-tab-panel.column(name="script")
      v-source-code.col(v-model="$.script", lang="javascript")
    q-tab-panel.column(name="js")
      v-interactive-tree(
        v-model:selected="state.js.selected",
        type="url",
        :list="$?.js"
      )
</template>
<script setup>
import { get } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { watch } from "vue";

import VInteractiveTree from "@/components/VInteractiveTree.vue";
import VSourceCode from "@/components/VSourceCode.vue";
import app from "@/stores/app";
import data from "~/monolit/src/stores/data";

const { state } = storeToRefs(app());
const { $ } = data();
get(state).rightDrawer = null;
watch(
  () => $?.js ?? [],
  ([{ id = "" } = {}] = []) => {
    const {
      js: { selected },
    } = get(state);
    if (!selected) get(state).js.selected = id;
  },
  { immediate: true },
);
</script>
