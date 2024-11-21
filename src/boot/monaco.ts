import type { LanguageService } from "@vue/language-service";
import type { Environment } from "monaco-editor-core";

import * as volar from "@volar/monaco";
import { editor, languages } from "monaco-editor-core";
import EditorWorker from "monaco-editor-core/esm/vs/editor/editor.worker?worker";
import { loadTheme } from "monaco-volar";
import VueWorker from "monaco-volar/vue.worker?worker";
import { loadWASM } from "onigasm";
import onigasmWasm from "onigasm/lib/onigasm.wasm?url";

languages.register({ extensions: [".vue"], id: "vue" });
languages.onLanguage("vue", () => {
  const getWorker: Environment["getWorker"] = (workerId, label) =>
    label === "vue" ? new VueWorker() : new EditorWorker();
  window.MonacoEnvironment = { getWorker };
  const createData = {};
  const label = "vue";
  const moduleId = "vs/language/vue/vueWorker";
  const worker = editor.createWebWorker<LanguageService>({
    createData,
    label,
    moduleId,
  });
  const getSyncUris = () => editor.getModels().map(({ uri }) => uri);
  volar.editor.activateMarkers(worker, [label], label, getSyncUris, editor);
  volar.editor.activateAutoInsertion(worker, [label], getSyncUris, editor);
  volar.languages
    .registerProviders(worker, [label], getSyncUris, languages)
    .catch(() => {});
});
const [theme] = await Promise.all([loadTheme(editor), loadWASM(onigasmWasm)]);
export default theme;
