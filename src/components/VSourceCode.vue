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

<script setup lang="ts">
// eslint-disable-next-line simple-import-sort/imports
import { VAceEditor } from "vue3-ace-editor";
import "ace-builds/esm-resolver";
import { ref, watchEffect, nextTick } from "vue";
import type { Ref } from "vue";
import { js, css, html } from "js-beautify";

interface IProps {
  options?: object;
  lang?: string;
  modelValue: Promise<string> | string;
}

const props: IProps = withDefaults(defineProps<IProps>(), {
  /**
   * @function options
   * @returns {object} - Пустой объект по умолчанию
   */
  options: () => ({}),
  lang: "html",
  modelValue: "",
});

const emit = defineEmits(["update:modelValue"]);
/** @param {string} value - Исходный код */
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
const editorRef = ref();

const value: Ref<string | null> = ref(null);

watchEffect(async () => {
  value.value = await props.modelValue;
});
</script>
