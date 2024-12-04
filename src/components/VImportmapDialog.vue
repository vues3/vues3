<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.w-full
    q-card-section Import Map
    q-separator
    q-card-section.mt-4.h-96(horizontal)
      q-table.w-full(
        :columns,
        :rows,
        :rows-per-page-options="[0]",
        dense,
        flat,
        hide-bottom,
        row-key="id",
        selection="multiple",
        separator="none",
        v-model:selected="selected",
        virtual-scroll
      )
        template(#body-selection="props")
          q-checkbox(
            :disable="!props.rowIndex && props.row.name === 'vue'",
            dense,
            v-model="props.selected"
          )
        template(#body-cell="props")
          q-td(:auto-width="props.col.name === 'name'", :props)
            q-input.min-w-24(
              :disable="!props.rowIndex && props.row.name === 'vue'",
              dense,
              v-model.trim="props.row[props.col.name]"
            )
    q-separator
    q-card-actions.text-primary(align="between")
      q-btn-group(outline)
        q-btn(@click="addRow", icon="add", outline)
        q-btn(@click="removeRow", icon="remove", outline)
      q-btn(:label="t('Close')", @click="onDialogHide", flat)
</template>
<script setup lang="ts">
import type { QTableProps } from "quasar";
import type { Ref } from "vue";

import { deep, importmap } from "@vues3/shared";
import json from "assets/importmap.json";
import { uid, useDialogPluginComponent } from "quasar";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

defineEmits([...useDialogPluginComponent.emits]);
const { t } = useI18n();
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const selected: Ref<Record<string, string>[]> = ref([]);
const columns = json as QTableProps["columns"];
const rows: Ref<Record<string, string>[]> = ref([]);
onMounted(() => {
  const { imports = {} } = importmap;
  rows.value = Object.entries(imports).map(([name, path]) => {
    const id = uid();
    return { id, name, path };
  });
  rows.value.push(
    ...rows.value.splice(
      0,
      rows.value.findIndex(({ name }) => name === "vue"),
    ),
  );
});
watch(
  rows,
  (value) => {
    importmap.imports = Object.fromEntries(
      value
        .filter(({ name, path }) => path && name)
        .map(({ name, path }) => [name, path]),
    );
  },
  { deep },
);
const addRow = () => {
  const id = uid();
  const name = "";
  const path = "";
  rows.value.push({ id, name, path });
};
const removeRow = () => {
  const set = new Set(selected.value);
  rows.value = rows.value.filter((x) => !set.has(x));
};
</script>
