<template lang="pug">
q-drawer(v-if="the", v-model="rightDrawer", bordered, side="right")
  q-list
    q-expansion-item(
      icon="account_tree",
      label="Дерево рубрик",
      default-opened,
      header-class="text-primary"
    )
      v-interactive-tree(
        v-model:selected="config.content.selected",
        v-model:expanded="config.content.expanded",
        :tree="$.content",
        :list="views"
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
          v-model="the.theme",
          label="Цветовая тема",
          :options="themes",
          clearable,
          hint="the.theme"
        )
          template(#prepend)
            q-icon(name="mdi-theme-light-dark")
        .q-pt-md
          q-list
            q-item(v-ripple, tag="label")
              q-item-section(avatar)
                q-checkbox(v-model="the.full")
              q-item-section
                q-item-label Полный экран
                q-item-label(caption) the.full
            q-item(v-ripple, tag="label")
              q-item-section(avatar)
                q-checkbox(v-model="the.setup")
              q-item-section
                q-item-label script setup
                q-item-label(caption) the.setup
            q-item(v-ripple, tag="label")
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
          v-model="the.type",
          :options="types",
          label="Тип содержимого страницы",
          clearable,
          hint="the.type"
        )
        q-input(
          v-model.trim="the.title",
          label="Заголовок страницы",
          hint="the.title"
        )
        q-input(
          v-model.trim="the.description",
          type="textarea",
          autogrow,
          label="Описание страницы",
          hint="the.description"
        )
        q-select(
          v-model.trim="the.keywords",
          multiple,
          use-chips,
          use-input,
          new-value-mode="add",
          stack-label,
          hide-dropdown-icon,
          label="Ключевые слова",
          hint="the.keywords"
        )
        q-input(
          v-model.trim="loc",
          prefix="/",
          label="Постоянная ссылка",
          type="url",
          hint="the.loc"
        )
        q-select(
          v-model="the.changefreq",
          :options="changefreq",
          label="Частота обновления",
          clearable,
          hint="the.changefreq"
        )
        q-input(
          v-model.number="the.priority",
          label="Приоритет",
          type="number",
          min="0",
          max="1",
          step="0.1",
          hint="the.priority"
        )
        q-input(
          v-model.trim="the.icon",
          label="Иконка",
          clearable,
          hint="the.icon"
        )
          template(#prepend)
            q-icon.cursor-pointer(:name="the.icon ?? 'mdi-tray-arrow-up'")
              q-popup-proxy.column.items-center.justify-center(v-model="show")
                q-input.q-ma-md(
                  v-model="filter",
                  label="Поиск...",
                  clearable,
                  dense
                )
                q-icon-picker(
                  v-model="the.icon",
                  v-model:model-pagination="pagination",
                  :filter="filter",
                  :icons="icons",
                  tooltips,
                  dense
                )
        q-input(
          v-model.trim="the.alt",
          type="textarea",
          autogrow,
          label="Описание картинки",
          hint="the.alt"
        )
        q-img.q-mt-md.rounded-borders(
          v-if="the.image",
          :src="`${base}${the.image}`",
          :ratio="16 / 9"
        )
          q-btn.all-pointer-events.absolute(
            size="xs",
            icon="close",
            round,
            color="white",
            text-color="black",
            dense,
            style="top: 8px; right: 8px",
            @click="the.image = null"
          )
          .absolute-bottom.text-center the.image
          template(#error)
            .absolute-full.flex-center.flex
              q-btn(
                label="Загрузить картинку",
                color="primary",
                @click="click"
              )
        q-img.q-mt-md.rounded-borders(v-if="!the.image", :ratio="16 / 9")
          .absolute-full.flex-center.flex
            q-btn(label="Загрузить картинку", color="primary", @click="click")
q-page.column.full-height(v-if="the")
  q-tabs.text-grey(
    v-model="config.content.tab",
    dense,
    active-color="primary",
    indicator-color="primary",
    align="justify",
    narrow-indicator
  )
    q-tab(name="wysiwyg", label="wysiwyg")
    q-tab(name="template", label="template")
    q-tab(name="script", :label="`script${the.setup ? ' setup' : ''}`")
    q-tab(name="style", :label="`style${the.scoped ? ' scoped' : ''}`")
  q-separator
  q-tab-panels.full-width.col(v-model="config.content.tab")
    q-tab-panel.column(name="wysiwyg")
      Suspense
        v-wysiwyg.full-width.col.column(
          :key="the.id",
          v-model="the.html",
          @vue:unmounted="onUnmounted('htm', 'template')"
        )
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="template")
      Suspense
        v-source-code.col(
          :key="the.id",
          v-model="the.template",
          @vue:unmounted="onUnmounted('htm', 'template')"
        )
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="script")
      Suspense
        v-source-code.col(
          :key="the.id",
          v-model="the.script",
          lang="javascript",
          @vue:unmounted="onUnmounted('js', 'script')"
        )
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="style")
      Suspense
        v-source-code.col(
          :key="the.id",
          v-model="the.style",
          lang="css",
          @vue:unmounted="onUnmounted('css', 'style')"
        )
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
q-page.column.full-height.bg-light(v-else)
  q-inner-loading(showing)
    q-spinner-hourglass
</template>
<script setup lang="ts">
import materialIcons from "@quasar/quasar-ui-qiconpicker/src/components/icon-set/mdi-v6";
import { useFileDialog } from "@vueuse/core";
import changefreq from "assets/changefreq.json";
import themes from "assets/themes.json";
import types from "assets/types.json";
import VInteractiveTree from "components/VInteractiveTree.vue";
import VSourceCode from "components/VSourceCode.vue";
import VWysiwyg from "components/VWysiwyg.vue";
import type { QVueGlobals } from "quasar";
import { useQuasar } from "quasar";
import { config, putImage, rightDrawer, save } from "stores/app";
import type { TView } from "stores/data";
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
import type { ComputedRef, Ref, WritableComputedRef } from "vue";
import { computed, ref, watch } from "vue";

const $q: QVueGlobals = useQuasar();
const show: Ref<boolean> = ref(false);
const pagination: Ref<object> = ref({ itemsPerPage, page });
const icons: Ref<object[]> = ref(
  (<Record<string, object[]>>materialIcons).icons,
);
const the: ComputedRef<TView | undefined> = computed(
  () =>
    views.value.find(({ id }) => id === config.value.content.selected) ??
    views.value[0],
);
const onUnmounted = async (ext: string, key: keyof TView) => {
  save.call(the.value, ext, <string>await the.value?.[key]);
};
const loc: WritableComputedRef<string | null> = computed({
  get(): string | null {
    return the.value?.loc ?? null;
  },
  set(value: string | null) {
    if (the.value) the.value.loc = value?.replace(/^\/|\/$/g, "") ?? null;
  },
});
const { files, open } = useFileDialog({ multiple, accept, capture, reset });
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
