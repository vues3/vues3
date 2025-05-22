import type { S3ClientConfig } from "@aws-sdk/client-s3";
import type { StreamingBlobPayloadInputTypes } from "@smithy/types";
import type { TCredentials } from "@vuebro/shared";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";
import { validateCredentials } from "@vuebro/shared";
import { useStorage } from "@vueuse/core";
import CryptoJS from "crypto-js";
import { mergeDefaults } from "stores/defaults";

/* -------------------------------------------------------------------------- */

let s3Client: S3Client | undefined;

/* -------------------------------------------------------------------------- */

const credential = useStorage(
    "@",
    () => {
      const value = {} as TCredentials;
      validateCredentials?.(value) as boolean;
      return value;
    },
    localStorage,
    { mergeDefaults },
  ),
  removeEmptyDirectories = undefined,
  requestHandler = new FetchHttpHandler();

/* -------------------------------------------------------------------------- */

const setS3Client = (value?: S3Client) => {
  s3Client?.destroy();
  s3Client = value;
};
const deleteObject = async (Bucket: string, Key: string) => {
    await s3Client?.send(new DeleteObjectCommand({ Bucket, Key }));
  },
  getObject = async (
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
  },
  getObjectBlob = async (
    Bucket: string,
    Key: string,
    ResponseCacheControl?: string,
  ) => (await getObject(Bucket, Key, ResponseCacheControl)).blob(),
  getObjectText = async (
    Bucket: string,
    Key: string,
    ResponseCacheControl?: string,
  ) => (await getObject(Bucket, Key, ResponseCacheControl)).text(),
  headBucket = async (Bucket: string, pin: string | undefined) => {
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
      secretAccessKey = CryptoJS.AES.decrypt(
        secretAccessKey ?? "",
        pin,
      ).toString(CryptoJS.enc.Utf8);
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
      setS3Client();
      const { message } = err as Error;
      throw new Error(message);
    }
  },
  headObject = async (
    Bucket: string,
    Key: string,
    ResponseCacheControl?: string,
  ) =>
    s3Client?.send(
      new HeadObjectCommand({ Bucket, Key, ResponseCacheControl }),
    ),
  putObject = async (
    Bucket: string,
    Key: string,
    body: StreamingBlobPayloadInputTypes,
    ContentType: string,
  ) => {
    const Body =
      typeof body === "string" ? new TextEncoder().encode(body) : body;
    await s3Client?.send(
      new PutObjectCommand({ Body, Bucket, ContentType, Key }),
    );
  };

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
