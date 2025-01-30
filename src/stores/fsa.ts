/* -------------------------------------------------------------------------- */

import type { StreamingBlobPayloadInputTypes } from "@smithy/types";
import type { RunSequentialPromisesFulfilledResult } from "quasar";

import { runSequentialPromises } from "quasar";

/* -------------------------------------------------------------------------- */

const create = true;

/* -------------------------------------------------------------------------- */

const getHandle = async (
  Bucket: FileSystemDirectoryHandle,
  Key: string,
  Create = false,
) => {
  const branch = [undefined, ...Key.split("/")],
    handle = (
      await runSequentialPromises(
        branch.map(
          (leaf, index) =>
            async (
              resultAggregator: RunSequentialPromisesFulfilledResult<
                number,
                FileSystemDirectoryHandle | FileSystemFileHandle | undefined
              >[],
            ) => {
              if (!leaf) return Bucket;
              const { value } = resultAggregator[index - 1] ?? {};
              if (value?.kind === "directory")
                return (
                  (await Array.fromAsync(value.values())).find(
                    ({ name }) => name === leaf,
                  ) ??
                  (Create
                    ? await value.getDirectoryHandle(leaf, { create })
                    : undefined)
                );
              return undefined;
            },
        ),
      )
    ).map(({ value }) => value);
  return branch.length === handle.length
    ? handle[handle.length - 1]
    : undefined;
};
const deleteObject = async (Bucket: FileSystemDirectoryHandle, Key: string) => {
    const keys = Key.split("/"),
      name = keys.pop();
    if (name) {
      const handle = await getHandle(Bucket, keys.join("/"));
      if (handle?.kind === "directory") await handle.removeEntry(name);
    }
  },
  getObjectBlob = async (Bucket: FileSystemDirectoryHandle, Key: string) => {
    const handle = await getHandle(Bucket, Key);
    if (handle?.kind === "file") return handle.getFile();
    return new Blob();
  },
  getObjectText = async (Bucket: FileSystemDirectoryHandle, Key: string) =>
    (await getObjectBlob(Bucket, Key)).text(),
  headObject = async (Bucket: FileSystemDirectoryHandle, Key: string) => {
    const handle = await getHandle(Bucket, Key);
    if (handle?.kind === "file") return undefined;
    throw new Error("It's not a file");
  },
  putObject = async (
    Bucket: FileSystemDirectoryHandle,
    Key: string,
    body: StreamingBlobPayloadInputTypes,
  ) => {
    const keys = Key.split("/"),
      name = keys.pop();
    if (name) {
      const handle = await getHandle(Bucket, keys.join("/"), true);
      if (handle?.kind === "directory") {
        const fileHandle = await handle.getFileHandle(name, { create }),
          writable = await fileHandle.createWritable();
        await writable.write(body as FileSystemWriteChunkType);
        await writable.close();
      }
    }
  },
  removeEmptyDirectories = async (
    directory: FileSystemDirectoryHandle,
    exclude: string[],
  ) => {
    if (exclude.includes(directory.name)) return;
    const values = (await Array.fromAsync(directory.values())).filter(
      ({ kind }) => kind === "directory",
    );
    await Promise.all(
      values.map((value) =>
        removeEmptyDirectories(value as FileSystemDirectoryHandle, exclude),
      ),
    );
    await Promise.allSettled(
      values.map(({ name }) => directory.removeEntry(name)),
    );
  };

/* -------------------------------------------------------------------------- */

export {
  deleteObject,
  getObjectBlob,
  getObjectText,
  headObject,
  putObject,
  removeEmptyDirectories,
};
