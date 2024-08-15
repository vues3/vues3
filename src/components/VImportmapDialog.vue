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
        row-key="name",
        selection="multiple",
        v-model:selected="selected",
        virtual-scroll
      )
        template(#body-cell="props")
          q-td(:auto-width="props.col.name === 'name'", :props)
            q-input(
              borderless,
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

import { useDialogPluginComponent } from "quasar";
import { computed, ref } from "vue";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const selected = ref([]);
const columns = [
  {
    align: "left",
    field: "name",
    label: "Name",
    name: "name",
    sortable: false,
  },
  {
    align: "left",
    field: "path",
    label: "Path",
    name: "path",
    sortable: false,
  },
] as QTableProps["columns"];

const rows = ref([
  {
    name: "vue1",
    path: "https://1unpkg.com/embla-carousel-vue/esm/embla-carousel-vue.esm.js",
  },
  {
    name: "vue2",
    path: "https://2unpkg.com/embla-carousel-vue/esm/embla-carousel-vue.esm.js",
  },
  {
    name: "vue1",
    path: "https://3unpkg.com/embla-carousel-vue/esm/embla-carousel-vue.esm.js",
  },
  {
    name: "vue2",
    path: "https://4unpkg.com/embla-carousel-vue/esm/embla-carousel-vue.esm.js",
  },
  {
    name: "vue1",
    path: "https://5unpkg.com/embla-carousel-vue/esm/embla-carousel-vue.esm.js",
  },
]);
const addRow = () => {
  rows.value.push({ name: "", path: "" });
};
const names = computed(() =>
  selected.value.map(({ name }: { name: string }) => name),
);
const removeRow = () => {
  rows.value = rows.value.filter(({ name }) => !names.value.includes(name));
};
</script>
