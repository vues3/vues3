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

const deleteObject = async (Bucket: string, Key: string): Promise<void> => {
  await unlink(join(Bucket, Key));
};

/* -------------------------------------------------------------------------- */

/** Adds an object to a bucket */

const focusedWindowClose = (): void => {
  BrowserWindow.getFocusedWindow()?.close();
};

/* -------------------------------------------------------------------------- */

/** Remove empty directories */

const focusedWindowIsMaximized = (): boolean | null =>
  BrowserWindow.getFocusedWindow()?.isMaximized() ?? null;

/* -------------------------------------------------------------------------- */

/** Removes an object from a bucket */

const focusedWindowMinimize = (): void => {
  BrowserWindow.getFocusedWindow()?.minimize();
};

/* -------------------------------------------------------------------------- */

/** Retrieves an object */

const focusedWindowToggleMaximize = (): void => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  if (focusedWindow?.isMaximized()) focusedWindow.unmaximize();
  else focusedWindow?.maximize();
};

/* -------------------------------------------------------------------------- */

/** Retrieves a text object */

const getObject = async (Bucket: string, Key: string): Promise<Response> => {
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

/** Retrieves a blob object */

const getObjectBlob = async (Bucket: string, Key: string): Promise<Blob> =>
  (await getObject(Bucket, Key)).blob();

/* -------------------------------------------------------------------------- */

const getObjectText = async (Bucket: string, Key: string): Promise<string> =>
  (await getObject(Bucket, Key)).text();

/* -------------------------------------------------------------------------- */

const headObject = async (Bucket: string, Key: string): Promise<null> => {
  const stats = await lstat(join(Bucket, Key));
  if (stats.isFile()) return null;
  throw new Error("It's not a file");
};

/* -------------------------------------------------------------------------- */

const putObject = async (
  Bucket: string,
  Key: string,
  body: StreamingBlobPayloadInputTypes,
): Promise<void> => {
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

const removeEmptyDirectories = async (
  directory: string,
  exclude: string[],
): Promise<void> => {
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
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

Object.entries({
  deleteObject,
  dialog,
  focusedWindowClose,
  focusedWindowIsMaximized,
  focusedWindowMinimize,
  focusedWindowToggleMaximize,
  getObjectBlob,
  getObjectText,
  headObject,
  putObject,
  removeEmptyDirectories,
}).forEach(([apiKey, api]) => {
  contextBridge.exposeInMainWorld(apiKey, api);
});

/* -------------------------------------------------------------------------- */
