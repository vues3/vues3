import type { StreamingBlobPayloadInputTypes } from "@smithy/types";

import * as s3 from "stores/s3";
import { ref, watch } from "vue";

export const bucket = ref("");
export const domain = ref("");
export const isElectron = () => process.env.MODE === "electron";
export const headBucket = async (Bucket: string, pin?: string) => {
  await s3.headBucket(Bucket, pin);
};
export const headObject = async (Key: string, ResponseCacheControl?: string) =>
  s3.headObject(bucket.value, Key, ResponseCacheControl);
export const putObject = async (
  Key: string,
  ContentType: string,
  body: StreamingBlobPayloadInputTypes,
) => {
  await s3.putObject(bucket.value, Key, ContentType, body);
};
export const getObject = async (Key: string, ResponseCacheControl?: string) =>
  s3.getObject(bucket.value, Key, ResponseCacheControl);
watch(bucket, (value) => {
  if (!value) {
    s3.setS3Client(undefined);
    domain.value = "";
  }
});
