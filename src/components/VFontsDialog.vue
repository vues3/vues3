<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.q-dialog-plugin
    q-card-section Fonts
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
          q-checkbox(dense, v-model="props.selected")
        template(#body-cell="props")
          q-td(:props)
            q-input.min-w-20(dense, v-model.trim="props.row[props.col.name]")
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

import json from "assets/fonts.json";
import { uid, useDialogPluginComponent } from "quasar";
import { fonts } from "stores/app";
import { deep } from "stores/defaults";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

defineEmits([...useDialogPluginComponent.emits]);
const { t } = useI18n();
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const selected: Ref<Record<string, string>[]> = ref([]);
const columns = json as QTableProps["columns"];
const rows: Ref<Record<string, string>[]> = ref([]);
onMounted(() => {
  rows.value = fonts.map((name) => {
    const id = uid();
    return { id, name };
  });
});
watch(
  rows,
  (value, oldValue) => {
    if (oldValue) {
      fonts.length = 0;
      fonts.push(...(value.map(({ name }) => name).filter(Boolean) as never[]));
    }
  },
  { deep },
);
const addRow = () => {
  const id = uid();
  const name = "";
  rows.value.push({ id, name });
};
const removeRow = () => {
  const set = new Set(selected.value);
  rows.value = rows.value.filter((x) => !set.has(x));
};
</script>
