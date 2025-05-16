import type {
  LanguageServicePlugin,
  WorkerLanguageService,
} from "@volar/monaco/worker";
import type { VueCompilerOptions } from "@vue/language-core";
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

declare module "@volar/language-service" {
  interface ProjectContext {
    vue?: {
      compilerOptions: VueCompilerOptions;
    };
  }
}

/** Don't remove! It's prevent emoji errors. (Non-UTF characters in the code) */
Window.setGlobal(new Window());

const vueCompilerOptions = getDefaultCompilerOptions(),
  { options: compilerOptions } = convertCompilerOptionsFromJson(
    {
      allowImportingTsExtensions: true,
      allowJs: true,
      checkJs: true,
      jsx: "Preserve",
      module: "ESNext",
      moduleResolution: "Bundler",
      target: "ESNext",
    },
    "",
  );
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
      env: { fs: createNpmFileSystem(), workspaceFolders: [URI.file("/")] },
      languagePlugins: [
        createVueLanguagePlugin(
          typescript,
          compilerOptions,
          vueCompilerOptions,
          ({ path }) => path,
        ),
      ],
      languageServicePlugins: getFullLanguageServicePlugins(
        typescript,
      ) as LanguageServicePlugin[],
      setup: ({ project }) => {
        project.vue = { compilerOptions: vueCompilerOptions };
      },
      typescript,
      uriConverter: {
        asFileName: ({ path }) => path,
        asUri: (fileName) => URI.file(fileName),
      },
      workerContext,
    }),
  );
};
