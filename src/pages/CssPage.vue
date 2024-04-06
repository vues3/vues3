<template lang="pug">
q-page.column.full-height
  q-tabs.text-grey(
    v-model="state.css.tab",
    dense,
    active-color="primary",
    indicator-color="primary",
    align="justify",
    narrow-indicator
  )
    q-tab(name="style", label="Style")
    q-tab(name="css", label="CSS")
  q-separator
  q-tab-panels.full-width.col(v-model="state.css.tab")
    q-tab-panel.column(name="style")
      v-source-code.col(v-model="$.style", lang="css")
    q-tab-panel.column(name="css")
      v-interactive-tree(
        v-model:selected="state.css.selected",
        type="url",
        :list="$?.css"
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
  () => $?.css ?? [],
  ([{ id = "" } = {}] = []) => {
    const {
      css: { selected },
    } = get(state);
    if (!selected) get(state).css.selected = id;
  },
  { immediate: true },
);
</script>
