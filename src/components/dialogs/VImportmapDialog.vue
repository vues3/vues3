<template lang="pug">
q-dialog(ref="dialogRef", full-width, full-height, @hide="onDialogHide")
  q-card.q-dialog-plugin.column
    q-card-section.q-dialog__title Import Map
    q-card-section.q-dialog__message {{ t("The value is a module specifier map, which provides the mappings between module specifier text that might appear in an import statement or import() operator, and the text that will replace it when the specifier is resolved") }}
    q-card-section.q-dialog-plugin__form.scroll.col(horizontal)
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
        separator="none"
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
              dense,
              :autofocus="props.col.name === 'name'"
            )
    q-card-actions(align="between")
      q-btn-group(outline)
        q-btn(
          color="primary",
          icon="add",
          outline,
          @click="rows.push({ id: uid(), name: '', path: '' })"
        )
        q-btn(color="primary", icon="remove", outline, @click="removeRow")
      div
        q-btn(
          color="primary",
          :label="t('Cancel')",
          flat,
          @click="onDialogCancel"
        )
        q-btn(
          color="primary",
          label="Ok",
          flat,
          @click="onDialogOK(Object.fromEntries(rows.filter(({ name, path }) => path && name).map(({ name, path }) => [name, path])))"
        )
</template>
<script setup lang="ts">
import type { QTableProps } from "quasar";

import json from "assets/importmap.json";
import { uid, useDialogPluginComponent, useQuasar } from "quasar";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } =
    useDialogPluginComponent(),
  { importmap } = defineProps<{
    importmap: { imports: Record<string, string> };
  }>(),
  {
    imports: { vue, ["vue-router"]: vueRouter, ...imports },
  } = importmap,
  { t } = useI18n();

const $q = useQuasar(),
  columns = json as QTableProps["columns"],
  rows = ref(
    Object.entries(imports).map(([name, path]) => ({
      id: uid(),
      name,
      path,
    })),
  ),
  selected = ref<Record<string, string>[]>([]);

const removeRow = () => {
  if (selected.value.length)
    $q.dialog({
      cancel: true,
      message: t("Do you really want to delete?"),
      persistent: true,
      title: t("Confirm"),
    }).onOk(() => {
      const set = new Set(selected.value);
      rows.value = rows.value.filter((x) => !set.has(x));
    });
};

defineEmits([...useDialogPluginComponent.emits]);

if (vueRouter)
  rows.value.unshift({ id: uid(), name: "vue-router", path: vueRouter });
if (vue) rows.value.unshift({ id: uid(), name: "vue", path: vue });
</script>
