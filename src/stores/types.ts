import type { ValidateFunction } from "ajv";

import Ajv from "ajv";
import dynamicDefaults from "ajv-keywords/dist/definitions/dynamicDefaults";
import Config from "app/src/schemas/config";
import Credentials from "app/src/schemas/credentials";
import Data, { plainData } from "app/src/schemas/data";
import Settings from "app/src/schemas/settings";
import View, { plainView } from "app/src/schemas/view";
import {
  coerceTypes,
  esm,
  removeAdditional,
  useDefaults,
} from "app/src/stores/defaults";
import { FromSchema } from "json-schema-to-ts";
import uuid from "uuid-random";

export type TView = {
  branch: TView[];
  children?: TView[];
  css: string;
  htm: string;
  html: Promise<string> | string;
  index: number;
  js: string;
  next?: TView;
  parent?: TView;
  path: string;
  prev?: TView;
  script: Promise<string> | string;
  siblings: TView[];
  style: Promise<string> | string;
  template: Promise<string> | string;
  title: string;
  url: string;
  views: TView[];
} & FromSchema<typeof plainView>;
export type TSettings = FromSchema<typeof Settings>;
export type TData = {
  content: TView[];
} & FromSchema<typeof plainData, { references: [typeof Settings] }>;
dynamicDefaults.DEFAULTS.uuid = (): (() => string) => () => uuid();
const code = { esm };
export type TCredentials = FromSchema<typeof Credentials>;
export type TConfig = FromSchema<typeof Config>;
const schemas = [Config, Credentials, View, Settings, Data];
const keywords = [dynamicDefaults()];
const ajv = new Ajv({
  code,
  coerceTypes,
  keywords,
  removeAdditional,
  schemas,
  useDefaults,
});
export const validateConfig = ajv.getSchema(
  "urn:jsonschema:config",
) as ValidateFunction;
export const validateSettings = ajv.getSchema(
  "urn:jsonschema:settings",
) as ValidateFunction;
export const validateCredentials = ajv.getSchema(
  "urn:jsonschema:credentials",
) as ValidateFunction;
export const validate = ajv.getSchema(
  "urn:jsonschema:data",
) as ValidateFunction;
