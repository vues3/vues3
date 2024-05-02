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
      Suspense
        v-source-code.col(v-model="$.script", lang="javascript")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="js")
      v-interactive-tree(
        v-model:selected="config.js.selected",
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
/**
 * Список для вывода
 *
 * @type {ComputedRef<TResource[]>}
 */
const list: ComputedRef<TResource[]> = computed(() => <TResource[]>$.value?.js);
rightDrawer.value = undefined;
</script>
