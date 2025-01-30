import { enable, initialize } from "@electron/remote/main/index.js";
import { consoleError } from "@vues3/shared";
import { app, BrowserWindow, Menu } from "electron";
import path from "path";
import { fileURLToPath } from "url";

/* -------------------------------------------------------------------------- */

let mainWindow: BrowserWindow | undefined;

/* -------------------------------------------------------------------------- */

const currentDir = fileURLToPath(new URL(".", import.meta.url)),
  devTools = false,
  frame = false,
  height = 600,
  icon = path.resolve(currentDir, "icons/icon.png"),
  preload = path.resolve(
    currentDir,
    path.join(
      process.env.QUASAR_ELECTRON_PRELOAD_FOLDER,
      `electron-preload${process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION}`,
    ),
  ),
  sandbox = false,
  show = false,
  webPreferences = { devTools, preload, sandbox },
  width = 1000;

/* -------------------------------------------------------------------------- */

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
    await mainWindow.loadURL(process.env.APP_URL).catch(consoleError);
  else await mainWindow.loadFile("index.html").catch(consoleError);
  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });
  mainWindow.show();
  // mainWindow.webContents.openDevTools();
};

/* -------------------------------------------------------------------------- */

initialize();
Menu.setApplicationMenu(null);
app.whenReady().then(createWindow).catch(consoleError);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (mainWindow === undefined) createWindow().catch(consoleError);
});
