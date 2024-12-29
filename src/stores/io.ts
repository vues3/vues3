import type { StreamingBlobPayloadInputTypes } from "@smithy/types";

import * as s3 from "stores/s3";
import { ref, watch } from "vue";

export const bucket = ref("");
const io = (Bucket: string = bucket.value) =>
  window.isDirectory?.(Bucket) ? window : s3;
export const headBucket = async (Bucket: string, pin?: string) => {
  await io(Bucket).headBucket(Bucket, pin);
};
export const headObject = async (Key: string, ResponseCacheControl?: string) =>
  io().headObject(bucket.value, Key, ResponseCacheControl);
export const putObject = async (
  Key: string,
  body: StreamingBlobPayloadInputTypes,
  ContentType: string,
) => {
  await io().putObject(bucket.value, Key, body, ContentType);
};
export const removeEmptyDirectories = async () => {
  await io().removeEmptyDirectories?.(bucket.value);
};
export const deleteObject = async (Key: string) => {
  await io().deleteObject(bucket.value, Key);
};
export const getObjectText = async (
  Key: string,
  ResponseCacheControl?: string,
) => io().getObjectText(bucket.value, Key, ResponseCacheControl);
export const getObjectBlob = async (
  Key: string,
  ResponseCacheControl?: string,
) => io().getObjectBlob(bucket.value, Key, ResponseCacheControl);
watch(bucket, (value) => {
  if (!value) s3.setS3Client(undefined);
});
