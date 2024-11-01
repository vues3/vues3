import { dialog } from "@electron/remote";
import { contextBridge } from "electron";
import { lstatSync } from "fs";

const throwIfNoEntry = false;
contextBridge.exposeInMainWorld("dialog", dialog);
contextBridge.exposeInMainWorld(
  "isDirectory",
  (path: string) => lstatSync(path, { throwIfNoEntry })?.isDirectory() ?? false,
);
// headBucket
// headObject
// putObject
// getObject
