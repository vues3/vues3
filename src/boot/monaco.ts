import type { WorkerLanguageService } from "@volar/monaco/worker";

import { shikiToMonaco } from "@shikijs/monaco";
import {
  activateAutoInsertion,
  activateMarkers,
  registerProviders,
} from "@volar/monaco";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { configureMonacoTailwindcss } from "monaco-tailwindcss";
import TailwindcssWorker from "monaco-tailwindcss/tailwindcss.worker?worker";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine-javascript.mjs";
import langJsx from "shiki/langs/jsx.mjs";
import langTsx from "shiki/langs/tsx.mjs";
import langVue from "shiki/langs/vue.mjs";
import themeDark from "shiki/themes/dark-plus.mjs";
import themeLight from "shiki/themes/light-plus.mjs";
import VueWorker from "src/workers/vue.worker?worker";
import * as languageConfigs from "stores/language-configs";

const getWorker = (moduleId: string, label: string) => {
  switch (label) {
    case "tailwindcss":
      return new TailwindcssWorker();
    case "vue":
      return new VueWorker();
    default:
      return new EditorWorker();
  }
};
const getSyncUris = () => monaco.editor.getModels().map(({ uri }) => uri);
const moduleId = "vs/language/vue/vueWorker";
const languageId = ["vue", "javascript", "typescript", "css"];
const [label] = languageId;
const [languageSelector] = languageId;
window.MonacoEnvironment = { getWorker };
["vue", "js", "ts", "css"].forEach((value, index) => {
  const id = languageId[index];
  const extensions = [`.${value}`];
  monaco.languages.register({ extensions, id });
  monaco.languages.setLanguageConfiguration(
    id,
    languageConfigs[value as keyof typeof languageConfigs],
  );
});
const worker = monaco.editor.createWebWorker<WorkerLanguageService>({
  label,
  moduleId,
});
const langs = [langVue, langTsx, langJsx];
const themes = [themeDark, themeLight];
const engine = createJavaScriptRegexEngine();
activateMarkers(worker, languageId, label, getSyncUris, monaco.editor);
activateAutoInsertion(worker, languageId, getSyncUris, monaco.editor);
registerProviders(worker, languageId, getSyncUris, monaco.languages).catch(
  () => {},
);
shikiToMonaco(createHighlighterCoreSync({ engine, langs, themes }), monaco);
configureMonacoTailwindcss(monaco, { languageSelector });
