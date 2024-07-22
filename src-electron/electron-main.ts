import { enable, initialize } from "@electron/remote/main/index.js";
// eslint-disable-next-line import/no-extraneous-dependencies
import { BrowserWindow, app } from "electron";
import path from "path";
import { fileURLToPath } from "url";

initialize();
const currentDir = fileURLToPath(new URL(".", import.meta.url));
const frame = false;
const icon = path.resolve(currentDir, "icons/icon.png");
const sandbox = false;
const devTools = false;
const preload = path.resolve(
  currentDir,
  path.join(
    process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
    `electron-preload${process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION}`,
  ),
);
const webPreferences = { devTools, preload, sandbox };
const show = false;
const createWindow = async () => {
  const mainWindow = new BrowserWindow({ frame, icon, show, webPreferences });
  enable(mainWindow.webContents);
  if (process.env.DEV)
    await mainWindow.loadURL(process.env.APP_URL).catch(() => {});
  else await mainWindow.loadFile("index.html").catch(() => {});
  mainWindow.maximize();
  mainWindow.show();
};
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (!BrowserWindow.getAllWindows().length) createWindow().catch(() => {});
});
app
  .whenReady()
  .then(createWindow)
  .catch(() => {});
