<template lang="pug">
q-drawer(v-model="rightDrawer", bordered, side="right")
  q-card(flat)
    q-item.text-teal
      q-item-section(avatar)
        q-icon(name="travel_explore")
      q-item-section
        q-item-label Настройки панели навигации
    q-card-section
      q-select(
        v-if="$.navbar?.theme !== undefined",
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
              q-checkbox(
                v-if="$.navbar?.setup !== undefined",
                v-model="$.navbar.setup"
              )
            q-item-section
              q-item-label script setup
          q-item(v-ripple, tag="label")
            q-item-section(avatar)
              q-checkbox(
                v-if="$.navbar?.scoped !== undefined",
                v-model="$.navbar.scoped"
              )
            q-item-section
              q-item-label style scoped
      q-select(
        v-if="$.navbar?.classes !== undefined",
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
        v-if="$.navbar?.scrollClasses !== undefined",
        v-model.trim="$.navbar.scrollClasses",
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
q-page.column.full-height
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
      v-source-code.col(
        v-if="$.navbar?.template !== undefined",
        v-model="$.navbar.template"
      )
    q-tab-panel.column(name="script")
      v-source-code.col(
        v-if="$.navbar?.script !== undefined",
        v-model="$.navbar.script",
        lang="javascript"
      )
    q-tab-panel.column(name="style")
      v-source-code.col(
        v-if="$.navbar?.style !== undefined",
        v-model="$.navbar.style",
        lang="css"
      )
</template>
<script setup lang="ts">
import type {
  QDialogSelectionPrompt,
  QOptionGroupProps,
  QVueGlobals,
  SelectionPromptType,
} from "quasar";
import { useQuasar } from "quasar";

import themes from "@/assets/themes.json";
import VSourceCode from "@/components/VSourceCode.vue";
import Navbar from "@/schemas/navbar";
import { config, rightDrawer } from "@/stores/app";
import type { TNavbar } from "@/stores/data";
import { $, validateNavbar } from "@/stores/data";
import { cancel, persistent } from "@/stores/defaults";

/**
 * Объект quasar
 *
 * @type {QVueGlobals}
 */
const $q: QVueGlobals = useQuasar();

/**
 * A text for the heading title of the dialog
 *
 * @constant
 * @default
 * @type {string}
 */
const title: string = "Сброс навбара";

/**
 * A text with more information about what needs to be input, selected or
 * confirmed.
 *
 * @constant
 * @default
 * @type {string}
 */
const message: string = "Выбор сбрасываемых параметров:";

/**
 * Тип элементов диалога
 *
 * @constant
 * @default
 * @type {string}
 */
const type: SelectionPromptType = "checkbox";

/** @type {[]} */
const model: [] = [];

/**
 * Список элементов формы
 *
 * @type {QOptionGroupProps["options"]}
 */
const items: QOptionGroupProps["options"] = Object.entries(Navbar.properties)
  .map(([key, { description }]) => ({ label: description, value: key }))
  .filter(({ label }) => label);

/**
 * Dialog options
 *
 * @type {QDialogSelectionPrompt}
 */
const options: QDialogSelectionPrompt = { type, model, items };

/** Сброс параметров навбара */
const resetNavbar = () => {
  $q.dialog({ title, message, options, cancel, persistent }).onOk(
    (value: string[]) => {
      value.forEach((element) => {
        delete $.navbar?.[element as keyof TNavbar];
      });
      validateNavbar?.($.navbar);
    },
  );
};

rightDrawer.value = true;
</script>
