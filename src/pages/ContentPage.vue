<template lang="pug">
q-drawer(bordered, side="right", v-if="the", v-model="rightDrawer")
  q-list
    q-expansion-item(
      default-opened,
      header-class="text-primary",
      icon="account_tree",
      label="Дерево рубрик"
    )
      v-interactive-tree(
        :list="views",
        :tree="$.content",
        v-model:expanded="config.content.expanded",
        v-model:selected="config.content.selected"
      )
    q-separator
    q-card(flat)
      q-item.text-teal
        q-item-section(avatar)
          q-icon(name="travel_explore")
        q-item-section
          q-item-label Настройки слоя
      q-card-section
        q-select(
          :options="themes",
          clearable,
          hint="the.theme",
          label="Цветовая тема",
          v-model="the.theme"
        )
          template(#prepend)
            q-icon(name="mdi-theme-light-dark")
        .q-pt-md
          q-list
            q-item(tag="label", v-ripple)
              q-item-section(avatar)
                q-checkbox(v-model="the.full")
              q-item-section
                q-item-label Полный экран
                q-item-label(caption) the.full
            q-item(tag="label", v-ripple)
              q-item-section(avatar)
                q-checkbox(v-model="the.setup")
              q-item-section
                q-item-label script setup
                q-item-label(caption) the.setup
            q-item(tag="label", v-ripple)
              q-item-section(avatar)
                q-checkbox(v-model="the.scoped")
              q-item-section
                q-item-label style scoped
                q-item-label(caption) the.scoped
    q-separator
    q-card(flat)
      q-item.text-teal
        q-item-section(avatar)
          q-icon(name="travel_explore")
        q-item-section
          q-item-label Настройки SEO
      q-card-section
        q-select(
          :options="types",
          clearable,
          hint="the.type",
          label="Тип содержимого страницы",
          v-model="the.type"
        )
        q-input(
          hint="the.title",
          label="Заголовок страницы",
          v-model.trim="the.title"
        )
        q-input(
          autogrow,
          hint="the.description",
          label="Описание страницы",
          type="textarea",
          v-model.trim="the.description"
        )
        q-select(
          hide-dropdown-icon,
          hint="the.keywords",
          label="Ключевые слова",
          multiple,
          new-value-mode="add",
          stack-label,
          use-chips,
          use-input,
          v-model.trim="the.keywords"
        )
        q-input(
          hint="the.loc",
          label="Постоянная ссылка",
          prefix="/",
          type="url",
          v-model.trim="loc"
        )
        q-select(
          :options="changefreq",
          clearable,
          hint="the.changefreq",
          label="Частота обновления",
          v-model="the.changefreq"
        )
        q-input(
          hint="the.priority",
          label="Приоритет",
          max="1",
          min="0",
          step="0.1",
          type="number",
          v-model.number="the.priority"
        )
        q-input(
          clearable,
          hint="the.icon",
          label="Иконка",
          v-model.trim="the.icon"
        )
          template(#prepend)
            q-icon.cursor-pointer(:name="the.icon ?? 'mdi-tray-arrow-up'")
              q-popup-proxy.column.items-center.justify-center(v-model="show")
                q-input.q-ma-md(
                  clearable,
                  dense,
                  label="Поиск...",
                  v-model="filter"
                )
                q-icon-picker(
                  :filter="filter",
                  :icons="icons",
                  dense,
                  tooltips,
                  v-model="the.icon",
                  v-model:model-pagination="pagination"
                )
        q-input(
          autogrow,
          hint="the.alt",
          label="Описание картинки",
          type="textarea",
          v-model.trim="the.alt"
        )
        q-img.q-mt-md.rounded-borders(
          :ratio="16 / 9",
          :src="`${base}${the.image}`",
          v-if="the.image"
        )
          q-btn.all-pointer-events.absolute(
            @click="the.image = null",
            color="white",
            dense,
            icon="close",
            round,
            size="xs",
            style="top: 8px; right: 8px",
            text-color="black"
          )
          .absolute-bottom.text-center the.image
          template(#error)
            .absolute-full.flex-center.flex
              q-btn(
                @click="click",
                color="primary",
                label="Загрузить картинку"
              )
        q-img.q-mt-md.rounded-borders(:ratio="16 / 9", v-if="!the.image")
          .absolute-full.flex-center.flex
            q-btn(@click="click", color="primary", label="Загрузить картинку")
q-page.column.full-height(v-if="the")
  q-tabs.text-grey(
    active-color="primary",
    align="justify",
    dense,
    indicator-color="primary",
    narrow-indicator,
    v-model="config.content.tab"
  )
    q-tab(label="wysiwyg", name="wysiwyg")
    q-tab(label="template", name="template")
    q-tab(:label="`script${the.setup ? ' setup' : ''}`", name="script")
    q-tab(:label="`style${the.scoped ? ' scoped' : ''}`", name="style")
  q-separator
  q-tab-panels.full-width.col(v-model="config.content.tab")
    q-tab-panel.column(name="wysiwyg")
      Suspense
        v-wysiwyg.full-width.col.column(
          :key="the.id",
          @vue:unmounted="onUnmounted('htm', 'template')",
          v-model="the.html"
        )
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="template")
      Suspense
        v-source-code.col(
          :key="the.id",
          @vue:unmounted="onUnmounted('htm', 'template')",
          v-model="the.template"
        )
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="script")
      Suspense
        v-source-code.col(
          :key="the.id",
          @vue:unmounted="onUnmounted('js', 'script')",
          lang="javascript",
          v-model="the.script"
        )
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="style")
      Suspense
        v-source-code.col(
          :key="the.id",
          @vue:unmounted="onUnmounted('css', 'style')",
          lang="css",
          v-model="the.style"
        )
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
q-page.column.full-height.bg-light(v-else)
  q-inner-loading(showing)
    q-spinner-hourglass
