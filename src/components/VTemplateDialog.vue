<template lang="pug">
q-dialog(v-model="model", full-width, full-height, persistent)
  q-card.column.w-full
    q-card-section.row.q-pb-none.items-center
      .text-h6 Выбор компонента для вставки
      q-space
      q-btn(v-close-popup, icon="close", flat, round, dense)
    q-card-section
      q-select(
        v-model="html",
        filled,
        :options,
        label="Компонент",
        emit-value,
        map-options
      )
    q-card-section.col.column.w-full
      q-card.col.column.w-full(flat, bordered)
        q-card-section.col.column.w-full
          // eslint-disable vue/no-v-html
          .col.prose.column.q-pa-xl.w-full.max-w-none.overflow-auto(
            class="[&>*]:m-auto [&>*]:!min-h-fit [&>*]:min-w-fit",
            v-html="html"
          )
          // eslint-enable vue/no-v-html
    q-card-actions.text-primary(align="right")
      q-btn(v-close-popup, flat, label="Отмена")
      q-btn(
        v-close-popup,
        flat,
        label="Ok",
        @click="editor?.runCmd('insertHTML', html_beautify(html))"
      )
</template>
<script setup lang="ts">
import options from "assets/templates.json";
import { html_beautify } from "js-beautify";
import type { QEditor } from "quasar";
import type { ModelRef, Ref } from "vue";
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
