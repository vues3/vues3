<template lang="pug">
.size-full(ref="element")
</template>
<script setup lang="ts">
import type { Ref } from "vue";

import themes from "boot/monaco";
import * as monaco from "monaco-editor-core";
import { loadGrammars } from "monaco-volar";
import {
  ambiguousCharacters,
  automaticLayout,
  scrollBeyondLastLine,
} from "stores/defaults";
import uuid from "uuid-random";
import { onBeforeUnmount, onMounted, ref } from "vue";

const { light: theme } = themes;
const props = withDefaults(
  defineProps<{
    modelValue?: Promise<string> | string;
  }>(),
  {
    modelValue: "",
  },
);
const emit = defineEmits(["update:modelValue"]);
const value = await props.modelValue;
const model = monaco.editor.createModel(
  value,
  "vue",
  monaco.Uri.parse(`inmemory:///${uuid()}.vue`),
);
const element: Ref<HTMLElement | undefined> = ref();
let editorInstance: monaco.editor.IStandaloneCodeEditor | undefined;
const unicodeHighlight = { ambiguousCharacters };
onMounted(() => {
  if (element.value) {
    editorInstance = monaco.editor.create(element.value, {
      automaticLayout,
      model,
      scrollBeyondLastLine,
      theme,
      unicodeHighlight,
    });
    editorInstance.onDidChangeModelContent(() => {
      emit("update:modelValue", editorInstance?.getValue());
    });
    editorInstance.focus();
    editorInstance
      .getAction("editor.action.formatDocument")
      ?.run()
      .catch(() => {});

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-underscore-dangle, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const t = (editorInstance as any)._themeService._theme;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    t.semanticHighlighting = true;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    t.getTokenStyleMetadata = (type: string, modifiers: string[]) => {
      switch (type) {
        case "class":
          return { foreground: 11 };
        case "function":
        case "method":
          return { foreground: 12 };
        case "property":
        case "variable":
          return { foreground: modifiers.includes("readonly") ? 19 : 9 };
        default:
          return { foreground: 0 };
      }
    };

    loadGrammars(monaco, editorInstance).catch(() => {});
  }
});
onBeforeUnmount(() => {
  editorInstance?.dispose();
  model?.dispose();
});
</script>
