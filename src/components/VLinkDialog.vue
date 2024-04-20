<template lang="pug">
q-dialog(v-model="model", full-width, full-height, persistent)
  q-card.column
    q-card-section.row.q-pb-none.items-center
      .text-h6 Выбор внутренней ссылки для вставки
      q-space
      q-btn(v-close-popup, icon="close", flat, round, dense)
    q-card-section.col.column.full-width
      q-card.col.column.full-width(flat, bordered)
        q-card-section.col.column.full-width
          q-tree.col.scroll.full-width(
            v-if="$.content",
            v-model:selected="selected",
            :nodes="$.content",
            default-expand-all,
            node-key="id",
            no-selection-unset,
            selected-color="primary"
          )
            template(#default-header="prop")
              q-icon.q-tree__icon.q-mr-sm(:name="prop.node.icon || 'mdi-web'")
              div {{ prop.node.label }}
    q-card-actions.text-primary(align="right")
      q-btn(v-close-popup, flat, label="Отмена")
      q-btn(
        v-close-popup,
        flat,
        label="Ok",
        @click="editor.runCmd('insertHTML', `<router-link to='/${the.path}'>${the.label}</router-link>`)"
      )
</template>
<script setup lang="ts">
import type { QEditor } from "quasar";
import type { ComputedRef, ModelRef, Ref } from "vue";
import { computed, ref, watch } from "vue";

import type { TPage } from "@/stores/data";
import { $, pages } from "@/stores/data";

/**
 * @type {IProps}
 * @property {QEditor | null} editor - Экземпляр редактора
 */
interface IProps {
  editor: QEditor | null;
}

withDefaults(defineProps<IProps>(), {
  editor: null,
});

/**
 * Флаг открытия модального окна
 *
 * @type {ModelRef<boolean>}
 */
const model: ModelRef<boolean> = defineModel<boolean>({ default: false });

/**
 * Идентификатор выбранной страницы
 *
 * @type {Ref<string | null>}
 */
const selected: Ref<string | null> = ref(null);

/**
 * Выбранный объект страницы
 *
 * @type {ComputedRef<TPage | null>}
 */
const the: ComputedRef<TPage | null> = computed(
  () => pages.value.find(({ id }) => id === selected.value) ?? null,
);

const [{ id }] = $.content ?? [];

watch(model, (show) => {
  if (show) selected.value = id ?? null;
});
</script>
