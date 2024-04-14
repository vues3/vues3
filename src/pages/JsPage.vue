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
      v-source-code.col(
        v-if="$.script !== undefined",
        v-model="$.script",
        lang="javascript"
      )
    q-tab-panel.column(name="js")
      v-interactive-tree(
        v-if="$.js !== undefined",
        v-model:selected="config.js.selected",
        type="url",
        :list="$.js"
      )
</template>
<script setup lang="ts">
import { storeToRefs } from "pinia";

import VInteractiveTree from "@/components/VInteractiveTree.vue";
import VSourceCode from "@/components/VSourceCode.vue";
import app from "@/stores/app";
import data from "~/monolit/src/stores/data";

const { config, rightDrawer } = storeToRefs(app());

const { $ } = data();

rightDrawer.value = null;
</script>
