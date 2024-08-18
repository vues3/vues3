import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import JsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

window.MonacoEnvironment = {
  getWorker(workerId, label) {
    switch (label) {
      case "css":
      case "less":
      case "scss":
        return new CssWorker();
      case "handlebars":
      case "html":
      case "razor":
        return new HtmlWorker();
      case "javascript":
      case "typescript":
        return new JsWorker();
      case "json":
        return new JsonWorker();
      default:
        return new EditorWorker();
    }
  },
};
