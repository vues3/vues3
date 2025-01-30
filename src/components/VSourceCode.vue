<template lang="pug">
.size-full(ref="monaco")
</template>

<script setup lang="ts">
import type { ThemeRegistrationRaw } from "shiki";
import type { Ref } from "vue";

import { editor } from "monaco-editor";
import themeLight from "shiki/themes/light-plus.mjs";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

/* -------------------------------------------------------------------------- */

let editorInstance: editor.IStandaloneCodeEditor | undefined;

/* -------------------------------------------------------------------------- */

const { name: theme = "light-plus" }: ThemeRegistrationRaw = themeLight;

/* -------------------------------------------------------------------------- */

const ambiguousCharacters = false,
  automaticLayout = true,
  fixedOverflowWidgets = true,
  props = defineProps<{
    model: Promise<editor.ITextModel>;
  }>(),
  model = await props.model,
  monaco: Ref<HTMLElement | undefined> = ref(),
  scrollBeyondLastLine = false,
  unicodeHighlight = { ambiguousCharacters };

/* -------------------------------------------------------------------------- */

watch(
  () => props.model,
  async (value) => {
    editorInstance?.setModel(await value);
  },
);

onMounted(() => {
  editorInstance =
    monaco.value &&
    editor.create(monaco.value, {
      automaticLayout,
      fixedOverflowWidgets,
      model,
      scrollBeyondLastLine,
      theme,
      unicodeHighlight,
    });
  if (editorInstance) {
    editorInstance.focus();
    const { _themeService: themeService } = editorInstance as unknown as Record<
      string,
      Record<string, Record<string, ((...args: never) => unknown) | boolean>>
    >;
    if (themeService) {
      const { _theme: t } = themeService;
      if (t) {
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
    }
  }
});

onBeforeUnmount(() => {
  editorInstance?.dispose();
});
</script>
