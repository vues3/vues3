import { enable, initialize } from "@electron/remote/main/index.js";
// eslint-disable-next-line import/no-extraneous-dependencies
import { app, BrowserWindow, Menu } from "electron";
import path from "path";
import { fileURLToPath } from "url";

initialize();
Menu.setApplicationMenu(null);
const currentDir = fileURLToPath(new URL(".", import.meta.url));
let mainWindow: BrowserWindow | undefined;
const icon = path.resolve(currentDir, "icons/icon.png");
const devTools = false;
const show = false;
const webPreferences = { devTools };
const createWindow = async () => {
  mainWindow = new BrowserWindow({ icon, show, webPreferences });
  enable(mainWindow.webContents);
  if (process.env.DEV)
    await mainWindow.loadURL(process.env.APP_URL).catch(() => {});
  else await mainWindow.loadFile("index.html").catch(() => {});
  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });
  mainWindow.show();
};
app
  .whenReady()
  .then(createWindow)
  .catch(() => {});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (mainWindow === undefined) createWindow().catch(() => {});
});
