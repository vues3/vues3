import type { Dialog } from "electron";

declare global {
  interface Window {
    dialog: Dialog;
  }
}
