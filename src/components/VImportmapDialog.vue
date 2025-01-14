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
/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { TImportmap } from "@vues3/shared";
import type { QDialog, QTableProps } from "quasar";
import type { Ref } from "vue";
import type { Composer } from "vue-i18n";

import { deep, importmap } from "@vues3/shared";
import json from "assets/importmap.json";
import { uid, useDialogPluginComponent } from "quasar";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

/* -------------------------------------------------------------------------- */
/*                                   Objects                                  */
/* -------------------------------------------------------------------------- */

const { t }: Composer = useI18n();

/* -------------------------------------------------------------------------- */

const {
  dialogRef,
  onDialogHide,
}: {
  dialogRef: Ref<QDialog | undefined>;
  onDialogHide: () => void;
} = useDialogPluginComponent();

/* -------------------------------------------------------------------------- */

const columns: QTableProps["columns"] = json as QTableProps["columns"];

/* -------------------------------------------------------------------------- */
/*                                 References                                 */
/* -------------------------------------------------------------------------- */

const selected: Ref<Record<string, string>[]> = ref([]);

/* -------------------------------------------------------------------------- */

const rows: Ref<Record<string, string>[]> = ref([]);

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const addRow: () => void = () => {
  const id = uid();
  const name = "";
  const path = "";
  rows.value.push({ id, name, path });
};

/* -------------------------------------------------------------------------- */

const removeRow: () => void = () => {
  const set = new Set(selected.value);
  rows.value = rows.value.filter((x) => !set.has(x));
};

/* -------------------------------------------------------------------------- */

const importmapToRows: () => void = () => {
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
};

/* -------------------------------------------------------------------------- */

const rowsToImportmap: (value: Record<string, string>[]) => void = (value) => {
  importmap.imports = Object.fromEntries(
    value
      .filter(({ name, path }) => path && name)
      .map(({ name, path }) => [name, path]),
  ) as TImportmap["imports"];
};

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

defineEmits([...useDialogPluginComponent.emits]);

/* -------------------------------------------------------------------------- */

onMounted(importmapToRows);

/* -------------------------------------------------------------------------- */

watch(rows, rowsToImportmap, { deep });

/* -------------------------------------------------------------------------- */
</script>
