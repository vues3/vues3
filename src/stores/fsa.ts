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

const create = true;

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

const getHandle: (
  Bucket: FileSystemDirectoryHandle,
  Key: string,
) => Promise<FileSystemDirectoryHandle | FileSystemFileHandle | null> = async (
  Bucket,
  Key,
) => {
  const branch = [null, ...Key.split("/")];
  const callbackfnBranch: (
    leaf: null | string,
    index: number,
  ) => (
    resultAggregator: RunSequentialPromisesFulfilledResult<
      number,
      FileSystemDirectoryHandle | FileSystemFileHandle | null
    >[],
  ) => Promise<FileSystemDirectoryHandle | FileSystemFileHandle | null> =
    (leaf, index) => async (resultAggregator) => {
      if (!leaf) return Bucket;
      const { value = null } = resultAggregator[index - 1] ?? {};
      if (value instanceof FileSystemDirectoryHandle) {
        const entries = await Array.fromAsync(value.entries());
        const [, handle = null] = entries.find(([key]) => key === leaf) ?? [];
        return handle;
      }
      return null;
    };
  const handle = (
    await runSequentialPromises(branch.map(callbackfnBranch))
  ).map(({ value }) => value);
  return branch.length === handle.length
    ? (handle[handle.length - 1] ?? null)
    : null;
};

/* -------------------------------------------------------------------------- */

const headObject: (
  Bucket: FileSystemDirectoryHandle,
  Key: string,
) => Promise<null> = async (Bucket, Key) => {
  const handle = await getHandle(Bucket, Key);
  if (handle instanceof FileSystemFileHandle) return null;
  throw new Error("It's not a file");
};

/* -------------------------------------------------------------------------- */

const deleteObject: (
  Bucket: FileSystemDirectoryHandle,
  Key: string,
) => Promise<void> = async (Bucket, Key) => {
  const keys = Key.split("/");
  const name = keys.pop();
  if (name) {
    const handle = await getHandle(Bucket, keys.slice(0, -1).join("/"));
    if (handle instanceof FileSystemDirectoryHandle)
      await handle.removeEntry(name);
  }
};

/* -------------------------------------------------------------------------- */

const putObject: (
  Bucket: FileSystemDirectoryHandle,
  Key: string,
  body: StreamingBlobPayloadInputTypes,
) => Promise<void> = async (Bucket, Key, body) => {
  const keys = Key.split("/");
  const name = keys.pop();
  if (name) {
    const handle = await getHandle(Bucket, keys.slice(0, -1).join("/"));
    if (handle instanceof FileSystemDirectoryHandle) {
      const fileHandle = await handle.getFileHandle(name, { create });
      const writable = await fileHandle.createWritable();
      await writable.write(body as FileSystemWriteChunkType);
      await writable.close();
    }
  }
};
/* -------------------------------------------------------------------------- */

/** Retrieves a blob object */

const getObjectBlob: (
  Bucket: FileSystemDirectoryHandle,
  Key: string,
) => Promise<Blob> = async (Bucket, Key) => {
  const handle = await getHandle(Bucket, Key);
  if (handle instanceof FileSystemFileHandle) return handle.getFile();
  return new Blob();
};
// (await Bucket.getFileHandle(Key)).getFile();

/* -------------------------------------------------------------------------- */

/** Retrieves a text object */

const getObjectText: (
  Bucket: FileSystemDirectoryHandle,
  Key: string,
) => Promise<string> = async (Bucket, Key) =>
  (await getObjectBlob(Bucket, Key)).text();

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export {
  deleteObject,
  getHandle,
  getObjectBlob,
  getObjectText,
  headObject,
  putObject,
};

/* -------------------------------------------------------------------------- */
