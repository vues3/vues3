<template lang="pug">
q-drawer(v-if="$?.navbar", v-model="rightDrawer", bordered, side="right")
  q-card(flat)
    q-item.text-teal
      q-item-section(avatar)
        q-icon(name="travel_explore")
      q-item-section
        q-item-label Настройки панели навигации
    q-card-section
      q-select(
        v-model="$.navbar.theme",
        label="Цветовая тема",
        :options="themes",
        clearable
      )
        template(#prepend)
          q-icon(name="mdi-theme-light-dark")
      .q-pt-md
        q-list
          q-item(v-ripple, tag="label")
            q-item-section(avatar)
              q-checkbox(v-model="$.navbar.setup")
            q-item-section
              q-item-label script setup
          q-item(v-ripple, tag="label")
            q-item-section(avatar)
              q-checkbox(v-model="$.navbar.scoped")
            q-item-section
              q-item-label style scoped
      q-select(
        v-model.trim="$.navbar.classes",
        multiple,
        use-chips,
        use-input,
        new-value-mode="add",
        stack-label,
        hide-dropdown-icon,
        label="Классы навигатора"
      )
      q-select(
        v-model.trim="$.navbar.scroll",
        multiple,
        use-chips,
        use-input,
        new-value-mode="add",
        stack-label,
        hide-dropdown-icon,
        label="Скролл классы"
      )
      q-btn.full-width.q-ma-md(
        outline,
        rounded,
        color="primary",
        icon="sync",
        @click="resetNavbar"
      ) Сброс параметров
q-page.column.full-height(v-if="$?.navbar")
  q-tabs.text-grey(
    v-model="config.navbar.tab",
    dense,
    active-color="primary",
    indicator-color="primary",
    align="justify",
    narrow-indicator
  )
    q-tab(name="template", label="template")
    q-tab(name="script", :label="`script${$.navbar?.setup ? ' setup' : ''}`")
    q-tab(name="style", :label="`style${$.navbar?.scoped ? ' scoped' : ''}`")
  q-separator
  q-tab-panels.full-width.col(v-model="config.navbar.tab")
    q-tab-panel.column(name="template")
      Suspense
        v-source-code.col(v-model="$.navbar.template")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="script")
      Suspense
        v-source-code.col(v-model="$.navbar.script", lang="javascript")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="style")
      Suspense
        v-source-code.col(v-model="$.navbar.style", lang="css")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
</template>
<script setup lang="ts">
import themes from "assets/themes.json";
import VSourceCode from "components/VSourceCode.vue";
import type {
  QDialogSelectionPrompt,
  QOptionGroupProps,
  QVueGlobals,
  SelectionPromptType,
} from "quasar";
import { useQuasar } from "quasar";
import Navbar from "src/schemas/navbar";
import { config, rightDrawer } from "stores/app";
import type { TNavbar } from "stores/data";
import { $, validateNavbar } from "stores/data";
import { cancel, persistent } from "stores/defaults";
/** Объект quasar */
const $q: QVueGlobals = useQuasar();
/**
 * A text for the heading title of the dialog
 *
 * @default
 */
const title: string = "Сброс навбара";
/**
 * A text with more information about what needs to be input, selected or
 * confirmed.
 *
 * @default
 */
const message: string = "Выбор сбрасываемых параметров:";
/**
 * Тип элементов диалога
 *
 * @default
 */
const type: SelectionPromptType = "checkbox";
const model: [] = [];
/** Список элементов формы */
const items: QOptionGroupProps["options"] = Object.entries(Navbar.properties)
  .map(([key, { description }]) => ({ label: description, value: key }))
  .filter(({ label }) => label);
/** Dialog options */
const options: QDialogSelectionPrompt = { type, model, items };
/** Сброс параметров навбара */
const resetNavbar = () => {
  $q.dialog({ title, message, options, cancel, persistent }).onOk(
    (value: string[]) => {
      value.forEach((element) => {
        delete $.value?.navbar?.[<keyof TNavbar>element];
      });
      validateNavbar($.value?.navbar);
    },
  );
};
rightDrawer.value = true;
</script>
