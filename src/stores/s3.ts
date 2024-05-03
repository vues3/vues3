import type { S3Client } from "@aws-sdk/client-s3";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { StreamingBlobPayloadInputTypes } from "@smithy/types";
import type { Ref } from "vue";
import { computed, ref } from "vue";

export const bucket = ref("");
export const wendpoint = ref("");
export const S3: Ref<S3Client | undefined> = ref();
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
    new PutObjectCommand({ Bucket, Key, ContentType, Body }),
  );
};
export const putFile = async (Key: string, ContentType: string, file: File) => {
  await putObject(Key, ContentType, new Blob([await file.arrayBuffer()]));
};
export const getObject = async (
  Key: string,
  ResponseCacheControl?: string,
): Promise<Response> => {
  const Bucket = bucket.value;
  if (S3.value)
    try {
      const { Body } = await S3.value.send(
        new GetObjectCommand({ ResponseCacheControl, Bucket, Key }),
      );
      return new Response(<BodyInit>Body);
    } catch (e) {
      //
    }
  return new Response();
};

export const base = computed(
  () =>
    S3.value &&
    `${wendpoint.value ? wendpoint.value : "https:/"}/${bucket.value}`,
);
