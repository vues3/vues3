import { enable, initialize } from "@electron/remote/main/index.js";
import { BrowserWindow, app } from "electron";
import path from "path";
import { fileURLToPath } from "url";

initialize();
const currentDir = fileURLToPath(new URL(".", import.meta.url));
const frame = false;
const height = 600;
const icon = path.resolve(currentDir, "icons/icon.png");
const useContentSize = true;
const contextIsolation = true;
const width = 1000;
const sandbox = false;
const preload = path.resolve(
  currentDir,
  path.join(
    process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
    `electron-preload${process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION}`,
  ),
);
const webPreferences = { contextIsolation, preload, sandbox };
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    frame,
    height,
    icon,
    useContentSize,
    webPreferences,
    width,
  });
  enable(mainWindow.webContents);
  if (process.env.DEBUGGING) mainWindow.webContents.openDevTools();
  else
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools();
    });
  if (process.env.DEV) mainWindow.loadURL(process.env.APP_URL).catch(() => {});
  else mainWindow.loadFile("index.html").catch(() => {});
};
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (!BrowserWindow.getAllWindows().length) createWindow();
});
app
  .whenReady()
  .then(createWindow)
  .catch(() => {});
