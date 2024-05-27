<template lang="pug">
v-ace-editor(
  :lang,
  :options,
  :value,
  @init="(editor) => { editor.focus(); }",
  @update:value="$emit('update:modelValue', $event)",
  v-if="value !== null"
)
</template>
<script setup lang="ts">
// eslint-disable-next-line perfectionist/sort-imports
import { VAceEditor } from "vue3-ace-editor";

// eslint-disable-next-line perfectionist/sort-imports
import "ace-builds/esm-resolver";
import { css, html, js } from "js-beautify";
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    lang?: string;
    modelValue?: Promise<string> | string;
    options?: object;
  }>(),
  {
    lang: "html",
    modelValue: "",
    options: (): object => ({}),
  },
);
defineEmits(["update:modelValue"]);
const beautify = (value?: string) => {
  let code = "";
  if (value)
    switch (props.lang) {
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
  return code;
};
const value = ref(beautify(await props.modelValue));
</script>
