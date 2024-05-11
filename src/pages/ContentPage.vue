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
          :input-debounce,
          :options="types",
          clearable,
          hint="the.type",
          label="Тип содержимого страницы",
          v-model="the.type"
        )
        q-input(
          :debounce,
          hint="the.title",
          label="Заголовок страницы",
          v-model.trim="the.title"
        )
        q-input(
          :debounce,
          autogrow,
          hint="the.description",
          label="Описание страницы",
          type="textarea",
          v-model.trim="the.description"
        )
        q-select(
          :input-debounce,
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
          :debounce,
          :error="!!the.loc && !!views.find((element) => element.id !== the.id && (element.path === the.loc || element.loc === the.loc))",
          error-message="Такой путь уже используется",
          hint="the.loc",
          label="Постоянная ссылка",
          prefix="/",
          type="url",
          v-model.trim="loc"
        )
        q-select(
          :input-debounce,
          :options="changefreq",
          clearable,
          hint="the.changefreq",
          label="Частота обновления",
          v-model="the.changefreq"
        )
        q-input(
          :debounce,
          hint="the.priority",
          label="Приоритет",
          max="1",
          min="0",
          step="0.1",
          type="number",
          v-model.number="the.priority"
        )
        q-input(
          :debounce,
          clearable,
          hint="the.icon",
          label="Иконка",
          v-model.trim="the.icon"
        )
          template(#prepend)
            q-icon.cursor-pointer(:name="the.icon ?? 'mdi-tray-arrow-up'")
              q-popup-proxy.column.items-center.justify-center(v-model="show")
                q-input.q-ma-md(
                  :debounce,
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
          :debounce,
          autogrow,
          hint="the.alt",
          label="Описание картинки",
          type="textarea",
          v-model.trim="the.alt"
        )
        q-img.q-mt-md.rounded-borders(:ratio="16 / 9", :src, v-if="the.img")
          q-btn.all-pointer-events.absolute(
            @click="the.img = null",
            color="white",
            dense,
            icon="close",
            round,
            size="xs",
            style="top: 8px; right: 8px",
            text-color="black"
          )
          .absolute-bottom.text-center the.img
          template(#error)
            .absolute-full.flex-center.flex
              q-btn(
                @click="click",
                color="primary",
                label="Загрузить картинку"
              )
        q-img.q-mt-md.rounded-borders(:ratio="16 / 9", v-if="!the.img")
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
import type { TView } from "stores/data";
import type { ComputedRef, Ref } from "vue";

import materialIcons from "@quasar/quasar-ui-qiconpicker/src/components/icon-set/mdi-v6";
import { useFileDialog } from "@vueuse/core";
import changefreq from "assets/changefreq.json";
import mimes from "assets/mimes.json";
import types from "assets/types.json";
import VInteractiveTree from "components/VInteractiveTree.vue";
import VSourceCode from "components/VSourceCode.vue";
import VWysiwyg from "components/VWysiwyg.vue";
import mime from "mime";
import { uid, useQuasar } from "quasar";
import { config, rightDrawer, save, urls } from "stores/app";
import { $, views } from "stores/data";
import {
  accept,
  capture,
  debounce,
  filter,
  immediate,
  inputDebounce,
  itemsPerPage,
  multiple,
  page,
  reset,
} from "stores/defaults";
import { getObject, putFile } from "stores/s3";
import { computed, ref, watch } from "vue";

const $q = useQuasar();
const show = ref(false);
const pagination = ref({ itemsPerPage, page });
const icons = ref((materialIcons as Record<string, object[]>).icons);
const the: ComputedRef<TView | undefined> = computed(
  () =>
    views.value.find(({ id }) => id === config.value.content.selected) ??
    views.value[0],
);
const onUnmounted = async (ext: string, key: keyof TView) => {
  save.call(the.value, ext, (await the.value?.[key]) as string);
};
const loc = computed({
  get() {
    return the.value?.loc ?? null;
  },
  set(value) {
    if (the.value) the.value.loc = value?.replace(/^\/|\/$/g, "") ?? null;
  },
});
const { files, open } = useFileDialog({ accept, capture, multiple, reset });
const click = () => {
  open();
};
const src: Ref<string | undefined> = ref();
watch(
  the,
  async (value) => {
    if (value?.img) {
      if (!urls.has(value.img))
        urls.set(
          value.img,
          URL.createObjectURL(await (await getObject(value.img)).blob()),
        );
      src.value = urls.get(value.img);
    } else src.value = undefined;
  },
  { immediate },
);
const message =
  "Тип графического файла не подходит для использования в сети интернет";
watch(files, (value) => {
  if (value && the.value) {
    const [file] = value;
    const { type } = file;
    if (mimes.includes(type)) {
      const filePath = `images/${uid()}.${mime.getExtension(type) ?? ""}`;
      putFile(filePath, type, file).catch(() => {});
      urls.set(filePath, URL.createObjectURL(file));
      the.value.img = filePath;
      src.value = urls.get(filePath);
    } else $q.notify({ message });
  }
});
rightDrawer.value = true;
</script>
