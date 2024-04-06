import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { get, isDefined } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export default defineStore("s3", () => {
  /**
   * Корзина в сервисе s3
   *
   * @type {string}
   */
  const bucket = ref("");
  /**
   * Путь к сайту через сервис s3
   *
   * @type {string}
   */
  const wendpoint = ref("");
  /**
   * Клиент к сервису s3
   *
   * @type {object}
   */
  const S3 = ref();
  /**
   * Считывание заголовка файла
   *
   * @param {string} Key Имя файла
   * @returns {object} Заголовок файла
   */
  const headObject = async (Key) => {
    const Bucket = get(bucket);
    let head;
    if (isDefined(S3))
      head = await get(S3).send(new HeadObjectCommand({ Bucket, Key }));
    return head;
  };
  /**
   * Запись объекта
   *
   * @param {string} Key Имя файла
   * @param {string} ContentType Тип mime
   * @param {string | Uint8Array | Buffer | Blob} body Тело файла
   */
  const putObject = async (Key, ContentType, body) => {
    const Bucket = get(bucket);
    const Body =
      typeof body === "string" ? new TextEncoder().encode(body) : body;
    if (isDefined(S3))
      await get(S3).send(
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
  const putFile = async (Key, ContentType, file) => {
    await putObject(Key, ContentType, await file.arrayBuffer());
  };
  /**
   * Считывание объекта
   *
   * @param {string} Key Имя файла
   * @returns {string} Тело файла
   */
  const getObject = async (Key) => {
    const Bucket = get(bucket);
    const ResponseCacheControl = "no-cache";
    const textDecoder = new TextDecoder();
    let ret;
    if (isDefined(S3)) {
      const { Body } = await get(S3).send(
        new GetObjectCommand({ ResponseCacheControl, Bucket, Key }),
      );
      const reader = Body.getReader();
      ret = await new Promise((resolve) => {
        (async function read(chunks) {
          const { done, value } = await reader.read();
          if (done) resolve(chunks.join(""));
          else {
            chunks.push(textDecoder.decode(value));
            read(chunks);
          }
        })([]);
      });
    }
    return ret;
  };
  const base = computed(
    () =>
      S3?.value &&
      `${isDefined(wendpoint) ? get(wendpoint) : "htpps:/"}/${get(bucket)}`,
  );
  return {
    ...{ bucket, wendpoint, base },
    ...{ S3, putFile, putObject, getObject, headObject },
  };
});
