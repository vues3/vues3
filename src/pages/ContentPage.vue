<template lang="pug">
q-drawer(bordered, show-if-above, side="right", v-model="rightDrawer")
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
          q-item(tag="label", v-ripple)
            q-item-section(avatar)
              q-checkbox(v-model="the.along")
            q-item-section
              q-item-label along
              q-item-label(caption) along
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
          hint="type",
          v-model="the.type"
        )
        q-input(
          :label="t('Page Header')",
          hint="header",
          v-model.trim="the.header"
        )
        q-input(
          :label="t('Page Description')",
          autogrow,
          hint="description",
          type="textarea",
          v-model.trim="the.description"
        )
        q-select(
          :label="t('Keywords')",
          hide-dropdown-icon,
          hint="keywords",
          multiple,
          new-value-mode="add",
          stack-label,
          use-chips,
          use-input,
          v-model.trim="the.keywords"
        )
        q-input(
          :rules,
          :label="t('Permanent Link')",
          hint="loc",
          prefix="/",
          type="url",
          v-model.trim="loc"
        )
        q-select(
          :label="t('Change Frequency')",
          :options="changefreq",
          clearable,
          hint="changefreq",
          v-model="the.changefreq"
        )
        q-input(
          :label="t('Priority')",
          hint="priority",
          max="1",
          min="0",
          step="0.1",
          type="number",
          v-model.number="the.priority"
        )
        q-input(
          :label="t('Last Modification')",
          clearable,
          hint="lastmod",
          type="datetime-local",
          v-model="the.lastmod"
        )
        q-input(
          :label="t('Icon')",
          clearable,
          hint="icon",
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
    q-tab(label="vue", name="vue")
    q-tab(label="images", name="images")
  q-separator
  q-tab-panels.full-width.col(v-model="tab")
    q-tab-panel.column(name="wysiwyg")
      Suspense
        v-wysiwyg.full-width.col.column(v-model="the.html", :id="the.id")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel(name="vue")
      Suspense
        v-source-code(:model="the.sfc")
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
/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { IconNameArray, Pagination } from "@quasar/quasar-ui-qiconpicker";
import type { ValidationRule } from "quasar";
import type { Ref, WritableComputedRef } from "vue";
import type { ComposerTranslation } from "vue-i18n";

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
/*                                 Composables                                */
/* -------------------------------------------------------------------------- */

const { t }: { t: ComposerTranslation } = useI18n();

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const nameInUse: ValidationRule = (v) =>
  !(
    !!v &&
    !!pages.value.find(
      (element) =>
        element.id !== the.value?.id &&
        (element.path === v || element.loc === v),
    )
  ) || t("That name is already in use");

/* -------------------------------------------------------------------------- */

const prohibitedCharacters: ValidationRule = (v: null | string) =>
  !["?", "\\", "#"].some((value) => v?.includes(value)) ||
  t("Prohibited characters are used");

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const { icons }: { icons: IconNameArray } = mdi as Record<
  "icons",
  IconNameArray
>;

/* -------------------------------------------------------------------------- */

const rules: ValidationRule[] = [nameInUse, prohibitedCharacters];

/* -------------------------------------------------------------------------- */
/*                                 References                                 */
/* -------------------------------------------------------------------------- */

const filter: Ref<string> = ref("");

/* -------------------------------------------------------------------------- */

const tab: Ref<string> = ref("wysiwyg");

/* -------------------------------------------------------------------------- */

const pagination: Ref<Pagination> = ref({ itemsPerPage, page });

/* -------------------------------------------------------------------------- */
/*                                Computations                                */
/* -------------------------------------------------------------------------- */

const icon: WritableComputedRef<null | string> = computed({
  get() {
    return the.value?.icon?.replace(/^mdi:/, "mdi-") ?? null;
  },
  set(value) {
    if (value && the.value) the.value.icon = value.replace(/^mdi-/, "mdi:");
  },
});

/* -------------------------------------------------------------------------- */

const loc: WritableComputedRef<null | string> = computed({
  get() {
    return the.value?.loc ?? null;
  },
  set(value) {
    if (the.value)
      the.value.loc = value?.replace(/((?=(\/+))\2)$|(^\/+)/g, "") ?? null;
  },
});

/* -------------------------------------------------------------------------- */
</script>
