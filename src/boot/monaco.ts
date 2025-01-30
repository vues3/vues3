import type { WorkerLanguageService } from "@volar/monaco/worker";
import type monacoNs from "monaco-editor-core";

import { shikiToMonaco } from "@shikijs/monaco";
import {
  activateAutoInsertion,
  activateMarkers,
  registerProviders,
} from "@volar/monaco";
import { consoleError } from "@vues3/shared";
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
// eslint-disable-next-line import-x/default
import VueWorker from "src/workers/vue.worker?worker";
import * as languageConfigs from "stores/language-configs";

/* -------------------------------------------------------------------------- */

const getSyncUris = () => monaco.editor.getModels().map(({ uri }) => uri),
  getWorker: monacoNs.Environment["getWorker"] = (workerId, label) => {
    switch (label) {
      case "tailwindcss":
        return new TailwindcssWorker();
      case "vue":
        return new VueWorker();
      default:
        return new EditorWorker();
    }
  };

/* -------------------------------------------------------------------------- */

const engine = createJavaScriptRegexEngine(),
  label = "vue",
  langs = [langVue, langTsx, langJsx],
  languageId = ["vue", "javascript", "typescript", "css"],
  languageSelector = "vue",
  moduleId = "vs/language/vue/vueWorker",
  themes = [themeDark, themeLight],
  worker: monaco.editor.MonacoWebWorker<WorkerLanguageService> =
    monaco.editor.createWebWorker({ label, moduleId });

/* -------------------------------------------------------------------------- */

window.MonacoEnvironment = { getWorker };

["vue", "js", "ts", "css"].forEach((value, index) => {
  const id = languageId[index];
  if (id) {
    const configuration = (
        languageConfigs as Record<
          string,
          monaco.languages.LanguageConfiguration
        >
      )[value],
      extensions = [`.${value}`];
    if (configuration) {
      monaco.languages.register({ extensions, id });
      monaco.languages.setLanguageConfiguration(id, configuration);
    }
  }
});
registerProviders(worker, languageId, getSyncUris, monaco.languages).catch(
  consoleError,
);
activateMarkers(worker, languageId, label, getSyncUris, monaco.editor);
activateAutoInsertion(worker, languageId, getSyncUris, monaco.editor);
shikiToMonaco(
  createHighlighterCoreSync({ engine, langs, themes }),
  monaco as typeof monacoNs,
);
configureMonacoTailwindcss(monaco, { languageSelector });
