/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */
import type { StreamingBlobPayloadInputTypes } from "@smithy/types";

import { BrowserWindow, dialog } from "@electron/remote";
import { contextBridge } from "electron";
import {
  access,
  lstat,
  mkdir,
  readdir,
  readFile,
  rmdir,
  unlink,
  writeFile,
} from "fs/promises";
import { basename, dirname, join } from "path";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

/** A recursive property indicating whether parent directories should be created */

const recursive = true;

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

/** Check the file existence */

const headObject: (Bucket: string, Key: string) => Promise<null> = async (
  Bucket,
  Key,
) => {
  const stats = await lstat(join(Bucket, Key));
  if (stats.isFile()) return null;
  throw new Error("It's not a file");
};

/* -------------------------------------------------------------------------- */

/** Adds an object to a bucket */

const putObject: (
  Bucket: string,
  Key: string,
  body: StreamingBlobPayloadInputTypes,
) => Promise<void> = async (Bucket, Key, body) => {
  const filePath = join(Bucket, Key);
  const dirName = dirname(filePath);
  try {
    await access(dirName);
  } catch {
    await mkdir(dirName, { recursive });
  }
  await writeFile(filePath, body as string | Uint8Array);
};

/* -------------------------------------------------------------------------- */

/** Remove empty directories */

const removeEmptyDirectories: (
  directory: string,
  exclude: string[],
) => Promise<void> = async (directory, exclude) => {
  const fileStats = await lstat(directory);
  if (!fileStats.isDirectory() || exclude.includes(basename(directory))) return;
  let fileNames = await readdir(directory);
  if (fileNames.length) {
    await Promise.all(
      fileNames.map((fileName) =>
        removeEmptyDirectories(join(directory, fileName), exclude),
      ),
    );
    fileNames = await readdir(directory);
  }
  if (!fileNames.length) await rmdir(directory);
};

/* -------------------------------------------------------------------------- */

/** Removes an object from a bucket */

const deleteObject: (Bucket: string, Key: string) => Promise<void> = async (
  Bucket,
  Key,
) => {
  await unlink(join(Bucket, Key));
};

/* -------------------------------------------------------------------------- */

/** Retrieves an object */

const getObject: (Bucket: string, Key: string) => Promise<Response> = async (
  Bucket,
  Key,
) => {
  try {
    const file = join(Bucket, Key);
    const [body, mime] = await Promise.all([readFile(file), import("mime")]);
    const type = mime.default.getType(file);
    const headers = new Headers(type ? { "content-type": type } : undefined);
    return new Response(body, { headers });
  } catch {
    //
  }
  return new Response();
};

/* -------------------------------------------------------------------------- */

/** Retrieves a text object */

const getObjectText: (Bucket: string, Key: string) => Promise<string> = async (
  Bucket,
  Key,
) => (await getObject(Bucket, Key)).text();

/* -------------------------------------------------------------------------- */

/** Retrieves a blob object */

const getObjectBlob: (Bucket: string, Key: string) => Promise<Blob> = async (
  Bucket,
  Key,
) => (await getObject(Bucket, Key)).blob();

/* -------------------------------------------------------------------------- */

const focusedWindowClose: () => void = () => {
  BrowserWindow.getFocusedWindow()?.close();
};

/* -------------------------------------------------------------------------- */

const focusedWindowMinimize: () => void = () => {
  BrowserWindow.getFocusedWindow()?.minimize();
};

/* -------------------------------------------------------------------------- */

const focusedWindowToggleMaximize: () => void = () => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow?.isMaximized()) focusedWindow.unmaximize();
  else focusedWindow?.maximize();
};

/* -------------------------------------------------------------------------- */

const focusedWindowIsMaximized: () => boolean | null = () =>
  BrowserWindow.getFocusedWindow()?.isMaximized() ?? null;

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

contextBridge.exposeInMainWorld("dialog", dialog);
contextBridge.exposeInMainWorld("headObject", headObject);
contextBridge.exposeInMainWorld("putObject", putObject);
contextBridge.exposeInMainWorld(
  "removeEmptyDirectories",
  removeEmptyDirectories,
);
contextBridge.exposeInMainWorld("deleteObject", deleteObject);
contextBridge.exposeInMainWorld("getObjectText", getObjectText);
contextBridge.exposeInMainWorld("getObjectBlob", getObjectBlob);
contextBridge.exposeInMainWorld("focusedWindowClose", focusedWindowClose);
contextBridge.exposeInMainWorld("focusedWindowMinimize", focusedWindowMinimize);
contextBridge.exposeInMainWorld(
  "focusedWindowToggleMaximize",
  focusedWindowToggleMaximize,
);
contextBridge.exposeInMainWorld(
  "focusedWindowIsMaximized",
  focusedWindowIsMaximized,
);

/* -------------------------------------------------------------------------- */
