/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type { HeadObjectCommandOutput } from "@aws-sdk/client-s3";
import type { StreamingBlobPayloadInputTypes } from "@smithy/types";
import type { Ref } from "vue";

import * as fsa from "stores/fsa";
import * as s3 from "stores/s3";
import { ref, watch } from "vue";

/* -------------------------------------------------------------------------- */
/*                                 References                                 */
/* -------------------------------------------------------------------------- */

/** Bucket name */

const bucket: Ref<string> = ref("");

/* -------------------------------------------------------------------------- */

/** Remote flag */

const remote: Ref<boolean> = ref(false);

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */

/**
 * The FileSystemDirectoryHandle interface of the File System API provides a
 * handle to a file system directory.
 */

let fileSystemDirectoryHandle: FileSystemDirectoryHandle | null = null;

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

/** FileSystemDirectoryHandle setter */

const setFileSystemDirectoryHandle: (
  value: FileSystemDirectoryHandle,
) => void = (value) => {
  fileSystemDirectoryHandle = value;
};

/* -------------------------------------------------------------------------- */

/** IO system selector */

const io: () => typeof s3 | Window = () => (remote.value ? s3 : window);

/* -------------------------------------------------------------------------- */

/**
 * You can use this operation to determine if a bucket exists and if you have
 * permission to access it.
 */

const headBucket: (
  Bucket: string,
  pin: null | string,
) => Promise<void> = async (Bucket, pin) => {
  try {
    await s3.headBucket(Bucket, pin);
    remote.value = true;
  } catch (err) {
    const { message } = err as Error;
    throw new Error(message);
  }
};

/* -------------------------------------------------------------------------- */

/**
 * The HEAD operation retrieves metadata from an object without returning the
 * object itself. This operation is useful if you're interested only in an
 * object's metadata.
 */

const headObject: (
  Key: string,
  ResponseCacheControl?: string,
) => Promise<HeadObjectCommandOutput | null> = async (
  Key,
  ResponseCacheControl,
) => {
  if (fileSystemDirectoryHandle)
    return fsa.headObject(fileSystemDirectoryHandle, Key);
  return io().headObject(bucket.value, Key, ResponseCacheControl);
};

/* -------------------------------------------------------------------------- */

/** Adds an object to a bucket */

const putObject: (
  Key: string,
  body: StreamingBlobPayloadInputTypes,
  ContentType: string,
) => Promise<void> = async (Key, body, ContentType) => {
  if (bucket.value)
    if (fileSystemDirectoryHandle)
      await fsa.putObject(fileSystemDirectoryHandle, Key, body);
    else await io().putObject(bucket.value, Key, body, ContentType);
};

/* -------------------------------------------------------------------------- */

/** Remove empty directories */

const removeEmptyDirectories: () => Promise<void> = async () => {
  const exclude = ["node_modules", ".git"];
  if (bucket.value)
    if (fileSystemDirectoryHandle)
      await fsa.removeEmptyDirectories(fileSystemDirectoryHandle, exclude);
    else await io().removeEmptyDirectories?.(bucket.value, exclude);
};

/* -------------------------------------------------------------------------- */

/** Removes an object from a bucket */

const deleteObject: (Key: string) => Promise<void> = async (Key) => {
  if (bucket.value)
    if (fileSystemDirectoryHandle)
      await fsa.deleteObject(fileSystemDirectoryHandle, Key);
    else await io().deleteObject(bucket.value, Key);
};

/* -------------------------------------------------------------------------- */

/** Retrieves a text object */

const getObjectText: (
  Key: string,
  ResponseCacheControl?: string,
) => Promise<string> = async (Key, ResponseCacheControl) => {
  if (fileSystemDirectoryHandle)
    return fsa.getObjectText(fileSystemDirectoryHandle, Key);
  return io().getObjectText(bucket.value, Key, ResponseCacheControl);
};

/* -------------------------------------------------------------------------- */

/** Retrieves a blob object */

const getObjectBlob: (
  Key: string,
  ResponseCacheControl?: string,
) => Promise<Blob> = async (Key, ResponseCacheControl) => {
  if (fileSystemDirectoryHandle)
    return fsa.getObjectBlob(fileSystemDirectoryHandle, Key);
  return io().getObjectBlob(bucket.value, Key, ResponseCacheControl);
};

/* -------------------------------------------------------------------------- */

/** A callback function for the bucket watcher */

const cbBucket: (value: string) => void = (value) => {
  if (!value) {
    s3.setS3Client(null);
    remote.value = false;
    if (fileSystemDirectoryHandle) fileSystemDirectoryHandle = null;
  }
};

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

watch(bucket, cbBucket);

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export {
  bucket,
  deleteObject,
  getObjectBlob,
  getObjectText,
  headBucket,
  headObject,
  putObject,
  removeEmptyDirectories,
  setFileSystemDirectoryHandle,
};

/* -------------------------------------------------------------------------- */
