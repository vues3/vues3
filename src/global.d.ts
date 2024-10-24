import type { Dialog } from "electron";

declare global {
  interface Window {
    dialog: Dialog;
    isDirectory: (path: string) => boolean;
  }
}
