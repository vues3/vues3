<template lang="pug">
.size-full(ref="monaco")
</template>
<script setup lang="ts">
import type { Ref } from "vue";

// import model from "boot/monaco";
import { editor, Uri } from "monaco-editor-core";
import themeLight from "shiki/themes/light-plus.mjs";
import uuid from "uuid-random";
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{ id?: string; modelValue?: Promise<string> | string }>(),
  { id: uuid(), modelValue: "" },
);
const emit = defineEmits(["update:modelValue"]);
const monaco: Ref<HTMLElement | undefined> = ref();
let editorInstance: editor.IStandaloneCodeEditor | undefined;
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
const model = getOrCreateModel(
  Uri.parse(`file:///${props.id}.vue`),
  "vue",
  await props.modelValue,
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
    const { name: theme } = themeLight;
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
  editorInstance?.getModel()?.dispose();
  editorInstance?.dispose();
});
</script>
