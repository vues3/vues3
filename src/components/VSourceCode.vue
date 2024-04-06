<template lang="pug">
v-ace-editor(
  ref="editorRef",
  :value="modelValue",
  :lang="lang",
  :options="options",
  @update:value="$emit('update:modelValue', $event)"
)
</template>

<script setup>
// eslint-disable-next-line simple-import-sort/imports
import { VAceEditor } from "vue3-ace-editor";
import "ace-builds/esm-resolver";
import { onMounted, ref } from "vue";
import { get } from "@vueuse/core";
import { js, css, html } from "js-beautify";

const { options, lang, modelValue } = defineProps({
  options: {
    /** @returns {object} - Пустой объект по умолчанию */
    default: () => ({}),
    type: Object,
  },
  lang: { default: "html", type: String },
  modelValue: { default: "", type: String },
});
const emits = defineEmits(["update:modelValue"]);
/** @param {string} value - Исходный код */
const beautify = (value) => {
  let code;
  switch (lang) {
    case "javascript":
      code = js(value);
      break;
    case "css":
      code = css(value);
      break;
    default:
      code = html(value);
      break;
  }
  emits("update:modelValue", code);
};
const editorRef = ref();
onMounted(() => {
  if (modelValue) beautify(modelValue);
  get(editorRef).focus();
});
</script>
