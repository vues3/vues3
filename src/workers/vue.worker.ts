import type {
  LanguageServiceEnvironment,
  ProjectContext,
} from "@volar/language-service";
import type { worker } from "monaco-editor-core";

import { createNpmFileSystem } from "@volar/jsdelivr";
import { createTypeScriptWorkerLanguageService } from "@volar/monaco/worker";
import {
  createVueLanguagePlugin,
  getFullLanguageServicePlugins,
  resolveVueCompilerOptions,
} from "@vue/language-service";
import { initialize } from "monaco-editor-core/esm/vs/editor/editor.worker";
import * as typescript from "typescript";
import { URI } from "vscode-uri";
import { version } from "vue";

const vueCompilerOptions = (() => {
  const target = Number(version.split(".").slice(0, -1).join("."));
  return resolveVueCompilerOptions({ target });
})();
const setup = ({ project }: { project: ProjectContext }) => {
  const compilerOptions = vueCompilerOptions;
  const value = { compilerOptions };
  Reflect.defineProperty(project, "vue", { value });
};
const { options: compilerOptions } = (() => {
  const allowImportingTsExtensions = true;
  const allowJs = true;
  const checkJs = true;
  const jsx = "Preserve";
  const module = "ESNext";
  const moduleResolution = "Bundler";
  const target = "ESNext";
  return typescript.convertCompilerOptionsFromJson(
    {
      allowImportingTsExtensions,
      allowJs,
      checkJs,
      jsx,
      module,
      moduleResolution,
      target,
    },
    "",
  );
})();
const env: LanguageServiceEnvironment = (() => {
  const fs = createNpmFileSystem();
  const workspaceFolders = [URI.file("/")];
  return { fs, workspaceFolders };
})();
const asFileName = ({ path }: { path: string }) => path;
const languagePlugins = [
  createVueLanguagePlugin(
    typescript,
    compilerOptions,
    vueCompilerOptions,
    asFileName,
  ),
];
const languageServicePlugins = getFullLanguageServicePlugins(typescript);
const uriConverter = (() => {
  const asUri = (fileName: string) => URI.file(fileName);
  return { asFileName, asUri };
})();
// eslint-disable-next-line no-restricted-globals
self.onmessage = () => {
  (initialize as (workerContext) => void)(
    (workerContext: worker.IWorkerContext) =>
      createTypeScriptWorkerLanguageService({
        compilerOptions,
        env,
        languagePlugins,
        languageServicePlugins,
        setup,
        typescript,
        uriConverter,
        workerContext,
      }),
  );
};
