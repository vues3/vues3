<template lang="pug">
q-dialog(ref="dialogRef", full-height, @hide="onDialogHide")
  q-card.q-dialog-plugin.column
    q-card-section.q-dialog__title {{ t("Fonts") }}
    q-card-section.q-dialog__message {{ t("Use web fonts from Google Fonts by simply providing the font names") }}
    q-card-section.q-dialog-plugin__form.scroll.col(horizontal)
      q-table.h-full.w-full(
        v-model:selected="selected",
        :columns,
        :rows,
        :rows-per-page-options="[0]",
        dense,
        flat,
        hide-bottom,
        row-key="id",
        selection="multiple",
        separator="none"
      )
        template(#body-selection="props")
          q-checkbox(v-model="props.selected", dense)
        template(#body-cell="props")
          q-td(:props)
            q-input.min-w-20(v-model.trim="props.row[props.col.name]", dense)
    q-card-actions.text-primary(align="between")
      q-btn-group(outline)
        q-btn(icon="add", outline, @click="addRow")
        q-btn(icon="remove", outline, @click="removeRow")
      div
        q-btn(:label="t('Cancel')", flat, @click="onDialogCancel")
        q-btn(label="Ok", flat, @click="onOKClick")
</template>

<script setup lang="ts">
import type { QTableProps } from "quasar";

import json from "assets/fonts.json";
import { uid, useDialogPluginComponent } from "quasar";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } =
    useDialogPluginComponent(),
  { fonts } = defineProps<{ fonts: string[] }>(),
  { t } = useI18n();

const columns = json as QTableProps["columns"],
  rows = ref(fonts.map((name) => ({ id: uid(), name }))),
  selected = ref([] as Record<string, string>[]);
const addRow = () => {
    const id = uid(),
      name = "";
    rows.value.push({ id, name });
  },
  onOKClick = () => {
    onDialogOK(rows.value.map(({ name }) => name).filter(Boolean));
  },
  removeRow = () => {
    const set = new Set(selected.value);
    rows.value = rows.value.filter((x) => !set.has(x));
  };

defineEmits([...useDialogPluginComponent.emits]);
</script>
