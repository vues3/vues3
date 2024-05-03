<template lang="pug">
q-page.column.full-height
  q-tabs.text-grey(
    active-color="primary",
    align="justify",
    dense,
    indicator-color="primary",
    narrow-indicator,
    v-model="config.css.tab"
  )
    q-tab(label="Style", name="style")
    q-tab(label="CSS", name="css")
  q-separator
  q-tab-panels.full-width.col(v-model="config.css.tab")
    q-tab-panel.column(name="style")
      Suspense
        v-source-code.col(lang="css", v-model="$.style")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="css")
      v-interactive-tree(
        :list,
        type="url",
        v-model:selected="config.css.selected"
      )
</template>
<script setup lang="ts">
import VInteractiveTree from "components/VInteractiveTree.vue";
import VSourceCode from "components/VSourceCode.vue";
import { config, rightDrawer } from "stores/app";
import { $ } from "stores/data";
import { computed } from "vue";

const list = computed(() => $.value?.css);
rightDrawer.value = undefined;
</script>
