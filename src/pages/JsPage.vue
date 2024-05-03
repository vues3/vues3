<template lang="pug">
q-page.column.full-height
  q-tabs.text-grey(
    active-color="primary",
    align="justify",
    dense,
    indicator-color="primary",
    narrow-indicator,
    v-model="config.js.tab"
  )
    q-tab(label="Script", name="script")
    q-tab(label="JS", name="js")
  q-separator
  q-tab-panels.full-width.col(v-model="config.js.tab")
    q-tab-panel.column(name="script")
      Suspense
        v-source-code.col(lang="javascript", v-model="$.script")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="js")
      v-interactive-tree(
        :list,
        type="url",
        v-model:selected="config.js.selected"
      )
</template>
<script setup lang="ts">
import type { TResource } from "stores/data";
import type { ComputedRef } from "vue";

import VInteractiveTree from "components/VInteractiveTree.vue";
import VSourceCode from "components/VSourceCode.vue";
import { config, rightDrawer } from "stores/app";
import { $ } from "stores/data";
import { computed } from "vue";

const list: ComputedRef<TResource[] | undefined> = computed(() => $.value?.js);
rightDrawer.value = undefined;
</script>
