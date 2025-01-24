/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { StreamingBlobPayloadInputTypes } from "@smithy/types";
import type { RunSequentialPromisesFulfilledResult } from "quasar";

import { runSequentialPromises } from "quasar";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

/**
 * A Boolean. Default false. When set to true if the file is not found, one with
 * the specified name will be created and returned.
 */

const create: FileSystemGetDirectoryOptions["create"] = true;

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const getHandle = async (
  Bucket: FileSystemDirectoryHandle,
  Key: string,
  Create = false,
): Promise<FileSystemDirectoryHandle | FileSystemFileHandle | undefined> => {
  const branch = [undefined, ...Key.split("/")];
  const handle = (
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

/* -------------------------------------------------------------------------- */

/** Remove empty directories */

const removeEmptyDirectories = async (
  directory: FileSystemDirectoryHandle,
  exclude: string[],
): Promise<void> => {
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

const headObject = async (
  Bucket: FileSystemDirectoryHandle,
  Key: string,
): Promise<undefined> => {
  const handle = await getHandle(Bucket, Key);
  if (handle?.kind === "file") return undefined;
  throw new Error("It's not a file");
};

/* -------------------------------------------------------------------------- */

const deleteObject = async (
  Bucket: FileSystemDirectoryHandle,
  Key: string,
): Promise<void> => {
  const keys = Key.split("/");
  const name = keys.pop();
  if (name) {
    const handle = await getHandle(Bucket, keys.join("/"));
    if (handle?.kind === "directory") await handle.removeEntry(name);
  }
};

/* -------------------------------------------------------------------------- */

const putObject = async (
  Bucket: FileSystemDirectoryHandle,
  Key: string,
  body: StreamingBlobPayloadInputTypes,
): Promise<void> => {
  const keys = Key.split("/");
  const name = keys.pop();
  if (name) {
    const handle = await getHandle(Bucket, keys.join("/"), true);
    if (handle?.kind === "directory") {
      const fileHandle = await handle.getFileHandle(name, { create });
      const writable = await fileHandle.createWritable();
      await writable.write(body as FileSystemWriteChunkType);
      await writable.close();
    }
  }
};
/* -------------------------------------------------------------------------- */

/** Retrieves a blob object */

const getObjectBlob = async (
  Bucket: FileSystemDirectoryHandle,
  Key: string,
): Promise<Blob> => {
  const handle = await getHandle(Bucket, Key);
  if (handle?.kind === "file") return handle.getFile();
  return new Blob();
};

/* -------------------------------------------------------------------------- */

/** Retrieves a text object */

const getObjectText = async (
  Bucket: FileSystemDirectoryHandle,
  Key: string,
): Promise<string> => (await getObjectBlob(Bucket, Key)).text();

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export {
  deleteObject,
  getObjectBlob,
  getObjectText,
  headObject,
  putObject,
  removeEmptyDirectories,
};

/* -------------------------------------------------------------------------- */
