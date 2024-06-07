import { BrowserWindow } from "@electron/remote";
// eslint-disable-next-line import/no-extraneous-dependencies
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("myWindowAPI", {
  close() {
    BrowserWindow.getFocusedWindow()?.close();
  },
  minimize() {
    BrowserWindow.getFocusedWindow()?.minimize();
  },
  toggleMaximize() {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow?.isMaximized()) focusedWindow.unmaximize();
    else focusedWindow?.maximize();
  },
});
