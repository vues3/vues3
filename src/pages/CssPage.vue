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
      Suspense
        v-source-code.col(v-model="$.style", lang="css")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="css")
      v-interactive-tree(
        v-model:selected="config.css.selected",
        type="url",
        :list
      )
</template>
<script setup lang="ts">
import VInteractiveTree from "components/VInteractiveTree.vue";
import VSourceCode from "components/VSourceCode.vue";
import { config, rightDrawer } from "stores/app";
import type { TResource } from "stores/data";
import { $ } from "stores/data";
import type { ComputedRef } from "vue";
import { computed } from "vue";
/** Список для вывода */
const list: ComputedRef<TResource[]> = computed(
  () => <TResource[]>$.value?.css,
);
rightDrawer.value = undefined;
</script>
