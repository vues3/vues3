import type { S3Client } from "@aws-sdk/client-s3";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { StreamingBlobPayloadInputTypes } from "@smithy/types";
import type { Ref } from "vue";
import { computed, ref } from "vue";

/**
 * Корзина в сервисе s3
 *
 * @type {string}
 */
export const bucket = ref("");

/**
 * Путь к сайту через сервис s3
 *
 * @type {string}
 */
export const wendpoint = ref("");

/**
 * Клиент к сервису s3
 *
 * @type {Ref<S3Client | undefined>}
 */
export const S3: Ref<S3Client | undefined> = ref();

/**
 * Считывание заголовка файла
 *
 * @param {string} Key Имя файла
 * @returns {object} Заголовок файла
 */
export const headObject = (Key: string) => {
  const Bucket = bucket.value;
  return S3.value?.send(new HeadObjectCommand({ Bucket, Key }));
};

/**
 * Запись объекта
 *
 * @param {string} Key Имя файла
 * @param {string} ContentType Тип mime
 * @param {StreamingBlobPayloadInputTypes} body Тело файла
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
 * @param {string} Key Имя файла
 * @param {string} ContentType Тип mime
 * @param {File} file Файл
 */
export const putFile = async (Key: string, ContentType: string, file: File) => {
  await putObject(Key, ContentType, new Blob([await file.arrayBuffer()]));
};

/**
 * Считывание объекта
 *
 * @param {string} Key Имя файла
 * @returns {Promise<string | undefined>} Тело файла
 */
export const getObject = async (Key: string): Promise<string | undefined> => {
  const Bucket = bucket.value;
  const ResponseCacheControl = "no-store";
  const textDecoder = new TextDecoder();
  let ret: string | undefined;
  if (S3.value)
    try {
      const { Body } = await S3.value.send(
        new GetObjectCommand({ ResponseCacheControl, Bucket, Key }),
      );
      const reader = (Body as ReadableStream)?.getReader();
      ret = await new Promise((resolve) => {
        (async function read(chunks) {
          const { done, value } = await reader.read();
          if (done) resolve(chunks.join(""));
          else {
            chunks.push(textDecoder.decode(value));
            read(chunks);
          }
        })([] as string[]);
      });
    } catch (e) {
      //
    }
  return ret;
};

export const base = computed(
  () =>
    S3?.value &&
    `${wendpoint.value ? wendpoint.value : "https:/"}/${bucket.value}`,
);
