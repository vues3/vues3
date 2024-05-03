<template lang="pug">
v-ace-editor(
  v-if="value !== null",
  ref="editor",
  :value,
  :lang,
  :options,
  @update:value="$emit('update:modelValue', $event)",
  @vue:mounted="beautify(value); nextTick(editor?.focus)"
)
</template>
<script setup lang="ts">
// eslint-disable-next-line import/no-duplicates
import "vue3-ace-editor";
import "ace-builds/esm-resolver";

import { css, html, js } from "js-beautify";
import type { Ref } from "vue";
import { nextTick, ref } from "vue";
// eslint-disable-next-line no-duplicate-imports, import/no-duplicates
import { VAceEditor } from "vue3-ace-editor";

interface IProps {
  options?: object;
  lang?: string;
  modelValue: Promise<string> | string | null;
}
const props: IProps = withDefaults(defineProps<IProps>(), {
  options: (): object => ({}),
  lang: "html",
  modelValue: "",
});
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
const editor: Ref<HTMLElement | undefined> = ref();
const value: Ref<string | null> = ref(await props.modelValue);
</script>
