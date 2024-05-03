import type { S3Client } from "@aws-sdk/client-s3";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { StreamingBlobPayloadInputTypes } from "@smithy/types";
import type { Ref } from "vue";
import { computed, ref } from "vue";

/** Корзина в сервисе s3 */
export const bucket = ref("");

/** Путь к сайту через сервис s3 */
export const wendpoint = ref("");

/** Клиент к сервису s3 */
export const S3: Ref<S3Client | undefined> = ref();

/**
 * Считывание заголовка файла
 *
 * @param Key Имя файла
 * @returns Заголовок файла
 */
export const headObject = (Key: string) => {
  const Bucket = bucket.value;
  return S3.value?.send(new HeadObjectCommand({ Bucket, Key }));
};

/**
 * Запись объекта
 *
 * @param Key Имя файла
 * @param ContentType Тип mime
 * @param body Тело файла
 */
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

/**
 * Запись файла
 *
 * @param Key Имя файла
 * @param ContentType Тип mime
 * @param file Файл
 */
export const putFile = async (Key: string, ContentType: string, file: File) => {
  await putObject(Key, ContentType, new Blob([await file.arrayBuffer()]));
};

/**
 * Считывание объекта
 *
 * @param Key Имя файла
 * @param [ResponseCacheControl] - Параметры кеша
 * @returns Тело файла
 */
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
