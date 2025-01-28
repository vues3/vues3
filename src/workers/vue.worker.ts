/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type {
  LanguageServiceEnvironment,
  ProjectContext,
} from "@volar/language-service";
import type {
  LanguagePlugin,
  LanguageServicePlugin,
  WorkerLanguageService,
} from "@volar/monaco/worker";
import type { VueCompilerOptions } from "@vue/language-service";
import type { worker } from "monaco-editor";

import { Window } from "@remote-dom/polyfill";
import { createNpmFileSystem } from "@volar/jsdelivr";
import { createTypeScriptWorkerLanguageService } from "@volar/monaco/worker";
import {
  createVueLanguagePlugin,
  getFullLanguageServicePlugins,
  resolveVueCompilerOptions,
} from "@vue/language-service";
import { initialize } from "monaco-editor/esm/vs/editor/editor.worker";
import typescript, { convertCompilerOptionsFromJson } from "typescript";
import { URI } from "vscode-uri";
import { version } from "vue";

/* -------------------------------------------------------------------------- */
/*                                    Init                                    */
/* -------------------------------------------------------------------------- */

Window.setGlobal(new Window());

/* -------------------------------------------------------------------------- */
/*                                   Objects                                  */
/* -------------------------------------------------------------------------- */

const vueCompilerOptions: VueCompilerOptions = (() => {
  const target = Number(version.split(".").slice(0, -1).join("."));
  return resolveVueCompilerOptions({ target });
})();

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const asFileName: ({ path }: URI) => string = ({ path }) => path;

/* -------------------------------------------------------------------------- */

const setup: ({ project }: { project: ProjectContext }) => void = ({
  project,
}) => {
  const compilerOptions = vueCompilerOptions;
  const value = { compilerOptions };
  Reflect.defineProperty(project, "vue", { value });
};

/* -------------------------------------------------------------------------- */
/*                                   Objects                                  */
/* -------------------------------------------------------------------------- */

const { options: compilerOptions }: { options: typescript.CompilerOptions } =
  (() => {
    const allowImportingTsExtensions = true;
    const allowJs = true;
    const checkJs = true;
    const jsx = "Preserve";
    const module = "ESNext";
    const moduleResolution = "Bundler";
    const target = "ESNext";
    return convertCompilerOptionsFromJson(
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

/* -------------------------------------------------------------------------- */

const env: LanguageServiceEnvironment = (() => {
  const fs = createNpmFileSystem();
  const workspaceFolders = [URI.file("/")];
  return { fs, workspaceFolders };
})();

/* -------------------------------------------------------------------------- */

const uriConverter: {
  asFileName(uri: URI): string;
  asUri(fileName: string): URI;
} = (() => {
  const asUri = (fileName: string) => URI.file(fileName);
  return { asFileName, asUri };
})();

/* -------------------------------------------------------------------------- */
/*                                   Arrays                                   */
/* -------------------------------------------------------------------------- */

const languagePlugins: LanguagePlugin<URI>[] = [
  createVueLanguagePlugin(
    typescript,
    compilerOptions,
    vueCompilerOptions,
    asFileName,
  ),
];

/* -------------------------------------------------------------------------- */

const languageServicePlugins: LanguageServicePlugin[] =
  getFullLanguageServicePlugins(typescript);

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
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

/* -------------------------------------------------------------------------- */
