<template lang="pug">
.size-full(ref="monaco")
</template>
<script setup lang="ts">
import type { Ref } from "vue";

import { editor } from "monaco-editor";
import themeLight from "shiki/themes/light-plus.mjs";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  model: Promise<editor.ITextModel>;
}>();
const monaco: Ref<HTMLElement | undefined> = ref();
let editorInstance: editor.IStandaloneCodeEditor | undefined;
const model = await props.model;
watch(
  () => props.model,
  async (value) => {
    editorInstance?.setModel(await value);
  },
);
onMounted(() => {
  editorInstance = (() => {
    const automaticLayout = true;
    const unicodeHighlight = (() => {
      const ambiguousCharacters = false;
      return { ambiguousCharacters };
    })();
    const scrollBeyondLastLine = false;
    const fixedOverflowWidgets = true;
    const { name: theme = "light-plus" } = themeLight;
    return (
      monaco.value &&
      editor.create(monaco.value, {
        automaticLayout,
        fixedOverflowWidgets,
        model,
        scrollBeyondLastLine,
        theme,
        unicodeHighlight,
      })
    );
  })();
  if (editorInstance) {
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
