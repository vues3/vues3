<template lang="pug">
v-ace-editor(
  v-if="value !== null",
  ref="editorRef",
  :value="value",
  :lang="lang",
  :options="options",
  @update:value="$emit('update:modelValue', $event)",
  @vue:mounted="beautify(value); nextTick(editorRef.focus)"
)
</template>

<script setup>
// eslint-disable-next-line simple-import-sort/imports
import { VAceEditor } from "vue3-ace-editor";
import "ace-builds/esm-resolver";
import { ref, watchEffect, nextTick } from "vue";
import { js, css, html } from "js-beautify";

const { options, lang, modelValue } = defineProps({
  options: {
    /** @returns {object} - Пустой объект по умолчанию */
    default: () => ({}),
    type: Object,
  },
  lang: { default: "html", type: String },
  modelValue: { default: "", type: [Promise, String] },
});

const emit = defineEmits(["update:modelValue"]);
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
  emit("update:modelValue", code);
};
const editorRef = ref();
const value = ref(null);

watchEffect(async () => {
  value.value = await modelValue;
});
</script>
