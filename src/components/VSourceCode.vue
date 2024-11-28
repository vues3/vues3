<template lang="pug">
.size-full(ref="monaco")
</template>
<script setup lang="ts">
import type { Ref } from "vue";

import { registerHighlighter } from "@vues3/monaco-volar-worker/src/highlight";
import { getOrCreateModel } from "@vues3/monaco-volar-worker/src/utils";
import { editor, Uri } from "monaco-editor-core";
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
const { light: theme } = registerHighlighter();
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
