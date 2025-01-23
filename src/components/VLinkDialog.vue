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
/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { QDialog } from "quasar";
import type { Ref } from "vue";
import type { Composer } from "vue-i18n";

import { Icon } from "@iconify/vue";
import { nodes, pages } from "@vues3/shared";
import { useDialogPluginComponent } from "quasar";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

/* -------------------------------------------------------------------------- */
/*                                   Objects                                  */
/* -------------------------------------------------------------------------- */

const {
  dialogRef,
  onDialogCancel,
  onDialogHide,
  onDialogOK,
}: {
  dialogRef: Ref<QDialog | undefined>;
  onDialogCancel: () => void;
  onDialogHide: () => void;
  onDialogOK: (payload?: string) => void;
} = useDialogPluginComponent();
/* -------------------------------------------------------------------------- */

const { t }: Composer = useI18n();

/* -------------------------------------------------------------------------- */
/*                                 References                                 */
/* -------------------------------------------------------------------------- */

const selected = ref();

/* -------------------------------------------------------------------------- */
/*                                Computations                                */
/* -------------------------------------------------------------------------- */

const the = computed(() => pages.value.find(({ id }) => id === selected.value));

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

defineEmits([...useDialogPluginComponent.emits]);

/* -------------------------------------------------------------------------- */

onMounted(() => {
  const [{ id } = {}] = nodes;
  selected.value = id;
});

/* -------------------------------------------------------------------------- */
</script>
