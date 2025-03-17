<template lang="pug">
q-dialog(ref="dialogRef", @hide="onDialogHide")
  q-card.w-full
    q-card-section Fonts
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
          q-checkbox(v-model="props.selected", dense)
        template(#body-cell="props")
          q-td(:props)
            q-input.min-w-20(v-model.trim="props.row[props.col.name]", dense)
    q-separator
    q-card-actions.text-primary(align="between")
      q-btn-group(outline)
        q-btn(icon="add", outline, @click="addRow")
        q-btn(icon="remove", outline, @click="removeRow")
      q-btn(:label="t('Close')", flat, @click="onDialogHide")
</template>

<script setup lang="ts">
import type { QTableProps } from "quasar";

import json from "assets/fonts.json";
import { uid, useDialogPluginComponent } from "quasar";
import { fonts } from "stores/app";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

/* -------------------------------------------------------------------------- */

const { dialogRef, onDialogHide } = useDialogPluginComponent(),
  { t } = useI18n();

/* -------------------------------------------------------------------------- */

const columns = json as QTableProps["columns"],
  rows = ref([] as Record<string, string>[]),
  selected = ref([] as Record<string, string>[]);

/* -------------------------------------------------------------------------- */

const addRow = () => {
    const id = uid(),
      name = "";
    rows.value.push({ id, name });
  },
  removeRow = () => {
    const set = new Set(selected.value);
    rows.value = rows.value.filter((x) => !set.has(x));
  };

/* -------------------------------------------------------------------------- */

defineEmits([...useDialogPluginComponent.emits]);
watch(
  rows,
  (value) => {
    fonts.length = 0;
    fonts.push(...(value.map(({ name }) => name).filter(Boolean) as never[]));
  },
  { deep: true },
);
onMounted(() => {
  rows.value = fonts.map((name) => {
    const id = uid();
    return { id, name };
  });
});
</script>
