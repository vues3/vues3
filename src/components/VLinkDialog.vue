<template lang="pug">
q-dialog(full-height, full-width, persistent, v-model="model")
  q-card.column
    q-card-section.row.q-pb-none.items-center
      .text-h6 Выбор внутренней ссылки для вставки
      q-space
      q-btn(dense, flat, icon="close", round, v-close-popup)
    q-card-section.col.column.full-width
      q-card.col.column.full-width(bordered, flat)
        q-card-section.col.column.full-width
          q-tree.col.scroll.full-width(
            :nodes="$.content",
            default-expand-all,
            no-selection-unset,
            node-key="id",
            selected-color="primary",
            v-model:selected="selected"
          )
            template(#default-header="prop")
              q-icon.q-tree__icon.q-mr-sm(:name="prop.node.icon || 'mdi-web'")
              div {{ prop.node.label }}
    q-card-actions.text-primary(align="right")
      q-btn(flat, label="Отмена", v-close-popup)
      q-btn(
        @click="editor?.runCmd('insertHTML', `<router-link to='/${the?.path}'>${the?.label}</router-link>`)",
        flat,
        label="Ok",
        v-close-popup
      )
</template>
<script setup lang="ts">
import type { QEditor } from "quasar";
import type { TView } from "stores/data";
import type { ComputedRef, ModelRef, Ref } from "vue";

import { $, views } from "stores/data";
import { computed, ref, watch } from "vue";

defineProps<{
  editor?: QEditor;
}>();
const model: ModelRef<boolean> = defineModel<boolean>({ default: false });
const selected: Ref<string | undefined> = ref();
const the: ComputedRef<TView | undefined> = computed(() =>
  views.value.find(({ id }) => id === selected.value),
);
watch(model, (show) => {
  const [{ id }] = $.value?.content ?? [];
  if (show) selected.value = id;
});
</script>
