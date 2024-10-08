<template lang="pug">
q-drawer(bordered, show-if-above, side="right", v-model="rightDrawer")
  q-list(v-if="data && the")
    q-expansion-item(
      :label="t('Content Tree')",
      default-opened,
      header-class="text-primary",
      icon="account_tree"
    )
      v-interactive-tree
    q-separator
    q-card(flat)
      q-item.text-teal
        q-item-section(avatar)
          q-icon(name="description")
        q-item-section
          q-item-label {{ t("Page Settings") }}
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
          q-item(tag="label", v-ripple)
            q-item-section(avatar)
              q-checkbox(v-model="the.along")
            q-item-section
              q-item-label along
              q-item-label(caption) the.along
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
          q-item-label {{ t("SEO Settings") }}
      q-card-section
        q-select(
          :label="t('The type of media of your content')",
          :options="types",
          clearable,
          hint="the.type",
          v-model="the.type"
        )
        q-input(
          :label="t('Page Header')",
          hint="the.header",
          v-model.trim="the.header"
        )
        q-input(
          :label="t('Page Description')",
          autogrow,
          hint="the.description",
          type="textarea",
          v-model.trim="the.description"
        )
        q-select(
          :label="t('Keywords')",
          hide-dropdown-icon,
          hint="the.keywords",
          multiple,
          new-value-mode="add",
          stack-label,
          use-chips,
          use-input,
          v-model.trim="the.keywords"
        )
        q-input(
          :error="error()",
          :error-message="errorMessage()",
          :label="t('Permanent Link')",
          hint="the.loc",
          prefix="/",
          type="url",
          v-model.trim="loc"
        )
        q-select(
          :label="t('Change Frequency')",
          :options="changefreq",
          clearable,
          hint="the.changefreq",
          v-model="the.changefreq"
        )
        q-input(
          :label="t('Priority')",
          hint="the.priority",
          max="1",
          min="0",
          step="0.1",
          type="number",
          v-model.number="the.priority"
        )
        q-input(
          :label="t('Last Modification')",
          clearable,
          hint="the.lastmod",
          type="datetime-local",
          v-model="the.lastmod"
        )
        q-input(
          :label="t('Icon')",
          clearable,
          hint="the.icon",
          v-model.trim="the.icon"
        )
          template(#prepend)
            Icon.q-icon.cursor-pointer(:icon="the.icon || 'mdi:tray-arrow-up'")
            q-popup-proxy.column.items-center.justify-center
              q-input.q-ma-md(
                :label="t('Search...')",
                clearable,
                dense,
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
q-page.column.full-height(v-if="the")
  q-tabs.text-grey(
    active-color="primary",
    align="justify",
    dense,
    indicator-color="primary",
    narrow-indicator,
    v-model="tab"
  )
    q-tab(label="wysiwyg", name="wysiwyg")
    q-tab(label="template", name="template")
    q-tab(:label="`script${the.setup ? ' setup' : ''}`", name="script")
    q-tab(:label="`style${the.scoped ? ' scoped' : ''}`", name="style")
    q-tab(label="images", name="images")
  q-separator
  q-tab-panels.full-width.col(v-model="tab")
    q-tab-panel.column(name="wysiwyg")
      Suspense
        v-wysiwyg.full-width.col.column(:key="the.id", v-model="the.html")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel(name="template")
      Suspense
        v-source-code(:key="the.id", language="html", v-model="the.template")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel(name="script")
      Suspense
        v-source-code(
          :key="the.id",
          language="javascript",
          v-model="the.script"
        )
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel(name="style")
      Suspense
        v-source-code(:key="the.id", language="css", v-model="the.style")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel(name="images")
      v-images
q-page.column.full-height.bg-light(v-else)
  q-inner-loading(showing)
    q-spinner-hourglass
</template>
<script setup lang="ts">
import { Icon } from "@iconify/vue";
import mdi from "@quasar/quasar-ui-qiconpicker/src/components/icon-set/mdi-v6";
import changefreq from "assets/changefreq.json";
import types from "assets/types.json";
import VImages from "components/VImages.vue";
import VInteractiveTree from "components/VInteractiveTree.vue";
import VSourceCode from "components/VSourceCode.vue";
import VWysiwyg from "components/VWysiwyg.vue";
import { rightDrawer, the } from "stores/app";
import { data, pages } from "stores/data";
import { itemsPerPage, page } from "stores/defaults";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const filter = ref("");
const tab = ref("template");
const pagination = ref({ itemsPerPage, page });
const { icons } = mdi as Record<string, object[]>;
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
    if (the.value)
      the.value.loc = value?.replace(/((?=(\/+))\2)$|(^\/+)/g, "") ?? null;
  },
});
const errors = [
  () =>
    !!the.value?.loc &&
    !!pages.value.find(
      (element) =>
        element.id !== the.value?.id &&
        (element.path === the.value?.loc || element.loc === the.value?.loc),
    ),
  () => ["?", "\\", "#"].some((value) => the.value?.loc?.includes(value)),
];
const error = () =>
  errors.map((value) => value()).reduceRight((a, b) => a || b);
const errorMessage = () => {
  switch (true) {
    case errors[0]():
      return t("That name is already in use");
    case errors[1]():
      return t("Prohibited characters are used");
    default:
      return undefined;
  }
};
</script>
