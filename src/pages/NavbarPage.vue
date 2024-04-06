<template lang="pug">
q-drawer(v-model="state.rightDrawer", bordered, side="right")
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
        @click="fncResetNavbar"
      ) Сброс параметров
q-page.column.full-height
  q-tabs.text-grey(
    v-model="navbarTabs",
    dense,
    active-color="primary",
    indicator-color="primary",
    align="justify",
    narrow-indicator
  )
    q-tab(name="template", label="template")
    q-tab(name="script", :label="`script${$?.navbar?.setup ? ' setup' : ''}`")
    q-tab(name="style", :label="`style${$?.navbar?.scoped ? ' scoped' : ''}`")
  q-separator
  q-tab-panels.full-width.col(v-model="navbarTabs")
    q-tab-panel.column(name="template")
      v-source-code.col(v-model="$.navbar.template")
    q-tab-panel.column(name="script")
      v-source-code.col(v-model="$.navbar.script", lang="javascript")
    q-tab-panel.column(name="style")
      v-source-code.col(v-model="$.navbar.style", lang="css")
</template>
<script setup>
import { get, useStorage } from "@vueuse/core";
import Ajv from "ajv";
import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";

import themes from "@/assets/themes.json";
import VSourceCode from "@/components/VSourceCode.vue";
import Navbar from "@/schemas/navbar";
import app from "@/stores/app";
import data from "~/monolit/src/stores/data";

const $q = useQuasar();
const { state } = storeToRefs(app());
const { $ } = data();
const navbarTabs = useStorage("navbar-tabs", "template");
get(state).rightDrawer = true;

const schemas = [Navbar];
const useDefaults = true;
const coerceTypes = true;
const removeAdditional = true;
const esm = true;
const code = { esm };

const ajv = new Ajv({
  useDefaults,
  coerceTypes,
  removeAdditional,
  schemas,
  code,
});

const validateNavbar = ajv.getSchema("urn:jsonschema:navbar");

/** Сброс параметров навбара */
const fncResetNavbar = () => {
  $q.dialog({
    title: "Сброс навбара",
    message: "Выбор сбрасываемых параметров:",
    options: {
      type: "checkbox",
      model: [],
      items: [
        { label: "Шаблон", value: "template" },
        { label: "Скрипты", value: "script" },
        { label: "Стили", value: "style" },
        { label: "Тема", value: "theme" },
        { label: "Классы", value: "classes" },
        { label: "Скролл классы", value: "scrollClasses" },
      ],
    },
    cancel: true,
    persistent: true,
  }).onOk((value) => {
    value.forEach((element) => {
      delete $.navbar[element];
    });
    validateNavbar($.navbar);
  });
};
</script>
