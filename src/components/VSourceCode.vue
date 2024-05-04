<template lang="pug">
v-ace-editor(
  :lang,
  :options,
  :value,
  @update:value="$emit('update:modelValue', $event)",
  @vue:mounted="beautify(value); nextTick(editor?.focus)",
  ref="editor",
  v-if="value !== null"
)
</template>
<script setup lang="ts">
// eslint-disable-next-line perfectionist/sort-imports
import { VAceEditor } from "vue3-ace-editor";

// eslint-disable-next-line perfectionist/sort-imports
import "ace-builds/esm-resolver";
import { css, html, js } from "js-beautify";
import { nextTick, ref } from "vue";

const props = withDefaults(
  defineProps<{
    lang?: string;
    modelValue: Promise<string> | null | string;
    options?: object;
  }>(),
  {
    lang: "html",
    modelValue: "",
    options: (): object => ({}),
  },
);
const emit = defineEmits(["update:modelValue"]);
const beautify = (value: string) => {
  let code;
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
  emit("update:modelValue", code);
};
const editor = ref();
const value = ref(await props.modelValue);
</script>
