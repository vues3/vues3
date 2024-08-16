<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.q-dialog-plugin
    q-card-section Import Map
    q-card-section.h-96(horizontal)
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
            :disable="props.row.name === 'vue'",
            dense,
            v-model="props.selected"
          )
        template(#body-cell="props")
          q-td(:auto-width="props.col.name === 'name'", :props)
            q-input.min-w-20(
              :disable="props.row.name === 'vue'",
              dense,
              v-model.trim="props.row[props.col.name]"
            )
    q-separator
    q-card-actions.text-primary(align="between")
      q-btn-group(outline)
        q-btn(@click="addRow", icon="add", outline)
        q-btn(@click="removeRow", icon="remove", outline)
      q-btn(@click="onDialogHide", flat, label="Close")
</template>
<script setup lang="ts">
import type { QTableProps } from "quasar";
import type { Ref } from "vue";

import json from "assets/importmap.json";
import { useDialogPluginComponent } from "quasar";
import { importmap } from "stores/app";
import { deep } from "stores/defaults";
import uuid from "uuid-random";
import { onMounted, ref, watch } from "vue";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const selected: Ref<Record<string, string>[]> = ref([]);
const columns = json as QTableProps["columns"];
const rows: Ref<Record<string, string>[]> = ref([]);
onMounted(() => {
  const { imports = {} } = importmap.value ?? {};
  rows.value = Object.entries(imports).map(([name, path]) => {
    const id = uuid();
    return { id, name, path };
  });
});
watch(
  rows,
  (value) => {
    if (importmap.value)
      importmap.value.imports = Object.fromEntries(
        value
          .filter(({ name, path }) => path && name)
          .map(({ name, path }) => [name, path]),
      );
  },
  { deep },
);
const addRow = () => {
  const id = uuid();
  const name = "";
  const path = "";
  rows.value.push({ id, name, path });
};
const removeRow = () => {
  const set = new Set(selected.value);
  rows.value = rows.value.filter((x) => !set.has(x));
};
</script>
