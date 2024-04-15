<template lang="pug">
q-drawer(v-model="rightDrawer", bordered, side="right")
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
        :nodes="$?.content",
        :list="pages"
      )
    q-separator
    q-card(v-if="the", flat)
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
    q-card(v-if="the", flat)
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
            q-icon.cursor-pointer(:name="the?.icon ?? 'mdi-tray-arrow-up'")
              q-popup-proxy.column.items-center.justify-center(
                v-model="iconPicker.show"
              )
                q-input.q-ma-md(
                  v-model="iconPicker.filter",
                  label="Поиск...",
                  clearable,
                  dense
                )
                q-icon-picker(
                  v-model="the.icon",
                  v-model:model-pagination="iconPicker.pagination",
                  :filter="iconPicker?.filter",
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
          v-if="the?.image",
          :src="`${base}${the?.image}`",
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
            @click="delete the?.image"
          )
          .absolute-bottom.text-center the.image
        q-img.q-mt-md.rounded-borders(v-if="!the?.image", :ratio="16 / 9")
          .absolute-full.flex-center.flex
            q-btn(label="Загрузить картинку", color="primary", @click="open")
q-page.column.full-height
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
    q-tab(name="script", :label="`script${the?.setup ? ' setup' : ''}`")
    q-tab(name="style", :label="`style${the?.scoped ? ' scoped' : ''}`")
  q-separator
  q-tab-panels.full-width.col(v-model="config.content.tab")
    q-tab-panel.column(name="wysiwyg")
      v-wysiwyg.full-width.col.column(
        v-if="the",
        :key="the.id",
        v-model="the.html",
        :theme="the.theme",
        @vue:unmounted="onUnmounted(the, 'template', 'htm', the?.html)"
      )
    q-tab-panel.column(name="template")
      v-source-code.col(
        v-if="the",
        :key="the.id",
        v-model="the.htm",
        @vue:unmounted="onUnmounted(the, 'template', 'htm', the?.htm)"
      )
    q-tab-panel.column(name="script")
      v-source-code.col(
        v-if="the",
        :key="the.id",
        v-model="the.js",
        lang="javascript",
        @vue:unmounted="onUnmounted(the, 'script', 'js', the?.js)"
      )
    q-tab-panel.column(name="style")
      v-source-code.col(
        v-if="the",
        :key="the.id",
        v-model="the.css",
        lang="css",
        @vue:unmounted="onUnmounted(the, 'style', 'css', the?.css)"
      )
</template>
<script setup lang="ts">
// @ts-ignore
import materialIcons from "@quasar/quasar-ui-qiconpicker/src/components/icon-set/mdi-v6";
import { get, useFileDialog } from "@vueuse/core";
import mime from "mime";
import { uid, useQuasar } from "quasar";
import { computed, ref, watch } from "vue";

import changefreq from "@/assets/changefreq.json";
import mimes from "@/assets/mimes.json";
import themes from "@/assets/themes.json";
import types from "@/assets/types.json";
import VInteractiveTree from "@/components/VInteractiveTree.vue";
import VSourceCode from "@/components/VSourceCode.vue";
import VWysiwyg from "@/components/VWysiwyg.vue";
import { config, immediate, rightDrawer, save } from "@/stores/app";
import { base, putFile } from "@/stores/s3";
import type { TPage } from "~/monolit/src/stores/data";
import { $, pages } from "~/monolit/src/stores/data";

const $q = useQuasar();
const icons = ref(materialIcons.icons);

/**
 * @param {TPage} that - Текущий объект страницы
 * @param {string} key - Название свойства для хранения считанного файла
 * @param {string} ext - Расширение файла
 * @param {string} value - Новое содержимое файла
 */
const onUnmounted = async (
  that: TPage,
  key: string,
  ext: string,
  value: string,
) => {
  if (that) save(that, key, ext, await value);
};

const the = computed(() =>
  pages.value.find(({ id }) => id === config.value.content.selected),
);

const loc = computed({
  /** @returns {string} - Постоянная ссылка */
  get() {
    return get(the)?.loc;
  },
  /** @param {string} value - Новое значение постоянной ссылки */
  set(value) {
    if (the.value) the.value.loc = value?.replace(/^\/|\/$/g, "") ?? null;
  },
});
const iconPicker = ref({
  show: false,
  filter: "",
  pagination: {
    itemsPerPage: 75,
    page: 0,
  },
});
rightDrawer.value = true;
watch(
  () => $.content ?? [],
  ([{ id = null } = {}]) => {
    if (!config.value.content.expanded.length && id)
      config.value.content.expanded.push(id);
  },
  { immediate },
);
const { files, open } = useFileDialog({
  multiple: false,
  accept: "image/*",
  capture: "Выберите картинку",
  reset: true,
});
watch(files, async (newFiles) => {
  const [file] = newFiles ?? [];
  if (file)
    try {
      const { type } = file;
      if (mimes.includes(type)) {
        const filePath = `assets/${uid()}.${mime.getExtension(type)}`;
        await putFile(filePath, type, file);
        if (the.value) the.value.image = `/${filePath}`;
      } else
        throw new Error(
          "Тип графического файла не подходит для использования в сети интернет",
        );
    } catch (err) {
      const { message } = err as Error;
      $q.notify({ message });
    }
});
</script>
