<template lang="pug">
q-dialog(@hide="onDialogHide", ref="dialogRef")
  q-card.w-full
    q-card-section.scroll.h-96
      q-tree(
        :nodes,
        default-expand-all,
        no-selection-unset,
        node-key="id",
        selected-color="primary",
        v-model:selected="selected"
      )
        template(#default-header="prop")
          Icon.q-icon.q-tree__icon.q-mr-sm(:icon="prop.node.icon || 'mdi:web'")
          div {{ prop.node.name }}
    q-separator
    q-card-actions.text-primary(align="right")
      q-btn(:label="t('Cancel')", @click="onDialogCancel", flat)
      q-btn(@click="onDialogOK(the?.to)", flat, label="Ok")
</template>
<script setup lang="ts">
import type { QTreeNode } from "quasar";

import { Icon } from "@iconify/vue";
import { useDialogPluginComponent } from "quasar";
import { data, pages } from "stores/data";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } =
  useDialogPluginComponent();
const selected = ref();
const { t } = useI18n();
const the = computed(() => pages.value.find(({ id }) => id === selected.value));
const nodes = computed(() => data as QTreeNode[]);
onMounted(() => {
  const [{ id }] = data;
  selected.value = id;
});
</script>
