<template lang="pug">
q-drawer(bordered, show-if-above, side="right", v-model="rightDrawer")
  q-list(v-if="data && the")
    q-expansion-item(
      default-opened,
      header-class="text-primary",
      icon="account_tree",
      label="Дерево рубрик"
    )
      v-interactive-tree(
        :list="views",
        :tree="data.content",
        v-model:expanded="config.expanded",
        v-model:selected="config.selected"
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
          q-select(
            hide-dropdown-icon,
            label="class",
            multiple,
            new-value-mode="add",
            stack-label,
            use-chips,
            use-input,
            v-model.trim="the.class"
          )
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
          hint="the.header",
          label="Заголовок страницы",
          v-model.trim="the.header"
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
          :error="!!the.loc && !!views.find((element) => element.id !== the?.id && (element.path === the?.loc || element.loc === the?.loc))",
          error-message="Такой путь уже используется",
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
          hint="the.lastmod",
          label="Дата последнего изменения",
          type="datetime-local",
          v-model="the.lastmod"
        )
        q-input(
          clearable,
          hint="the.icon",
          label="Иконка",
          v-model.trim="the.icon"
        )
          template(#prepend)
            Icon.cursor-pointer(:icon="the.icon ?? 'mdi:tray-arrow-up'")
            q-popup-proxy.column.items-center.justify-center
              q-input.q-ma-md(
                clearable,
                dense,
                label="Поиск...",
                v-model="filter"
              )
              q-icon-picker(
                :filter,
                :icons,
                dense,
                tooltips,
                v-model="icon",
                v-model:model-pagination="pagination"
              )
        q-input(
          autogrow,
          hint="the.alt",
          label="Описание картинки",
          type="textarea",
          v-model.trim="alt"
        )
        q-img.q-mt-md.rounded-borders(
          :ratio="16 / 9",
          :src,
          v-if="the.image[0]"
        )
          q-btn.all-pointer-events.absolute(
            @click="the.image.splice(0, 1)",
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
        q-img.q-mt-md.rounded-borders(:ratio="16 / 9", v-if="!the.image[0]")
          .absolute-full.flex-center.flex
            q-btn(@click="click", color="primary", label="Загрузить картинку")
q-page.column.full-height(v-if="the")
  q-tabs.text-grey(
    active-color="primary",
    align="justify",
    dense,
    indicator-color="primary",
    narrow-indicator,
    v-model="config.tab"
  )
    q-tab(label="wysiwyg", name="wysiwyg")
    q-tab(label="template", name="template")
    q-tab(:label="`script${the.setup ? ' setup' : ''}`", name="script")
    q-tab(:label="`style${the.scoped ? ' scoped' : ''}`", name="style")
  q-separator
  q-tab-panels.full-width.col(v-model="config.tab")
    q-tab-panel.column(name="wysiwyg")
      Suspense
        v-wysiwyg.full-width.col.column(:key="the.id", v-model="the.html")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="template")
      Suspense
        v-source-code.col(:key="the.id", v-model="the.template")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="script")
      Suspense
        v-source-code.col(
          :key="the.id",
          lang="javascript",
          v-model="the.script"
        )
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="style")
      Suspense
        v-source-code.col(:key="the.id", lang="css", v-model="the.style")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
q-page.column.full-height.bg-light(v-else)
  q-inner-loading(showing)
    q-spinner-hourglass
</template>
<script setup lang="ts">
import type { TConfig, TView } from "stores/types";
import type { ComputedRef, Ref } from "vue";

import mdi from "@quasar/quasar-ui-qiconpicker/src/components/icon-set/mdi-v6";
import { useFileDialog, useStorage } from "@vueuse/core";
import changefreq from "assets/changefreq.json";
import mimes from "assets/mimes.json";
import types from "assets/types.json";
import VInteractiveTree from "components/VInteractiveTree.vue";
import VSourceCode from "components/VSourceCode.vue";
import VWysiwyg from "components/VWysiwyg.vue";
import mime from "mime";
import { uid, useQuasar } from "quasar";
import { rightDrawer, urls } from "stores/app";
import { data, views } from "stores/data";
import {
  accept,
  capture,
  immediate,
  itemsPerPage,
  mergeDefaults,
  multiple,
  page,
  reset,
} from "stores/defaults";
import { bucket, getObject, putFile } from "stores/s3";
import { validateConfig } from "stores/types";
import { computed, ref, watch } from "vue";

const config = useStorage(
  `.${bucket.value}`,
  () => {
    const value = {} as TConfig;
    validateConfig(value);
    return value;
  },
  localStorage,
  { mergeDefaults },
);
const $q = useQuasar();
const filter = ref("");
const pagination = ref({ itemsPerPage, page });
const { icons } = mdi as Record<string, object[]>;
const the: ComputedRef<TView | undefined> = computed(
  () =>
    views.value.find(({ id }) => id === config.value.selected) ??
    views.value[0],
);
const alt = computed({
  get() {
    return the.value?.alt[0];
  },
  set(value) {
    if (the.value)
      if (value) the.value.alt[0] = value;
      else the.value.alt.splice(0, 1);
  },
});
const icon = computed({
  get() {
    return the.value?.icon?.replace(/^mdi:/, "mdi-");
  },
  set(value) {
    if (value && the.value) the.value.icon = value.replace(/^mdi-/, "mdi:");
  },
});
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
    if (value?.image[0]) {
      if (!urls.has(value.image[0]))
        urls.set(
          value.image[0],
          URL.createObjectURL(await (await getObject(value.image[0])).blob()),
        );
      src.value = urls.get(value.image[0]);
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
      the.value.image[0] = filePath;
      src.value = urls.get(filePath);
    } else $q.notify({ message });
  }
});
</script>
