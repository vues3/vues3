import type { StreamingBlobPayloadInputTypes } from "@smithy/types";
import type { Dialog } from "electron";

declare global {
  interface Window {
    deleteObject: (Bucket: string, Key: string) => Promise<void>;
    dialog: Dialog;
    focusedWindowClose: () => void;
    focusedWindowIsMaximized: () => boolean | null;
    focusedWindowMinimize: () => void;
    focusedWindowToggleMaximize: () => void;
    getObjectBlob: (Bucket: string, Key: string) => Promise<Blob>;
    getObjectText: (Bucket: string, Key: string) => Promise<string>;
    headObject: (Bucket: string, Key: string) => Promise<null>;
    MonacoEnvironment: Environment;
    putObject: (
      Bucket: string,
      Key: string,
      body: StreamingBlobPayloadInputTypes,
    ) => Promise<void>;
    removeEmptyDirectories: (
      directory: string,
      exclude?: string[],
    ) => Promise<void>;
  }
}
