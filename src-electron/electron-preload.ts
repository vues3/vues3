import { dialog } from "@electron/remote";
import { contextBridge } from "electron";
import { lstatSync } from "fs";
import { access, mkdir, readFile, stat, writeFile } from "fs/promises";
import { dirname, join } from "path";

const throwIfNoEntry = false;
const recursive = true;
contextBridge.exposeInMainWorld("dialog", dialog);
contextBridge.exposeInMainWorld(
  "isDirectory",
  (path: string) => lstatSync(path, { throwIfNoEntry })?.isDirectory() ?? false,
);
contextBridge.exposeInMainWorld("headBucket", async (Bucket: string) => {
  const stats = await stat(Bucket);
  if (!stats.isDirectory()) throw new Error("It's not a directory");
});
contextBridge.exposeInMainWorld(
  "headObject",
  async (Bucket: string, Key: string) => {
    const stats = await stat(join(Bucket, Key));
    if (!stats.isFile()) throw new Error("It's not a file");
  },
);
contextBridge.exposeInMainWorld(
  "putObject",
  async (Bucket: string, Key: string, body: string | Uint8Array) => {
    const filePath = join(Bucket, Key);
    const dirName = dirname(filePath);
    try {
      await access(dirName);
    } catch {
      await mkdir(dirName, { recursive });
    }
    await writeFile(filePath, Buffer.from(body));
  },
);
const getObject = async (Bucket: string, Key: string) => {
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
contextBridge.exposeInMainWorld(
  "getObjectText",
  async (Bucket: string, Key: string) => (await getObject(Bucket, Key)).text(),
);
contextBridge.exposeInMainWorld(
  "getObjectBlob",
  async (Bucket: string, Key: string) => (await getObject(Bucket, Key)).blob(),
);
