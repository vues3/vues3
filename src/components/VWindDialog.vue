<template lang="pug">
q-dialog(full-height, full-width, v-model="model")
  q-card.column.w-full
    q-tabs(
      @update:model-value="(value) => { group = options(wind[value].navigationSubCategories[0].subCategoryLink)?.[0].value; }",
      align="justify",
      v-model="tab"
    )
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
        q-list
          q-expansion-item(
            :default-opened="!subIndex",
            :key="subIndex",
            @after-show="group = options(subCategory.subCategoryLink)?.[0].value",
            group="group",
            header-class="text-subtitle2",
            v-for="(subCategory, subIndex) in category.navigationSubCategories.filter(({ subCategoryVarNumber }) => subCategoryVarNumber)"
          )
            template(#header)
              q-item-section(avatar)
                q-avatar(
                  :icon="`img:${subCategory.subCategoryImage}`",
                  color="secondary",
                  rounded,
                  size="xl"
                )
              q-item-section {{ subCategory.subCategory }}
            q-card
              q-card-section
                q-option-group(
                  :options="options(subCategory.subCategoryLink)",
                  type="radio",
                  v-model="group"
                )
    q-card-actions.text-primary(align="right")
      q-btn(flat, label="Отмена", v-close-popup)
      q-btn(
        @click="editor?.runCmd('insertHTML', html_beautify(group))",
        flat,
        label="Ok",
        v-close-popup
      )
</template>
<script setup lang="ts">
import type { QEditor, QOptionGroupProps } from "quasar";

import templates from "assets/templates.json";
import wind from "assets/wind.json";
import { html_beautify } from "js-beautify";
import { ref, watch } from "vue";

defineProps<{
  editor?: QEditor;
}>();
const model = defineModel<boolean>();
const tab = ref();
const group = ref();
const options = (value: string) =>
  templates[value as keyof object] as QOptionGroupProps["options"];
watch(model, (value) => {
  if (value) {
    tab.value = 0;
    group.value = options(
      wind[0].navigationSubCategories[0].subCategoryLink,
    )?.[0].value as string;
  }
});
</script>
