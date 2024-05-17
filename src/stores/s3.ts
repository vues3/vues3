import type { S3Client } from "@aws-sdk/client-s3";
import type { StreamingBlobPayloadInputTypes } from "@smithy/types";
import type { ShallowRef } from "vue";

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { ref, shallowRef } from "vue";

export const bucket = ref("");
export const S3: ShallowRef<S3Client | undefined> = shallowRef();
export const headObject = (Key: string) => {
  const Bucket = bucket.value;
  return S3.value?.send(new HeadObjectCommand({ Bucket, Key }));
};
export const putObject = async (
  Key: string,
  ContentType: string,
  body: StreamingBlobPayloadInputTypes,
) => {
  const Bucket = bucket.value;
  const Body = typeof body === "string" ? new TextEncoder().encode(body) : body;
  await S3.value?.send(
    new PutObjectCommand({ Body, Bucket, ContentType, Key }),
  );
};
export const putFile = async (Key: string, ContentType: string, file: File) => {
  await putObject(Key, ContentType, new Blob([await file.arrayBuffer()]));
};
export const getObject = async (Key: string, ResponseCacheControl?: string) => {
  const Bucket = bucket.value;
  if (S3.value)
    try {
      const { Body } = await S3.value.send(
        new GetObjectCommand({ Bucket, Key, ResponseCacheControl }),
      );
      return new Response(Body as BodyInit);
    } catch (e) {
      //
    }
  return new Response();
};
