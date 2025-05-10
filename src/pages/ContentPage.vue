<template lang="pug">
q-drawer(v-model="rightDrawer", bordered, show-if-above, side="right")
  q-list(v-if="nodes && the")
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
          q-item(v-ripple, tag="label")
            q-item-section(avatar)
              q-checkbox(v-model="the.flat")
            q-item-section
              q-item-label flat
              q-item-label(caption) flat
          q-select(
            v-model.trim="the.class",
            hide-dropdown-icon,
            label="class",
            multiple,
            new-value-mode="add",
            stack-label,
            use-chips,
            use-input
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
          v-model="the.type",
          :label="t('The type of media of your content')",
          :options="types",
          clearable,
          hint="type"
        )
        q-input(
          v-model.trim="the.header",
          :label="t('Page Header')",
          hint="header",
          clearable
        )
        q-input(
          v-model.trim="the.description",
          :label="t('Page Description')",
          autogrow,
          hint="description",
          type="textarea",
          clearable
        )
        q-select(
          v-model.trim="the.keywords",
          :label="t('Keywords')",
          hide-dropdown-icon,
          hint="keywords",
          multiple,
          new-value-mode="add",
          stack-label,
          use-chips,
          use-input
        )
        q-input(
          v-model.trim="loc",
          :rules,
          :label="t('Permanent Link')",
          hint="loc",
          prefix="/",
          type="url",
          clearable
        )
        q-select(
          v-model="the.changefreq",
          :label="t('Change Frequency')",
          :options="changefreq",
          clearable,
          hint="changefreq"
        )
        q-input(
          v-model.number="the.priority",
          :label="t('Priority')",
          hint="priority",
          max="1",
          min="0",
          step="0.1",
          type="number"
        )
        q-input(
          v-model="the.lastmod",
          :label="t('Last Modification')",
          clearable,
          hint="lastmod",
          type="datetime-local"
        )
        q-input(
          v-model.trim="the.icon",
          :label="t('Icon')",
          clearable,
          hint="icon"
        )
          template(#prepend)
            Icon.q-icon.cursor-pointer(:icon="the.icon || 'mdi:tray-arrow-up'")
            q-popup-proxy.column.items-center.justify-center
              q-input.q-ma-md(
                v-model="filter",
                :label="t('Search...')",
                clearable,
                dense
              )
              q-icon-picker(
                v-model="icon",
                v-model:model-pagination="pagination",
                :filter,
                :icons,
                dense,
                tooltips
              )
q-page.column.full-height(v-if="the")
  q-tabs.text-grey(
    v-model="tab",
    active-color="primary",
    align="justify",
    dense,
    indicator-color="primary",
    narrow-indicator
  )
    q-tab(label="wysiwyg", name="wysiwyg")
    q-tab(label="vue", name="vue")
    q-tab(label="json-ld", name="jsonld")
    q-tab(label="images", name="images")
  q-separator
  q-tab-panels.full-width.col(v-model="tab")
    q-tab-panel.column(name="wysiwyg")
      Suspense
        v-wysiwyg(:id="the.id", v-model="the.html")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel(name="vue")
      Suspense
        v-source-code(:model="the.sfc")
          template(#fallback)
            q-inner-loading(showing)
              q-spinner-hourglass
    q-tab-panel(name="jsonld")
      Suspense
        v-source-code(:model="the.jsonld")
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
import type { IconNameArray } from "@quasar/quasar-ui-qiconpicker";
import type { ValidationRule } from "quasar";

import { Icon } from "@iconify/vue";
import mdi from "@quasar/quasar-ui-qiconpicker/src/components/icon-set/mdi-v6";
import { nodes, pages } from "@vues3/shared";
import changefreq from "assets/changefreq.json";
import types from "assets/types.json";
import VImages from "components/VImages.vue";
import VInteractiveTree from "components/VInteractiveTree.vue";
import VWysiwyg from "components/VWysiwyg.vue";
import VSourceCode from "src/components/VSourceCode.vue";
import { rightDrawer, the } from "stores/app";
import { itemsPerPage, page } from "stores/defaults";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

/* -------------------------------------------------------------------------- */

const { icons } = mdi as Record<"icons", IconNameArray>,
  { t } = useI18n();

/* -------------------------------------------------------------------------- */

const filter = ref(""),
  icon = computed({
    get() {
      return the.value?.icon?.replace(/^mdi:/, "mdi-");
    },
    set(value) {
      if (value && the.value) the.value.icon = value.replace(/^mdi-/, "mdi:");
    },
  }),
  loc = computed({
    get() {
      return the.value?.loc ?? null;
    },
    set(value) {
      if (the.value)
        the.value.loc = value?.replace(/((?=(\/+))\2)$|(^\/+)/g, "") ?? null;
    },
  }),
  pagination = ref({ itemsPerPage, page }),
  rules: ValidationRule[] = [
    (v) =>
      !(
        !!v &&
        !!pages.value.find(
          (element) =>
            element.path === v ||
            (element.id !== the.value?.id && element.loc === v),
        )
      ) || t("That name is already in use"),
    (v: null | string) =>
      !["?", "\\", "#"].some((value) => v?.includes(value)) ||
      t("Prohibited characters are used"),
  ],
  tab = ref("wysiwyg");
</script>
