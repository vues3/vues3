<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.q-dialog-plugin
    q-tabs(
      @update:model-value="(value) => { group = options(wind[value].navigationSubCategories[0].subCategoryLink)?.[0].value; }",
      align="justify",
      inline-label,
      mobile-arrows,
      outside-arrows,
      v-model="tab"
    )
      q-tab(
        :key="category.navigationCategory",
        :label="category.navigationCategory",
        :name="index",
        v-for="(category, index) in wind"
      )
    q-separator
    q-tab-panels.scroll.q-dialog-plugin__form(v-model="tab")
      q-tab-panel(
        :key="category.navigationCategory",
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
    q-separator
    q-card-actions.text-primary(align="right")
      q-btn(@click="onDialogCancel", flat, label="Отмена")
      q-btn(@click="onDialogOK(html_beautify(group))", flat, label="Ok")
</template>
<script setup lang="ts">
import type { QOptionGroupProps } from "quasar";

import templates from "assets/templates.json";
import wind from "assets/wind.json";
import { html_beautify } from "js-beautify";
import { useDialogPluginComponent } from "quasar";
import { onMounted, ref } from "vue";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } =
  useDialogPluginComponent();
const tab = ref();
const group = ref();
const options = (value: string) =>
  templates[value as keyof object] as QOptionGroupProps["options"];
onMounted(() => {
  tab.value = 0;
  group.value = options(wind[0].navigationSubCategories[0].subCategoryLink)?.[0]
    .value as string;
});
</script>
