import { dialog } from "@electron/remote";
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("dialog", dialog);
