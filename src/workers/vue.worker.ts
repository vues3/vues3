import type { ProjectContext } from "@volar/language-service";
import type {
  LanguageServicePlugin,
  WorkerLanguageService,
} from "@volar/monaco/worker";
import type { worker } from "monaco-editor";

import { Window } from "@remote-dom/polyfill";
import { createNpmFileSystem } from "@volar/jsdelivr";
import { createTypeScriptWorkerLanguageService } from "@volar/monaco/worker";
import {
  createVueLanguagePlugin,
  getDefaultCompilerOptions,
  getFullLanguageServicePlugins,
} from "@vue/language-service";
import { initialize } from "monaco-editor/esm/vs/editor/editor.worker";
import typescript, { convertCompilerOptionsFromJson } from "typescript";
import { URI } from "vscode-uri";

/* -------------------------------------------------------------------------- */

Window.setGlobal(new Window());

/* -------------------------------------------------------------------------- */

const asFileName = ({ path }: URI) => path,
  asUri = (fileName: string) => URI.file(fileName);

const allowImportingTsExtensions = true,
  allowJs = true,
  checkJs = true,
  fs = createNpmFileSystem(),
  workspaceFolders = [URI.file("/")],
  env = { fs, workspaceFolders },
  jsx = "Preserve",
  languageServicePlugins = getFullLanguageServicePlugins(
    typescript,
  ) as LanguageServicePlugin[],
  module = "ESNext",
  moduleResolution = "Bundler",
  target = "ESNext",
  uriConverter = { asFileName, asUri },
  vueCompilerOptions = getDefaultCompilerOptions();

/* -------------------------------------------------------------------------- */

const setup = ({ project }: { project: ProjectContext }) => {
  const compilerOptions = vueCompilerOptions,
    value = { compilerOptions };
  Reflect.defineProperty(project, "vue", { value });
};

/* -------------------------------------------------------------------------- */

const { options: compilerOptions } = convertCompilerOptionsFromJson(
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

/* -------------------------------------------------------------------------- */

const languagePlugins = [
  createVueLanguagePlugin(
    typescript,
    compilerOptions,
    vueCompilerOptions,
    asFileName,
  ),
];

/* -------------------------------------------------------------------------- */

self.onmessage = () => {
  (
    initialize as (
      foreignModule: (
        workerContext: worker.IWorkerContext,
      ) => WorkerLanguageService,
    ) => void
  )((workerContext) =>
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
