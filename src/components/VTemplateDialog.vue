<template lang="pug">
q-dialog(full-height, full-width, persistent, v-model="model")
  q-card.column.w-full
    q-card-section.row.q-pb-none.items-center
      .text-h6 Выбор компонента для вставки
      q-space
      q-btn(dense, flat, icon="close", round, v-close-popup)
    q-card-section
      q-select(
        :options,
        emit-value,
        filled,
        label="Компонент",
        map-options,
        v-model="html"
      )
    q-card-section.col.column.w-full
      q-card.col.column.w-full(bordered, flat)
        q-card-section.col.column.w-full
          .col.prose.column.q-pa-xl.w-full.max-w-none.overflow-auto(
            class="[&>*]:m-auto [&>*]:!min-h-fit [&>*]:min-w-fit",
            v-html="html"
          )
    q-card-actions.text-primary(align="right")
      q-btn(flat, label="Отмена", v-close-popup)
      q-btn(
        @click="editor?.runCmd('insertHTML', html_beautify(html))",
        flat,
        label="Ok",
        v-close-popup
      )
</template>
<script setup lang="ts">
import type { QEditor } from "quasar";
import type { ModelRef, Ref } from "vue";

import options from "assets/templates.json";
import { html_beautify } from "js-beautify";
import { ref, watch } from "vue";

defineProps<{
  editor?: QEditor;
}>();
const model: ModelRef<boolean> = defineModel<boolean>({ default: false });
const html: Ref<string> = ref("");
const [{ value }] = options;
watch(model, (show) => {
  if (show) html.value = value;
});
</script>
