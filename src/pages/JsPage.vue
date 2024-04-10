<template lang="pug">
q-page.column.full-height
  q-tabs.text-grey(
    v-model="js.tab",
    dense,
    active-color="primary",
    indicator-color="primary",
    align="justify",
    narrow-indicator
  )
    q-tab(name="script", label="Script")
    q-tab(name="js", label="JS")
  q-separator
  q-tab-panels.full-width.col(v-model="js.tab")
    q-tab-panel.column(name="script")
      v-source-code.col(v-model="$.script", lang="javascript")
    q-tab-panel.column(name="js")
      v-interactive-tree(
        v-model:selected="js.selected",
        type="url",
        :list="$?.js"
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
const js = useStorage(`js-${accessKeyId.value}`, { selected, tab } as {
  selected: string | undefined;
  tab: string;
});

watch(
  () => $?.js as TResource[],
  ([{ id }]: TResource[]) => {
    if (!js.value.selected) js.value.selected = id;
  },
  { immediate: true },
);
</script>
