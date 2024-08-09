import type { ValidateFunction } from "ajv";

import Ajv from "ajv";
import dynamicDefaults from "ajv-keywords/dist/definitions/dynamicDefaults";
import Component from "app/src/schemas/component";
import Config from "app/src/schemas/config";
import Credentials from "app/src/schemas/credentials";
import Data from "app/src/schemas/data";
import View, { plainView } from "app/src/schemas/view";
import {
  coerceTypes,
  esm,
  removeAdditional,
  useDefaults,
} from "app/src/stores/defaults";
import { FromSchema } from "json-schema-to-ts";
import uuid from "uuid-random";

export type TComponent = FromSchema<typeof Component>;
export type TView = {
  branch: TView[];
  buffer?: TComponent;
  children?: TView[];
  contenteditable: boolean;
  html: Promise<string> | string;
  i: string;
  index: number;
  next?: TView;
  parent?: TView;
  path: string;
  prev?: TView;
  script: Promise<string> | string;
  sfc: Promise<TComponent>;
  siblings: TView[];
  style: Promise<string> | string;
  template: Promise<string> | string;
  title: string;
  to: string;
  view: TView;
  views: TView[];
} & FromSchema<typeof plainView>;
dynamicDefaults.DEFAULTS.uuid = (): (() => string) => () => uuid();
const code = { esm };
export type TCredentials = FromSchema<typeof Credentials>;
export type TConfig = FromSchema<typeof Config>;
const schemas = [Config, Credentials, View, Data, Component];
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
export const validateComponent = ajv.getSchema(
  "urn:jsonschema:component",
) as ValidateFunction;
export const validateCredentials = ajv.getSchema(
  "urn:jsonschema:credentials",
) as ValidateFunction;
export const validateData = ajv.getSchema(
  "urn:jsonschema:data",
) as ValidateFunction;
