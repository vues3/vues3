import { enable, initialize } from "@electron/remote/main/index.js";
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
const height = 600;
const width = 1000;
const sandbox = false;
const frame = false;
const preload = path.resolve(
  currentDir,
  path.join(
    process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
    `electron-preload${process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION}`,
  ),
);
const webPreferences = { devTools, preload, sandbox };
const createWindow = async () => {
  mainWindow = new BrowserWindow({
    frame,
    height,
    icon,
    show,
    webPreferences,
    width,
  });
  enable(mainWindow.webContents);
  if (process.env.DEV)
    await mainWindow.loadURL(process.env.APP_URL).catch((error: unknown) => {
      console.error(error);
    });
  else
    await mainWindow.loadFile("index.html").catch((error: unknown) => {
      console.error(error);
    });
  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });
  mainWindow.show();
  // mainWindow.webContents.openDevTools();
};
app
  .whenReady()
  .then(createWindow)
  .catch((error: unknown) => {
    console.error(error);
  });
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (mainWindow === undefined)
    createWindow().catch((error: unknown) => {
      console.error(error);
    });
});
