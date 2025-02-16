<template lang="pug">
q-dialog(ref="dialogRef", @hide="onDialogHide")
  q-card.w-full
    q-card-section.scroll.h-96
      q-tree(
        v-model:selected="selected",
        :nodes,
        default-expand-all,
        no-selection-unset,
        node-key="id",
        selected-color="primary"
      )
        template(#default-header="prop")
          Icon.q-icon.q-tree__icon.q-mr-sm(:icon="prop.node.icon || 'mdi:web'")
          div {{ prop.node.name }}
    q-separator
    q-card-actions.text-primary(align="right")
      q-btn(:label="t('Cancel')", flat, @click="onDialogCancel")
      q-btn(flat, label="Ok", @click="onDialogOK(the?.to)")
</template>

<script setup lang="ts">
import type { Ref } from "vue";

import { Icon } from "@iconify/vue";
import { nodes, pages } from "@vues3/shared";
import { useDialogPluginComponent } from "quasar";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

/* -------------------------------------------------------------------------- */

const { dialogRef, onDialogCancel, onDialogHide, onDialogOK } =
    useDialogPluginComponent(),
  { t } = useI18n();

/* -------------------------------------------------------------------------- */

const selected: Ref<string | undefined> = ref(),
  the = computed(() => pages.value.find(({ id }) => id === selected.value));

/* -------------------------------------------------------------------------- */

defineEmits([...useDialogPluginComponent.emits]);

onMounted(() => {
  const [{ id } = {}] = nodes;
  selected.value = id;
});
</script>
