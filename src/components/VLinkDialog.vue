<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.q-dialog-plugin
    q-card-section.scroll.q-dialog-plugin__form
      q-tree(
        :nodes,
        default-expand-all,
        no-selection-unset,
        node-key="id",
        selected-color="primary",
        v-model:selected="selected"
      )
        template(#default-header="prop")
          q-icon.q-tree__icon.q-mr-sm(:name="prop.node.icon || 'mdi-web'")
          div {{ prop.node.text }}
    q-separator
    q-card-actions.text-primary(align="right")
      q-btn(@click="onDialogCancel", flat, label="Отмена")
      q-btn(@click="onDialogOK(the?.path)", flat, label="Ok")
</template>
<script setup lang="ts">
import type { QTreeNode } from "quasar";

import { useDialogPluginComponent } from "quasar";
import { $, views } from "stores/data";
import { computed, onMounted, ref } from "vue";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } =
  useDialogPluginComponent();
const selected = ref();
const the = computed(() => views.value.find(({ id }) => id === selected.value));
const nodes = computed(() => $.value?.content as QTreeNode[]);
onMounted(() => {
  const [{ id }] = $.value?.content ?? [];
  selected.value = id;
});
</script>
