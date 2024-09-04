<template lang="pug">
.size-full(ref="monaco")
</template>
<script setup lang="ts">
import type { Ref } from "vue";

import { editor } from "monaco-editor";
import {
  ambiguousCharacters,
  autoIndent,
  automaticLayout,
  formatOnPaste,
  formatOnType,
  scrollBeyondLastLine,
} from "stores/defaults";
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    language?: string;
    modelValue?: Promise<string> | string;
  }>(),
  {
    language: "html",
    modelValue: "",
  },
);
const emit = defineEmits(["update:modelValue"]);
const value = await props.modelValue;
const monaco: Ref<HTMLElement | undefined> = ref();
let standaloneCodeEditor: editor.IStandaloneCodeEditor | undefined;
const unicodeHighlight = { ambiguousCharacters };
const { language } = props;
onMounted(() => {
  if (monaco.value) {
    standaloneCodeEditor = editor.create(monaco.value, {
      autoIndent,
      automaticLayout,
      formatOnPaste,
      formatOnType,
      language,
      scrollBeyondLastLine,
      unicodeHighlight,
      value,
    });
    standaloneCodeEditor.onDidChangeModelContent(() => {
      emit("update:modelValue", standaloneCodeEditor?.getValue());
    });
    standaloneCodeEditor.focus();
    standaloneCodeEditor
      .getAction("editor.action.formatDocument")
      ?.run()
      .catch(() => {});
  }
});
onBeforeUnmount(() => {
  standaloneCodeEditor?.dispose();
});
</script>
