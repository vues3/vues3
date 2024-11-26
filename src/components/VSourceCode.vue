<template lang="pug">
.size-full(ref="monaco")
</template>
<script setup lang="ts">
import type { Ref } from "vue";

import { editor, Uri } from "monaco-editor-core";
import themeLight from "shiki/themes/light-plus.mjs";
import {
  ambiguousCharacters,
  automaticLayout,
  fixedOverflowWidgets,
  scrollBeyondLastLine,
} from "stores/defaults";
import uuid from "uuid-random";
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{ id?: string; modelValue?: Promise<string> | string }>(),
  { id: uuid(), modelValue: "" },
);
const emit = defineEmits(["update:modelValue"]);
const monaco: Ref<HTMLElement | undefined> = ref();
let editorInstance: editor.IStandaloneCodeEditor | undefined;
const unicodeHighlight = { ambiguousCharacters };
const getOrCreateModel = (
  uri: Uri,
  lang: string | undefined,
  value: string,
) => {
  const model = editor.getModel(uri);
  if (model) {
    model.setValue(value);
    return model;
  }
  return editor.createModel(value, lang, uri);
};
const { name: theme } = themeLight;
const model = getOrCreateModel(
  Uri.parse(`file:///${props.id}.vue`),
  "vue",
  await props.modelValue,
);
onMounted(() => {
  if (monaco.value) {
    editorInstance = editor.create(monaco.value, {
      automaticLayout,
      fixedOverflowWidgets,
      model,
      scrollBeyondLastLine,
      theme,
      unicodeHighlight,
    });
    editorInstance.onDidChangeModelContent(() => {
      emit("update:modelValue", editorInstance?.getValue());
    });
    editorInstance.focus();
    const { _themeService: themeService } = editorInstance as unknown as Record<
      string,
      Record<string, Record<string, ((...args: never) => unknown) | boolean>>
    >;
    const { _theme: t } = themeService;
    t.semanticHighlighting = true;
    t.getTokenStyleMetadata = (type: string, modifiers: string[]) => {
      let foreground = 0;
      switch (type) {
        case "class":
          foreground = 11;
          break;
        case "function":
        case "method":
          foreground = 12;
          break;
        case "property":
        case "variable":
          foreground = modifiers.includes("readonly") ? 19 : 9;
          break;
        default:
      }
      return { foreground };
    };
  }
});
onBeforeUnmount(() => {
  editorInstance?.dispose();
});
</script>
