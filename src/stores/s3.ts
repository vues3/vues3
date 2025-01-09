/* -------------------------------------------------------------------------- */
/*                                   Imports                                  */
/* -------------------------------------------------------------------------- */

import type {
  HeadObjectCommandOutput,
  S3ClientConfig,
} from "@aws-sdk/client-s3";
import type { StreamingBlobPayloadInputTypes } from "@smithy/types";
import type { TCredentials } from "@vues3/shared";
import type { RemovableRef } from "@vueuse/core";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";
import { validateCredentials } from "@vues3/shared";
import { useStorage } from "@vueuse/core";
import CryptoJS from "crypto-js";
import { mergeDefaults } from "stores/defaults";

/* -------------------------------------------------------------------------- */
/*                                   Objects                                  */
/* -------------------------------------------------------------------------- */

/**
 * The HTTP handler to use or its constructor options. Fetch in browser and
 * Https in Nodejs.
 */

const requestHandler: FetchHttpHandler = new FetchHttpHandler();

/* -------------------------------------------------------------------------- */

/** There are no empty directories on S3 */

const removeEmptyDirectories = null;

/* -------------------------------------------------------------------------- */
/*                                  Variables                                 */
/* -------------------------------------------------------------------------- */

/** S3 Client Class */

let s3Client: null | S3Client = null;

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

/** Generate a default value for the credentials storage */

const credentialDefaults: () => TCredentials = () => {
  const value = {} as TCredentials;
  validateCredentials?.(value) as boolean;
  return value;
};

/* -------------------------------------------------------------------------- */
/*                                 References                                 */
/* -------------------------------------------------------------------------- */

/** A credential storage reference */

const credential: RemovableRef<TCredentials> = useStorage(
  "@",
  credentialDefaults,
  localStorage,
  { mergeDefaults },
);

/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */

/** S3 client class setter */

const setS3Client: (value: null | S3Client) => void = (value) => {
  s3Client?.destroy();
  s3Client = value;
};

/* -------------------------------------------------------------------------- */

/**
 * You can use this operation to determine if a bucket exists and if you have
 * permission to access it.
 */

const headBucket: (
  Bucket: string,
  pin: null | string,
) => Promise<void> = async (Bucket, pin) => {
  let { accessKeyId, endpoint, region, secretAccessKey } =
    credential.value[Bucket] ?? {};
  if (pin) {
    accessKeyId = CryptoJS.AES.decrypt(accessKeyId ?? "", pin).toString(
      CryptoJS.enc.Utf8,
    );
    endpoint = CryptoJS.AES.decrypt(endpoint ?? "", pin).toString(
      CryptoJS.enc.Utf8,
    );
    region = CryptoJS.AES.decrypt(region ?? "", pin).toString(
      CryptoJS.enc.Utf8,
    );
    secretAccessKey = CryptoJS.AES.decrypt(secretAccessKey ?? "", pin).toString(
      CryptoJS.enc.Utf8,
    );
  }
  const credentials = { accessKeyId, secretAccessKey };
  s3Client = new S3Client({
    credentials,
    endpoint,
    region,
    requestHandler,
  } as S3ClientConfig);
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket }));
  } catch (err) {
    setS3Client(null);
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
  Bucket: string,
  Key: string,
  ResponseCacheControl?: string,
) => Promise<HeadObjectCommandOutput | null> = async (
  Bucket,
  Key,
  ResponseCacheControl,
) =>
  s3Client?.send(
    new HeadObjectCommand({ Bucket, Key, ResponseCacheControl }),
  ) ?? null;

/* -------------------------------------------------------------------------- */

/** Adds an object to a bucket */

const putObject: (
  Bucket: string,
  Key: string,
  body: StreamingBlobPayloadInputTypes,
  ContentType: string,
) => Promise<void> = async (Bucket, Key, body, ContentType) => {
  const Body = typeof body === "string" ? new TextEncoder().encode(body) : body;
  await s3Client?.send(
    new PutObjectCommand({ Body, Bucket, ContentType, Key }),
  );
};

/* -------------------------------------------------------------------------- */

/** Removes an object from a bucket */

const deleteObject: (Bucket: string, Key: string) => Promise<void> = async (
  Bucket,
  Key,
) => {
  await s3Client?.send(new DeleteObjectCommand({ Bucket, Key }));
};

/* -------------------------------------------------------------------------- */

/** Retrieves an object */

const getObject = async (
  Bucket: string,
  Key: string,
  ResponseCacheControl?: string,
) => {
  if (s3Client)
    try {
      const { Body, ContentType } = await s3Client.send(
        new GetObjectCommand({ Bucket, Key, ResponseCacheControl }),
      );
      const headers = new Headers({ "content-type": ContentType ?? "" });
      return new Response(Body as BodyInit, { headers });
    } catch {
      //
    }
  return new Response();
};

/* -------------------------------------------------------------------------- */

/** Retrieves a text object */

const getObjectText: (
  Bucket: string,
  Key: string,
  ResponseCacheControl?: string,
) => Promise<string> = async (Bucket, Key, ResponseCacheControl) =>
  (await getObject(Bucket, Key, ResponseCacheControl)).text();

/* -------------------------------------------------------------------------- */

/** Retrieves a blob object */

const getObjectBlob: (
  Bucket: string,
  Key: string,
  ResponseCacheControl?: string,
) => Promise<Blob> = async (Bucket, Key, ResponseCacheControl) =>
  (await getObject(Bucket, Key, ResponseCacheControl)).blob();

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export {
  credential,
  deleteObject,
  getObjectBlob,
  getObjectText,
  headBucket,
  headObject,
  putObject,
  removeEmptyDirectories,
  setS3Client,
};

/* -------------------------------------------------------------------------- */
