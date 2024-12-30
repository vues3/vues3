import type { StreamingBlobPayloadInputTypes } from "@smithy/types";
import type { Dialog } from "electron";

declare global {
  interface Window {
    deleteObject: (Bucket: string, Key: string) => Promise<undefined>;
    dialog: Dialog;
    focusedWindowClose: () => void;
    focusedWindowIsMaximized: () => boolean;
    focusedWindowMinimize: () => void;
    focusedWindowToggleMaximize: () => void;
    getObjectBlob: (
      Bucket: string,
      Key: string,
      ResponseCacheControl?: string,
    ) => Promise<Blob>;
    getObjectText: (
      Bucket: string,
      Key: string,
      ResponseCacheControl?: string,
    ) => Promise<string>;
    headObject: (
      Bucket: string,
      Key: string,
      ResponseCacheControl?: string,
    ) => Promise<undefined>;
    MonacoEnvironment: Environment;
    putObject: (
      Bucket: string,
      Key: string,
      body: StreamingBlobPayloadInputTypes,
      ContentType: string,
    ) => Promise<undefined>;
    removeEmptyDirectories?: (Bucket: string) => Promise<undefined>;
  }
}
