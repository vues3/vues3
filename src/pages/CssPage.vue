<template lang="pug">
q-page.column.full-height
  q-tabs.text-grey(
    v-model="css.tab",
    dense,
    active-color="primary",
    indicator-color="primary",
    align="justify",
    narrow-indicator
  )
    q-tab(name="style", label="Style")
    q-tab(name="css", label="CSS")
  q-separator
  q-tab-panels.full-width.col(v-model="css.tab")
    q-tab-panel.column(name="style")
      v-source-code.col(v-model="$.style", lang="css")
    q-tab-panel.column(name="css")
      v-interactive-tree(
        v-model:selected="css.selected",
        type="url",
        :list="$?.css"
      )
</template>
<script setup lang="ts">
import { useStorage } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { watch } from "vue";

import VInteractiveTree from "@/components/VInteractiveTree.vue";
import VSourceCode from "@/components/VSourceCode.vue";
import app from "@/stores/app";
import type { TResource } from "~/monolit/src/stores/data";
import data from "~/monolit/src/stores/data";

const { accessKeyId, rightDrawer } = storeToRefs(app());
const { $ } = data();
rightDrawer.value = null;

const selected: undefined = undefined;
const tab: string = "script";
const css = useStorage(`css-${accessKeyId.value}`, { selected, tab } as {
  selected: string | undefined;
  tab: string;
});

watch(
  () => $?.css as TResource[],
  ([{ id }]: TResource[]) => {
    if (!css.value.selected) css.value.selected = id;
  },
  { immediate: true },
);
</script>
