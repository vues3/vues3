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
        :nodes="$.content",
        :list="pages"
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
          v-if="'theme' in (the ?? {})",
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
                q-checkbox(v-if="'full' in (the ?? {})", v-model="the.full")
              q-item-section
                q-item-label Полный экран
                q-item-label(caption) the.full
            q-item(v-ripple, tag="label")
              q-item-section(avatar)
                q-checkbox(v-if="'setup' in (the ?? {})", v-model="the.setup")
              q-item-section
                q-item-label script setup
                q-item-label(caption) the.setup
            q-item(v-ripple, tag="label")
              q-item-section(avatar)
                q-checkbox(
                  v-if="'scoped' in (the ?? {})",
                  v-model="the.scoped"
                )
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
          v-if="'type' in (the ?? {})",
          v-model="the.type",
          :options="types",
          label="Тип содержимого страницы",
          clearable,
          hint="the.type"
        )
        q-input(
          v-if="'title' in (the ?? {})",
          v-model.trim="the.title",
          label="Заголовок страницы",
          hint="the.title"
        )
        q-input(
          v-if="'description' in (the ?? {})",
          v-model.trim="the.description",
          type="textarea",
          autogrow,
          label="Описание страницы",
          hint="the.description"
        )
        q-select(
          v-if="'keywords' in (the ?? {})",
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
          v-if="'changefreq' in (the ?? {})",
          v-model="the.changefreq",
          :options="changefreq",
          label="Частота обновления",
          clearable,
          hint="the.changefreq"
        )
        q-input(
          v-if="'priority' in (the ?? {})",
          v-model.number="the.priority",
          label="Приоритет",
          type="number",
          min="0",
          max="1",
          step="0.1",
          hint="the.priority"
        )
        q-input(
          v-if="'icon' in (the ?? {})",
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
                  v-if="'icon' in (the ?? {})",
                  v-model="the.icon",
                  v-model:model-pagination="iconPicker.pagination",
                  :filter="iconPicker.filter",
                  :icons="icons",
                  tooltips,
                  dense
                )
        q-input(
          v-if="'alt' in (the ?? {})",
          v-model.trim="the.alt",
          type="textarea",
          autogrow,
          label="Описание картинки",
          hint="the.alt"
        )
        q-img.q-mt-md.rounded-borders(
          v-if="'image' in (the ?? {}) && the.image",
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
            @click="delete the?.image"
          )
          .absolute-bottom.text-center the.image
          template(#error)
            .absolute-full.flex-center.flex
              q-btn(label="Загрузить картинку", color="primary", @click="open")
        q-img.q-mt-md.rounded-borders(
          v-if="'image' in (the ?? {}) && !the.image",
          :ratio="16 / 9"
        )
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
        v-if="'html' in (the ?? {})",
        :key="the.id",
        v-model="the.html",
        :theme="the.theme",
        @vue:unmounted="onUnmounted('htm', 'template')"
      )
    q-tab-panel.column(name="template")
      v-source-code.col(
        v-if="'htm' in (the ?? {})",
        :key="the.id",
        v-model="the.template",
        @vue:unmounted="onUnmounted('htm', 'template')"
      )
    q-tab-panel.column(name="script")
      v-source-code.col(
        v-if="'js' in (the ?? {})",
        :key="the.id",
        v-model="the.script",
        lang="javascript",
        @vue:unmounted="onUnmounted('js', 'script')"
      )
    q-tab-panel.column(name="style")
      v-source-code.col(
        v-if="'css' in (the ?? {})",
        :key="the.id",
        v-model="the.style",
        lang="css",
        @vue:unmounted="onUnmounted('css', 'style')"
      )
</template>
<script setup lang="ts">
// @ts-ignore
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
import { config, pagination, putImage, rightDrawer, save } from "stores/app";
import type { TPage } from "stores/data";
import { $, pages } from "stores/data";
import {
  accept,
  capture,
  filter,
  immediate,
  multiple,
  reset,
  show,
} from "stores/defaults";
import { base } from "stores/s3";
import type { ComputedRef, Ref, WritableComputedRef } from "vue";
import { computed, ref, watch } from "vue";
/**
 * Объект quasar
 *
 * @type {QVueGlobals}
 */
const $q: QVueGlobals = useQuasar();
/**
 * Иконки для выбора
 *
 * @type {Ref<object>}
 */
const icons: Ref<object> = ref(materialIcons.icons);
/**
 * Выбранный объект страницы
 *
 * @type {ComputedRef<TPage | undefined>}
 */
const the: ComputedRef<TPage | undefined> = computed(() =>
  pages.value.find(({ id }) => id === config.value.content.selected),
);
/**
 * Функция экстренной записи при размонтировании
 *
 * @async
 * @function onUnmounted
 * @param {string} ext - Расширение файла
 * @param {keyof TPage} key - Новое содержимое файла
 */
const onUnmounted = async (ext: string, key: keyof TPage) => {
  save.call(the.value, ext, (await the.value?.[key]) as string);
};
/**
 * Значение постоянной ссылки
 *
 * @type {WritableComputedRef<string | null>}
 */
const loc: WritableComputedRef<string | null> = computed({
  /**
   * Получение постоянной ссылки
   *
   * @function get
   * @returns {string | null} - Постоянная ссылка
   */
  get(): string | null {
    return the.value?.loc ?? null;
  },
  /**
   * Запись постоянной ссылки
   *
   * @function set
   * @param {string | null} value - Новое значение постоянной ссылки
   */
  set(value: string | null) {
    if (the.value) the.value.loc = value?.replace(/^\/|\/$/g, "") ?? null;
  },
});
/**
 * Объект для виджета выбора иконки
 *
 * @type {Ref<object>}
 */
const iconPicker: Ref<object> = ref({ show, filter, pagination });
rightDrawer.value = true;
watch(
  () => $.content ?? [],
  ([{ id = null } = {}]) => {
    if (!config.value.content.expanded.length && id)
      config.value.content.expanded.push(id);
  },
  { immediate },
);
const { files, open } = useFileDialog({ multiple, accept, capture, reset });
watch(files, async (newFiles) => {
  const [file] = newFiles ?? [];
  if (file && the.value) {
    const { filePath, message } = await putImage(file);
    if (message) $q.notify({ message });
    else the.value.image = `/${filePath}`;
  }
});
</script>
