import type { WorkerLanguageService } from "@volar/monaco/worker";

import { shikiToMonaco } from "@shikijs/monaco";
import {
  activateAutoInsertion,
  activateMarkers,
  registerProviders,
} from "@volar/monaco";
import * as monaco from "monaco-editor-core";
import EditorWorker from "monaco-editor-core/esm/vs/editor/editor.worker?worker";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine-javascript.mjs";
import langJsx from "shiki/langs/jsx.mjs";
import langTsx from "shiki/langs/tsx.mjs";
import langVue from "shiki/langs/vue.mjs";
import themeDark from "shiki/themes/dark-plus.mjs";
import themeLight from "shiki/themes/light-plus.mjs";
import VueWorker from "src/workers/vue.worker?worker";

const { editor, languages } = monaco;
const {
  IndentAction: { Indent, IndentOutdent },
} = languages;
const brackets: monaco.languages.CharacterPair[] = [
  ["<!--", "-->"],
  ["<", ">"],
  ["{", "}"],
  ["(", ")"],
];
const surroundingPairs = [
  ["'", "'"],
  ['"', '"'],
  ["{", "}"],
  ["[", "]"],
  ["(", ")"],
  ["<", ">"],
  ["`", "`"],
].map(([open, close]) => ({ close, open }));
const autoClosingPairs = [
  ["{", "}"],
  ["[", "]"],
  ["(", ")"],
  ["'", "'"],
  ['"', '"'],
  ["<!--", "-->", ["comment", "string"]],
  ["`", "`", ["string", "comment"]],
  ["/**", "*/", ["string"]],
].map(
  ([open, close, notIn = []]) =>
    ({
      close,
      notIn,
      open,
    }) as monaco.languages.IAutoClosingPairConditional,
);
const blockComment: monaco.languages.CharacterPair = ["<!--", "-->"];
const comments = { blockComment };
const colorizedBracketPairs = [];
const autoCloseBefore = ";:.,=}])><`'\" \n\t";
const wordPattern = /(-?\d*\.\d\w*)|([^`@~!%^&*()\-=+[{\]}\\|;:'",.<>/?\s]+)/;
const start = /^\s*<!--\s*#region\b.*-->/;
const end = /^\s*<!--\s*#endregion\b.*-->/;
const markers = { end, start };
const folding = { markers };
const decreaseIndentPattern = /^\s*(<\/(?!html)[-_.A-Za-z0-9]+\b[^>]*>|-->|\})/;
const increaseIndentPattern =
  /<(?!\?|(?:area|base|br|col|frame|hr|html|img|input|keygen|link|menuitem|meta|param|source|track|wbr|script|style)\b|[^>]*\/>)([-_.A-Za-z0-9]+)(?=\s|>)\b[^>]*>(?!\s*\()(?!.*<\/\1>)|<!--(?!.*-->)|\{[^}"']*$/i;
const indentationRules = { decreaseIndentPattern, increaseIndentPattern };
const beforeText =
  /<(?!(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr|script|style))([_:\w][_:\w-.\d]*)(?:(?:[^'"/>]|"[^"]*"|'[^']*')*?(?!\/)>)[^<]*$/i;
const onEnterRules = [
  [IndentOutdent, /^<\/([_:\w][_:\w-.\d]*)\s*>/i],
  [Indent],
].map(([indentAction, afterText]) => {
  const action = { indentAction };
  return { action, afterText, beforeText } as monaco.languages.OnEnterRule;
});
["vue", "javascript", "typescript", "css"].forEach((id) => {
  languages.register({ id });
});
languages.setLanguageConfiguration("vue", {
  autoCloseBefore,
  autoClosingPairs,
  brackets,
  colorizedBracketPairs,
  comments,
  folding,
  indentationRules,
  onEnterRules,
  surroundingPairs,
  wordPattern,
});
const getWorker = (workerId, label) =>
  label === "vue" ? new VueWorker() : new EditorWorker();
window.MonacoEnvironment = { getWorker };
const label = "vue";
const moduleId = "vs/language/vue/vueWorker";
const worker = editor.createWebWorker<WorkerLanguageService>({
  label,
  moduleId,
});
const getSyncUris = () => editor.getModels().map(({ uri }) => uri);
const langs = [langVue, langTsx, langJsx];
const themes = [themeDark, themeLight];
const engine = createJavaScriptRegexEngine();
activateMarkers(worker, [label], label, getSyncUris, editor);
activateAutoInsertion(worker, [label], getSyncUris, editor);
registerProviders(worker, [label], getSyncUris, languages).then(
  () => {
    shikiToMonaco(createHighlighterCoreSync({ engine, langs, themes }), monaco);
  },
  () => {},
);