</template>
<script setup lang="ts">
import type { QVueGlobals } from "quasar";
import type { TView } from "stores/data";
import type { ComputedRef, Ref, WritableComputedRef } from "vue";

import materialIcons from "@quasar/quasar-ui-qiconpicker/src/components/icon-set/mdi-v6";
import { useFileDialog } from "@vueuse/core";
import changefreq from "assets/changefreq.json";
import themes from "assets/themes.json";
import types from "assets/types.json";
import VInteractiveTree from "components/VInteractiveTree.vue";
import VSourceCode from "components/VSourceCode.vue";
import VWysiwyg from "components/VWysiwyg.vue";
import { useQuasar } from "quasar";
import { config, putImage, rightDrawer, save } from "stores/app";
import { $, views } from "stores/data";
import {
  accept,
  capture,
  filter,
  immediate,
  itemsPerPage,
  multiple,
  page,
  reset,
} from "stores/defaults";
import { base } from "stores/s3";
import { computed, ref, watch } from "vue";

const $q: QVueGlobals = useQuasar();
const show: Ref<boolean> = ref(false);
const pagination: Ref<object> = ref({ itemsPerPage, page });
const icons: Ref<object[]> = ref(
  (materialIcons as Record<string, object[]>).icons,
);
const the: ComputedRef<TView | undefined> = computed(
  () =>
    views.value.find(({ id }) => id === config.value.content.selected) ??
    views.value[0],
);
const onUnmounted = async (ext: string, key: keyof TView) => {
  save.call(the.value, ext, (await the.value?.[key]) as string);
};
const loc: WritableComputedRef<null | string> = computed({
  get(): null | string {
    return the.value?.loc ?? null;
  },
  set(value: null | string) {
    if (the.value) the.value.loc = value?.replace(/^\/|\/$/g, "") ?? null;
  },
});
const { files, open } = useFileDialog({ accept, capture, multiple, reset });
const click = () => {
  open();
};
watch(
  the,
  (newValue, oldValue) => {
    if (newValue !== oldValue) rightDrawer.value = newValue ? true : undefined;
  },
  { immediate },
);
watch(files, async (newFiles) => {
  const [file] = newFiles ?? [];
  if (the.value) {
    const { filePath, message } = await putImage(file);
    if (message) $q.notify({ message });
    else if (filePath) the.value.image = `/${filePath}`;
  }
});
</script>
