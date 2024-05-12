<template lang="pug">
q-dialog(full-height, full-width, v-model="model")
  q-card.column.w-full
    q-tabs(align="justify", v-model="tab")
      q-tab(
        :key="index",
        :label="category.navigationCategory",
        :name="index",
        v-for="(category, index) in wind"
      )
    q-separator
    q-tab-panels.col.column.w-full(animated, v-model="tab")
      q-tab-panel(
        :key="index",
        :label="category.navigationCategory",
        :name="index",
        v-for="(category, index) in wind"
      )
        q-responsive(:ratio="1")
          q-btn(
            :key="subIndex",
            :label="subCategory.subCategory",
            color="white",
            icon="phone",
            push,
            stack,
            text-color="primary",
            v-for="(subCategory, subIndex) in category.navigationSubCategories"
          )
    q-card-actions.text-primary(align="right")
      q-btn(flat, label="Отмена", v-close-popup)
      q-btn(flat, label="Ok", v-close-popup)
</template>
<script setup lang="ts">
import type { QEditor } from "quasar";

import wind from "assets/wind.json";
import { ref } from "vue";

defineProps<{
  editor?: QEditor;
}>();
const model = defineModel<boolean>();
const tab = ref(0);
console.log(wind);
</script>
