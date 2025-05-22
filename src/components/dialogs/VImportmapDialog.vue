<template lang="pug">
q-dialog(ref="dialogRef", @hide="onDialogHide")
  q-card.w-full
    q-card-section Import Map
    q-separator
    q-card-section.mt-4.h-96(horizontal)
      q-table.w-full(
        v-model:selected="selected",
        :columns,
        :rows,
        :rows-per-page-options="[0]",
        dense,
        flat,
        hide-bottom,
        row-key="id",
        selection="multiple",
        separator="none",
        virtual-scroll
      )
        template(#body-selection="props")
          q-checkbox(
            v-model="props.selected",
            :disable="['vue', 'vue-router'].includes(props.row.name)",
            dense
          )
        template(#body-cell="props")
          q-td(:auto-width="props.col.name === 'name'", :props)
            q-input.min-w-24(
              v-model.trim="props.row[props.col.name]",
              :disable="['vue', 'vue-router'].includes(props.row.name)",
              dense
            )
    q-separator
    q-card-actions.text-primary(align="between")
      q-btn-group(outline)
        q-btn(icon="add", outline, @click="addRow")
        q-btn(icon="remove", outline, @click="removeRow")
      q-btn(:label="t('Close')", flat, @click="onDialogHide")
</template>
<script setup lang="ts">
import type { TImportmap } from "@vuebro/shared";
import type { QTableProps } from "quasar";

import { importmap } from "@vuebro/shared";
import json from "assets/importmap.json";
import { uid, useDialogPluginComponent } from "quasar";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
const { dialogRef, onDialogHide } = useDialogPluginComponent(),
  { t } = useI18n();
const columns = json as QTableProps["columns"],
  rows = ref([] as Record<string, string>[]),
  selected = ref([] as Record<string, string>[]);
const addRow = () => {
    const id = uid(),
      name = "",
      path = "";
    rows.value.push({ id, name, path });
  },
  removeRow = () => {
    const set = new Set(selected.value);
    rows.value = rows.value.filter((x) => !set.has(x));
  };
defineEmits([...useDialogPluginComponent.emits]);
watch(
  rows,
  (value) => {
    importmap.imports = Object.fromEntries(
      value
        .filter(({ name, path }) => path && name)
        .map(({ name, path }) => [name, path]),
    ) as TImportmap["imports"];
  },
  { deep: true },
);
onMounted(() => {
  const { imports: { vue, ["vue-router"]: vueRouter, ...imports } = {} } =
    importmap;
  rows.value = Object.entries(imports).map(([name, path]) => ({
    id: uid(),
    name,
    path,
  }));
  if (vueRouter)
    rows.value.unshift({ id: uid(), name: "vue-router", path: vueRouter });
  if (vue) rows.value.unshift({ id: uid(), name: "vue", path: vue });
});
</script>
