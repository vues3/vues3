import type { ProjectContext } from "@volar/language-service";
import type { worker } from "monaco-editor-core";

import { createNpmFileSystem } from "@volar/jsdelivr";
import { createTypeScriptWorkerLanguageService } from "@volar/monaco/worker";
import {
  createVueLanguagePlugin,
  getFullLanguageServicePlugins,
  resolveVueCompilerOptions,
} from "@vue/language-service";
import { initialize } from "monaco-editor-core/esm/vs/editor/editor.worker";
import { allowImportingTsExtensions, allowJs, checkJs } from "stores/defaults";
import * as typescript from "typescript";
import { URI } from "vscode-uri";
import { version } from "vue";

const asFileName = ({ path }: { path: string }) => path;
const asUri = (fileName: string) => URI.file(fileName);
const vueCompilerOptions = (() => {
  const target = Number(version.split(".").slice(0, -1).join("."));
  return resolveVueCompilerOptions({ target });
})();
const setup = ({ project }: { project: ProjectContext }) => {
  const compilerOptions = vueCompilerOptions;
  const value = { compilerOptions };
  Reflect.defineProperty(project, "vue", { value });
};
const compilerOptions = (() => {
  const {
    getDefaultCompilerOptions,
    JsxEmit: { Preserve: jsx },
    ModuleKind: { ESNext: module },
    ModuleResolutionKind: { Bundler: moduleResolution },
    ScriptTarget: { ESNext: target },
  } = typescript;
  return {
    ...getDefaultCompilerOptions(),
    allowImportingTsExtensions,
    allowJs,
    checkJs,
    jsx,
    module,
    moduleResolution,
    target,
  };
})();
const env = (() => {
  const fs = createNpmFileSystem();
  const workspaceFolders = [URI.file("/")];
  return { fs, workspaceFolders };
})();
const uriConverter = { asFileName, asUri };
const languageServicePlugins = getFullLanguageServicePlugins(typescript);
const languagePlugins = [
  createVueLanguagePlugin(
    typescript,
    compilerOptions,
    vueCompilerOptions,
    asFileName,
  ),
];
// eslint-disable-next-line no-restricted-globals
self.onmessage = () => {
  (initialize as (foreignModule) => void)(
    (
      workerContext: worker.IWorkerContext<
        Record<string, (...args: string[]) => void>
      >,
    ) =>
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
