import type { App } from "vue";

declare global {
  interface Window {
    app: App;
  }
}
