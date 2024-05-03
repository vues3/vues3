<template lang="pug">
q-drawer(bordered, side="right", v-if="$?.navbar", v-model="rightDrawer")
  q-card(flat)
    q-item.text-teal
      q-item-section(avatar)
        q-icon(name="travel_explore")
      q-item-section
        q-item-label Настройки панели навигации
    q-card-section
      q-select(
        :options="themes",
        clearable,
        label="Цветовая тема",
        v-model="$.navbar.theme"
      )
        template(#prepend)
          q-icon(name="mdi-theme-light-dark")
      .q-pt-md
        q-list
          q-item(tag="label", v-ripple)
            q-item-section(avatar)
              q-checkbox(v-model="$.navbar.setup")
            q-item-section
              q-item-label script setup
          q-item(tag="label", v-ripple)
            q-item-section(avatar)
              q-checkbox(v-model="$.navbar.scoped")
            q-item-section
              q-item-label style scoped
      q-select(
        hide-dropdown-icon,
        label="Классы навигатора",
        multiple,
        new-value-mode="add",
        stack-label,
        use-chips,
        use-input,
        v-model.trim="$.navbar.classes"
      )
      q-select(
        hide-dropdown-icon,
        label="Скролл классы",
        multiple,
        new-value-mode="add",
        stack-label,
        use-chips,
        use-input,
        v-model.trim="$.navbar.scroll"
      )
      q-btn.full-width.q-ma-md(
        @click="resetNavbar",
        color="primary",
        icon="sync",
        outline,
        rounded
      ) Сброс параметров
q-page.column.full-height(v-if="$?.navbar")
  q-tabs.text-grey(
    active-color="primary",
    align="justify",
    dense,
    indicator-color="primary",
    narrow-indicator,
    v-model="config.navbar.tab"
  )
    q-tab(label="template", name="template")
    q-tab(:label="`script${$.navbar?.setup ? ' setup' : ''}`", name="script")
    q-tab(:label="`style${$.navbar?.scoped ? ' scoped' : ''}`", name="style")
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
        v-source-code.col(lang="javascript", v-model="$.navbar.script")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
    q-tab-panel.column(name="style")
      Suspense
        v-source-code.col(lang="css", v-model="$.navbar.style")
        template(#fallback)
          q-inner-loading(showing)
            q-spinner-hourglass
</template>
<script setup lang="ts">
import type {
  QDialogSelectionPrompt,
  QOptionGroupProps,
  QVueGlobals,
  SelectionPromptType,
} from "quasar";
import type { TNavbar } from "stores/data";

import themes from "assets/themes.json";
import VSourceCode from "components/VSourceCode.vue";
import { useQuasar } from "quasar";
import Navbar from "src/schemas/navbar";
import { config, rightDrawer } from "stores/app";
import { $, validateNavbar } from "stores/data";
import { cancel, persistent } from "stores/defaults";

const $q: QVueGlobals = useQuasar();
const title = "Сброс навбара";
const message = "Выбор сбрасываемых параметров:";
const type: SelectionPromptType = "checkbox";
const model: [] = [];
const items: QOptionGroupProps["options"] = Object.entries(Navbar.properties)
  .map(([key, { description }]) => ({ label: description, value: key }))
  .filter(({ label }) => label);
const options: QDialogSelectionPrompt = { items, model, type };
const resetNavbar = () => {
  $q.dialog({ cancel, message, options, persistent, title }).onOk(
    (value: string[]) => {
      value.forEach((element) => {
        delete $.value?.navbar?.[element as keyof TNavbar];
      });
      validateNavbar($.value?.navbar);
    },
  );
};
rightDrawer.value = true;
</script>
