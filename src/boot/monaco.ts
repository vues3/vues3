import type { WorkerLanguageService } from "@volar/monaco/worker";

import {
  activateAutoInsertion,
  activateMarkers,
  registerProviders,
} from "@volar/monaco";
import VueWorker from "@vues3/monaco-volar-worker/dist/vue.worker?worker";
import * as languageConfigs from "@vues3/monaco-volar-worker/src/language-configs";
import { editor, languages } from "monaco-editor-core";
import EditorWorker from "monaco-editor-core/esm/vs/editor/editor.worker?worker";

const getWorker = (workerId: string, label: string) =>
  label === "vue" ? new VueWorker() : new EditorWorker();
window.MonacoEnvironment = { getWorker };
[
  ["vue", "vue"],
  ["javascript", "js"],
  ["typescript", "ts"],
  ["css", "css"],
].forEach(([id, key]) => {
  const extensions = [`.${key}`];
  languages.register({ extensions, id });
  languages.setLanguageConfiguration(
    id,
    languageConfigs[
      key as keyof typeof import("@vues3/monaco-volar-worker/src/language-configs")
    ],
  );
});
const label = "vue";
const moduleId = "vs/language/vue/vueWorker";
const languageId = ["vue", "javascript", "typescript", "css"];
const getSyncUris = () => editor.getModels().map(({ uri }) => uri);
const worker = editor.createWebWorker<WorkerLanguageService>({
  label,
  moduleId,
});
activateMarkers(worker, languageId, label, getSyncUris, editor);
activateAutoInsertion(worker, languageId, getSyncUris, editor);
registerProviders(worker, languageId, getSyncUris, languages).catch(() => {});
