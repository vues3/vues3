import type { S3ClientConfig } from "@aws-sdk/client-s3";
import type { StreamingBlobPayloadInputTypes } from "@smithy/types";
import type { TCredentials } from "stores/types";

import {
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";
import { useStorage } from "@vueuse/core";
import CryptoJS from "crypto-js";
import { mergeDefaults } from "stores/defaults";
import { validateCredentials } from "stores/types";

let s3Client: S3Client | undefined;
const requestHandler = new FetchHttpHandler();
const creds = useStorage(
  "@",
  () => {
    const value = {} as TCredentials;
    validateCredentials(value);
    return value;
  },
  localStorage,
  { mergeDefaults },
);
export const setS3Client = (value?: S3Client) => {
  if (!value) s3Client?.destroy();
  s3Client = value;
};
export const headBucket = async (Bucket: string, pin?: string) => {
  let { accessKeyId, endpoint, region, secretAccessKey } = creds.value[Bucket];
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
    setS3Client(undefined);
    const { message } = err as Error;
    throw new Error(message);
  }
};
export const headObject = async (
  Bucket: string,
  Key: string,
  ResponseCacheControl?: string,
) =>
  s3Client?.send(new HeadObjectCommand({ Bucket, Key, ResponseCacheControl }));
export const putObject = async (
  Bucket: string,
  Key: string,
  ContentType: string,
  body: StreamingBlobPayloadInputTypes,
) => {
  const Body = typeof body === "string" ? new TextEncoder().encode(body) : body;
  await s3Client?.send(
    new PutObjectCommand({ Body, Bucket, ContentType, Key }),
  );
};
export const getObject = async (
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
    } catch (e) {
      //
    }
  return new Response();
};
